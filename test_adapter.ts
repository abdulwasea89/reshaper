import * as dotenv from "dotenv";
dotenv.config({ path: ".env" });

import { run } from "@openai/agents";

async function test() {
    // Dynamic import to ensure env vars are loaded first
    const { contentAgent } = await import("./src/lib/ai-agents");

    try {
        console.log("Testing Content Agent with Vercel AI SDK Adapter...");
        const result = await run(contentAgent, "Create a post about the benefits of AI in healthcare.");
        console.log("Success:", JSON.stringify(result.finalOutput, null, 2));
    } catch (error) {
        console.error("Error:", error);
    }
}

test();
