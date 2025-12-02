/**
 * Model Configuration
 * All model settings loaded from environment variables
 */

export const ModelConfig = {
    modelName: process.env.GEMINI_MODEL_NAME || "gemini-2.0-flash",
    temperature: parseFloat(process.env.GEMINI_MODEL_TEMP || "0.7"),
    maxTokens: parseInt(process.env.GEMINI_MAX_TOKENS || "4000"),
    maxIterations: parseInt(process.env.AGENT_MAX_ITERATIONS || "5"),
    apiKey: process.env.GEMINI_API_KEY!,
    baseURL: process.env.BASE_URL! || "https://generativelanguage.googleapis.com/v1beta/openai/",
} as const;

// Validate required environment variables
if (!ModelConfig.apiKey) {
    throw new Error("GEMINI_API_KEY is required in environment variables");
}

export type ModelConfigType = typeof ModelConfig;
