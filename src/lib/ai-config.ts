import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { aisdk } from "@openai/agents-extensions";

// Create Google provider instance with API key
const google = createGoogleGenerativeAI({
    apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

// Initialize Gemini model using Vercel AI SDK adapter
export const geminiModel = aisdk(google("gemini-2.0-flash-exp"));

// Model configuration
export const AI_CONFIG = {
    model: "gemini-2.0-flash-exp",
    temperature: 0.7,
    maxTokens: 4000,
} as const;
