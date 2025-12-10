import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { mastra } from "@/mastra";

export async function POST(request: NextRequest) {
    try {
        const { prompt } = await request.json();
 
        if (!prompt) {
            return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
        }

        const agent = mastra.getAgent("contentCreatorAgent");
        const stream = await agent.stream(prompt);

        const encoder = new TextEncoder();
        const readableStream = new ReadableStream({
            async start(controller) {
                try {
                    for await (const chunk of stream.fullStream) {
                        console.log("Chunk:", JSON.stringify(chunk, null, 2));

                        if (chunk.type === 'text-delta') {
                            // Cast to unknown first, then to our type
                            const payload = chunk.payload as unknown as { textDelta?: string; text?: string };
                            const text = payload?.textDelta || payload?.text || '';
                            console.log("Text found:", text);
                            if (text) {
                                controller.enqueue(encoder.encode(text));
                            }
                        }
                    }
                    controller.close();
                } catch (error) {
                    console.error("Stream error:", error);
                    controller.error(error);
                }
            },
        });

        return new Response(readableStream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            },
        });
    } catch (error) {
        console.error("Agent Error:", error);
        return NextResponse.json({ error: 'Failed to generate content' }, { status: 500 });
    }
}