import { OpenAI } from "openai";
import { OpenAIChatCompletionsModel } from "@openai/agents";

// Initialize Gemini client using OpenAI SDK
export const geminiClient = new OpenAI({
    apiKey: process.env.GEMINI_API_KEY || "",
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
});

// Gemini model instance
export const geminiModel = new OpenAIChatCompletionsModel(
    geminiClient,
    "gemini-2.0-flash-exp"
);

// Model configuration
export const AI_CONFIG = {
    model: "gemini-2.0-flash-exp",
    temperature: 0.7,
    maxTokens: 4000,
} as const;
