/**
 * Model Configuration
 * All model settings loaded from environment variables
 */

export const ModelConfig = {
    // Primary model for agents
    modelName: process.env.GEMINI_MODEL_NAME || "gemini-2.0-flash-exp",
    temperature: parseFloat(process.env.GEMINI_MODEL_TEMP || "0.7"),
    maxTokens: parseInt(process.env.GEMINI_MAX_TOKENS || "4000"),

    // Agent-specific settings
    maxIterations: parseInt(process.env.AGENT_MAX_ITERATIONS || "5"),

    // API Configuration
    apiKey: process.env.GEMINI_API_KEY!,
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
} as const;

// Validate required environment variables
if (!ModelConfig.apiKey) {
    throw new Error("GEMINI_API_KEY is required in environment variables");
}

export type ModelConfigType = typeof ModelConfig;
