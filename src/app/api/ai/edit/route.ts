import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { google } from "@ai-sdk/google";
import { generateText } from "ai";

export async function POST(request: NextRequest) {
    try {
        // Get authenticated user
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { currentContent, editRequest } = await request.json();

        if (!currentContent || !editRequest) {
            return NextResponse.json(
                { error: "Current content and edit request are required" },
                { status: 400 }
            );
        }

        // Use Gemini to edit content
        const model = google("gemini-2.0-flash-exp");

        const result = await generateText({
            model,
            prompt: `You are a content editor. Edit the following content based on the request.

Current Content:
${JSON.stringify(currentContent, null, 2)}

Edit Request: ${editRequest}

Rules:
- Keep the same JSON structure
- Apply the requested changes precisely
- Maintain platform character limits (LinkedIn: 300 chars, Twitter: 280 chars, Title: 100 chars, Summary: 200 chars)

Return ONLY a JSON object with the edited content:
{
  "title": "edited title",
  "linkedinPost": "edited linkedin post",
  "twitterPost": "edited twitter post",
  "summary": "edited summary"
}`,
        });

        let editedContent;
        try {
            const jsonMatch = result.text.match(/\{[\s\S]*\}/);
            editedContent = jsonMatch ? JSON.parse(jsonMatch[0]) : currentContent;
        } catch {
            editedContent = currentContent;
        }

        return NextResponse.json({
            success: true,
            ...editedContent,
        });
    } catch (error) {
        console.error("Error editing content:", error);
        return NextResponse.json(
            {
                error: "Failed to edit content",
                details: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        );
    }
}

