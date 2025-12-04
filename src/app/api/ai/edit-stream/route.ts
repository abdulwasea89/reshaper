import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { google } from "@ai-sdk/google";
import { generateText } from "ai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ContentOutput {
    title: string;
    linkedinPost: string;
    twitterPost: string;
    summary: string;
}

export async function POST(request: NextRequest) {
    const encoder = new TextEncoder();

    try {
        // Get authenticated user
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user) {
            return new Response(
                JSON.stringify({ error: "Unauthorized" }),
                { status: 401, headers: { "Content-Type": "application/json" } }
            );
        }

        const { currentContent, editRequest } = await request.json();

        if (!currentContent || !editRequest) {
            return new Response(
                JSON.stringify({ error: "Current content and edit request are required" }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        // Create streaming response
        const stream = new ReadableStream({
            async start(controller) {
                try {
                    // Send start message
                    controller.enqueue(
                        encoder.encode(`data: ${JSON.stringify({ type: "start", message: "Editing content..." })}\n\n`)
                    );

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
- Maintain platform character limits

Return ONLY a JSON object:
{
  "title": "edited title",
  "linkedinPost": "edited linkedin post",
  "twitterPost": "edited twitter post",
  "summary": "edited summary"
}`,
                    });

                    let editedContent: ContentOutput;
                    try {
                        const jsonMatch = result.text.match(/\{[\s\S]*\}/);
                        editedContent = jsonMatch ? JSON.parse(jsonMatch[0]) : currentContent;
                    } catch {
                        editedContent = currentContent as ContentOutput;
                    }

                    // Create a natural response message
                    const responseMessage = `I've updated your content based on your request: "${editRequest}". The changes have been applied to your posts.`;

                    // Send response message first
                    controller.enqueue(
                        encoder.encode(
                            `data: ${JSON.stringify({
                                type: "message",
                                message: responseMessage,
                            })}\n\n`
                        )
                    );

                    // Then stream the edited content
                    controller.enqueue(
                        encoder.encode(
                            `data: ${JSON.stringify({
                                type: "complete",
                                ...editedContent,
                            })}\n\n`
                        )
                    );

                    controller.enqueue(encoder.encode("data: [DONE]\n\n"));
                    controller.close();
                } catch (error) {
                    console.error("Error editing content:", error);
                    controller.enqueue(
                        encoder.encode(
                            `data: ${JSON.stringify({
                                type: "error",
                                error: error instanceof Error ? error.message : "Unknown error",
                            })}\n\n`
                        )
                    );
                    controller.close();
                }
            },
        });

        return new Response(stream, {
            headers: {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
            },
        });
    } catch (error) {
        console.error("Error in edit stream:", error);
        return NextResponse.json(
            {
                error: "Failed to edit content",
                details: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        );
    }
}

