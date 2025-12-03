import { OpenAI } from "openai";
import { OpenAIChatCompletionsModel } from "@openai/agents";


const geminiApiKey = "AIzaSyB8Hse17AJlVxwi-ORWn99NrtplEDk_HbE";

if (!geminiApiKey) {
    console.error("❌ GEMINI_API_KEY not found in environment variables");
    console.log("Please create .env.local and add your API key");
    process.exit(1);
}

// Initialize Gemini client
const externalClient = new OpenAI({
    apiKey: geminiApiKey,
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
});

// Create model instance
export const geminiModel =  new OpenAIChatCompletionsModel(
    externalClient,
    "gemini-2.0-flash-exp"
);
