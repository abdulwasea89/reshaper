
import { generateText, generateObject } from "ai";
import { z } from "zod";
import { google } from "@ai-sdk/google";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

async function testVercelAI() {
    console.log("🧪 Testing Vercel AI SDK with Gemini...");

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) {
        console.error("❌ No API key found in environment variables!");
        process.exit(1);
    }

    const model = google("gemini-2.0-flash");

    try {
        // 1. Test generateText
        console.log("\n1️⃣  Testing generateText...");
        const { text } = await generateText({
            model,
            prompt: "Explain the benefits of server-side rendering in one sentence.",
        });
        console.log("✅ generateText Success:");
        console.log(`   "${text}"`);

        // 2. Test generateObject
        console.log("\n2️⃣  Testing generateObject...");
        const { object } = await generateObject({
            model,
            schema: z.object({
                framework: z.string(),
                year: z.number(),
                features: z.array(z.string()),
            }),
            prompt: "Give me details about Next.js",
        });
        console.log("✅ generateObject Success:");
        console.log(JSON.stringify(object, null, 2));

        console.log("\n🎉 All Vercel AI SDK tests passed!");

    } catch (error: any) {
        console.error("\n❌ Test Failed!");
        console.error("Error:", error);
        if (error.message?.includes("403")) {
            console.error("⚠️  403 Forbidden: Check your API key and model availability.");
        }
    }
}

testVercelAI();
