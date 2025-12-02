import { Agent, tool } from "@openai/agents";
import { z } from "zod";
import { geminiModel } from "../ai-config";
import type { SummarizerOutput } from "./summarizer.agent";

// Tool for merging summaries
const mergeSummariesTool = tool({
    name: "merge_summaries",
    description: "Combines multiple batch summaries into a unified understanding",
    parameters: z.object({
        summaries: z.array(z.any()).describe("Array of summaries to combine"),
    }),
    execute: async ({ summaries }) => {
        return {
            totalSummaries: summaries.length,
            totalKeyPoints: summaries.reduce((sum: number, s: any) => sum + (s.keyPoints?.length || 0), 0),
            merged: true,
        };
    },
});

// Aggregator Agent - combines batch summaries
export const aggregatorAgent = new Agent({
    name: "SummaryAggregator",
    model: geminiModel,
    instructions: `You are a summary aggregation specialist. Your job is to combine multiple content summaries into one coherent understanding.

ReAct Pattern:
1. THINK: Review all the batch summaries provided
2. ACT: Use merge_summaries tool to process them
3. OBSERVE: Identify common themes and unique points
4. RESPOND: Create a unified summary that captures everything

Your aggregated summary should:
- Combine all main topics into a coherent narrative
- Merge key points while removing duplicates
- Preserve all important quotes and statistics
- Create a comprehensive yet concise overview
- Identify the overarching theme or message

The final output will be used to generate social media posts, so make it compelling and informative.`,
    tools: [mergeSummariesTool],
    outputType: z.object({
        overallTopic: z.string().describe("The overarching topic from all summaries"),
        combinedKeyPoints: z.array(z.string()).describe("All unique key points combined (5-10 items)"),
        bestQuotes: z.array(z.string()).optional().describe("Most impactful quotes"),
        keyStatistics: z.array(z.string()).optional().describe("Important numbers/data"),
        unifiedSummary: z.string().describe("Comprehensive summary combining all batches"),
    }),
});

export type AggregatorOutput = z.infer<typeof aggregatorAgent.outputType>;
