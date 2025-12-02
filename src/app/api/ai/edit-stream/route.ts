import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { editContentWithAgents, ContentOutput } from "@/lib/legacy-agents";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

                    // Use OpenAI Agents editor
                    const editedContent = await editContentWithAgents(
                        currentContent as ContentOutput,
                        editRequest
                    );

                    // Stream the edited content
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
