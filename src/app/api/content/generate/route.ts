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
                    for await (const chunk of stream.textStream) {
                        controller.enqueue(encoder.encode(chunk));
                    }
                    controller.close();
                } catch (error) {
                    controller.error(error);
                }
            }
        });

        return new Response(readableStream, {
            headers: {
                'Content-Type': 'text/event-stream',
            },
        })
    } catch (error) {
        console.error("There is An agent Error", error);
        return NextResponse.json({ error: 'Failed to generate content' }, { status: 500 });
    }
}