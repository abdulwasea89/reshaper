
import { OpenAI } from "openai";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

async function testGemini() {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    const baseURL = process.env.BASE_URL || "https://generativelanguage.googleapis.com/v1beta/openai/";
    const model = process.env.GEMINI_MODEL_NAME || "gemini-2.0-flash";

    console.log("Testing Gemini API Connection...");
    console.log(`URL: ${baseURL}`);
    console.log(`Model: ${model}`);
    console.log(`API Key present: ${!!apiKey}`);

    if (!apiKey) {
        console.error("❌ No API key found!");
        return;
    }

    const client = new OpenAI({
        apiKey: apiKey,
        baseURL: baseURL,
    });

    try {
        const response = await client.chat.completions.create({
            model: model,
            messages: [{ role: "user", content: "Hello, are you working?" }],
        });

        console.log("✅ Connection Successful!");
        console.log("Response:", response.choices[0].message.content);
    } catch (error: any) {
        console.error("❌ Connection Failed!");
        console.error("Status:", error.status);
        console.error("Message:", error.message);

        if (error.status === 403) {
            console.log("\n⚠️  403 Forbidden usually means:");
            console.log("1. Invalid API Key");
            console.log("2. Model not available (try gemini-1.5-flash)");
            console.log("3. API quota exceeded");
        }
    }
}

testGemini();
