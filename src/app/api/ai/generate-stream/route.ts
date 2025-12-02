import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { triageCoordinator } from "@/lib/triage-coordinator";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
    const encoder = new TextEncoder();

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

    const { url } = await request.json();

    if (!url) {
        return new Response(
            JSON.stringify({ error: "URL is required" }),
            { status: 400, headers: { "Content-Type": "application/json" } }
        );
    }

    // Create streaming response using triage coordinator
    const stream = new ReadableStream({
        async start(controller) {
            try {
                // Stream events from triage coordinator
                for await (const event of triageCoordinator.processURL(url)) {
                    controller.enqueue(
                        encoder.encode(`data: ${JSON.stringify(event)}\n\n`)
                    );
                }

                controller.enqueue(encoder.encode("data: [DONE]\n\n"));
                controller.close();
            } catch (error) {
                console.error("Error in triage processing:", error);
                controller.enqueue(
                    encoder.encode(
                        `data: ${JSON.stringify({
                            type: "error",
                            error: error instanceof Error ? error.message : "Unknown error",
                            stage: "stream",
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
}
