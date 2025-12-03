import { NextRequest, NextResponse } from "next/server";
import { runContentPipeline } from "@/lib/agents/pipeline";
import { Platform } from "@/types/multi-agent";
import { auth } from "@/lib/auth"; // Assuming auth is available here, adjust if needed
import { headers } from "next/headers";

export const runtime = "nodejs"; // Required for streaming with some libraries, though Next.js supports edge too. Node.js is safer for agent libraries.

export async function POST(req: NextRequest) {
    try {
        // 1. Parse request body
        const body = await req.json();
        const { url, platforms } = body;

        if (!url) {
            return NextResponse.json(
                { error: "URL is required" },
                { status: 400 }
            );
        }

        // 2. Validate platforms
        const validPlatforms: Platform[] = ["linkedin", "twitter", "instagram", "threads"];
        const selectedPlatforms: Platform[] = Array.isArray(platforms)
            ? platforms.filter((p: any) => validPlatforms.includes(p))
            : validPlatforms;

        if (selectedPlatforms.length === 0) {
            return NextResponse.json(
                { error: "At least one valid platform is required" },
                { status: 400 }
            );
        }

        // 3. Create a TransformStream for SSE
        const encoder = new TextEncoder();
        const stream = new TransformStream();
        const writer = stream.writable.getWriter();

        // 4. Start the pipeline in the background
        (async () => {
            try {
                for await (const event of runContentPipeline(url, selectedPlatforms)) {
                    // Format as SSE data
                    const data = JSON.stringify(event);
                    await writer.write(encoder.encode(`data: ${data}\n\n`));
                }

                // Send done signal
                await writer.write(encoder.encode("data: [DONE]\n\n"));
            } catch (error) {
                console.error("Stream error:", error);
                const errorEvent = {
                    type: "error",
                    error: error instanceof Error ? error.message : "Unknown streaming error",
                };
                await writer.write(encoder.encode(`data: ${JSON.stringify(errorEvent)}\n\n`));
            } finally {
                await writer.close();
            }
        })();

        // 5. Return the readable stream
        return new NextResponse(stream.readable, {
            headers: {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
            },
        });

    } catch (error) {
        console.error("API Route Error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
