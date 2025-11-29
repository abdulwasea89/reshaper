import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { editContent } from "@/lib/ai-agents";

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

        // Use OpenAI Agent to edit content
        const editedContent = await editContent(
            JSON.stringify(currentContent),
            editRequest
        );

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
