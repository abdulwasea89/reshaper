import { OpenAI } from "openai";
import { OpenAIChatCompletionsModel } from "@openai/agents";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ModelConfig } from "../config/models";

// Initialize Gemini client using OpenAI SDK format
const geminiClient = new OpenAI({
    apiKey: ModelConfig.apiKey,
    baseURL: ModelConfig.baseURL,
});

// Create model instance for OpenAI Agents SDK
export const geminiModel = new OpenAIChatCompletionsModel(
    geminiClient,
    ModelConfig.modelName
);

// LangChain model (kept for compatibility)
export const langchainModel = new ChatGoogleGenerativeAI({
    model: "gemini-2.0-flash",
    apiKey: process.env.GEMINI_API_KEY!,
    temperature: 0.7,
    streaming: true,
});

// AI Configuration constants
export const AI_CONFIG = {
    model: ModelConfig.modelName,
    temperature: ModelConfig.temperature,
    maxTokens: ModelConfig.maxTokens,
} as const;
