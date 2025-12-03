
import { run } from "@openai/agents";
import { scraperAgent } from "../src/lib/agents/multi-agent-system";
import dotenv from "dotenv";

// Load environment variables
dotenv.config({path: [""]});

async function testOpenAIAgents() {
    console.log("🧪 Testing OpenAI Agents SDK with Gemini Adapter...");

    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY && !process.env.GEMINI_API_KEY) {
        console.error("❌ No API key found in environment variables!");
        process.exit(1);
    }

    try {
        console.log("\n1️⃣  Running Scraper Agent...");
        const result = await run(scraperAgent, "https://example.com");

        console.log("✅ Agent Execution Success!");
        console.log("Output:", result.finalOutput);

    } catch (error: any) {
        console.error("\n❌ Test Failed!");
        console.error("Error:", error);
        if (error.message?.includes("403")) {
            console.error("⚠️  403 Forbidden: Check your API key.");
        }
    }
}

testOpenAIAgents();
