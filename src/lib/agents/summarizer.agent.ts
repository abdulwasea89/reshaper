import { Agent, tool } from "@openai/agents";
import { z } from "zod";
import { geminiModel } from "../ai-config";

// Tool for extracting key points from content
const extractKeyPointsTool = tool({
    name: "extract_key_points",
    description: "Analyzes a content chunk and extracts the most important information",
    parameters: z.object({
        content: z.string().describe("The content chunk to analyze"),
    }),
    execute: async ({ content }) => {
        // This is a passthrough - the agent will do the actual analysis
        return {
            contentLength: content.length,
            wordCount: content.split(/\s+/).length,
            processed: true,
        };
    },
});

// Summarizer Agent - processes content batches
export const summarizerAgent = new Agent({
    name: "ContentSummarizer",
    model: geminiModel,
    instructions: `You are a content summarization expert. Your job is to process content chunks and extract key information.

ReAct Pattern:
1. THINK: Analyze the content chunk provided
2. ACT: Use extract_key_points tool to understand the content
3. OBSERVE: Review what information is mostimportant
4. RESPOND: Create a concise summary with key points

Your summary should:
- Capture the main topic and key points
- Extract important facts, statistics, or quotes
- Be concise (max 500 words)
- Maintain factual accuracy
- Identify actionable insights

Return a structured summary that can be combined with other batch summaries.`,
    tools: [extractKeyPointsTool],
    outputType: z.object({
        mainTopic: z.string().describe("The main topic of this content chunk"),
        keyPoints: z.array(z.string()).describe("Array of key points (3-5 items)"),
        importantQuotes: z.array(z.string()).optional().describe("Notable quotes if any"),
        statistics: z.array(z.string()).optional().describe("Key statistics or numbers"),
        summary: z.string().describe("Concise summary of the chunk"),
    }),
});

export type SummarizerOutput = z.infer<typeof summarizerAgent.outputType>;
