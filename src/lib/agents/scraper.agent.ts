import { Agent, tool } from "@openai/agents";
import { z } from "zod";
import { geminiModel } from "../ai-config";
import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";

// Tool for fetching content from URL
const fetchContentTool = tool({
    name: "fetch_content",
    description: "Scrapes content from a given URL and returns the raw text",
    parameters: z.object({
        url: z.string().describe("The URL to scrape"),
    }),
    execute: async ({ url }) => {
        try {   
            const loader = new CheerioWebBaseLoader(url);
            const docs = await loader.load();
            const content = docs[0].pageContent;

            return {
                success: true,
                content,
                length: content.length,
                url,
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : "Unknown error",
                url,
            };
        }
    },
});

// Scraper Agent with ReAct pattern
export const scraperAgent = new Agent({
    name: "ContentScraper",
    model: geminiModel,
    instructions: `You are a web content scraper. Your job is to fetch content from URLs.

ReAct Pattern:
1. THINK: Understand what URL needs to be scraped
2. ACT: Use fetch_content tool to retrieve the content
3. OBSERVE: Check if scraping was successful
4. RESPOND: Return the scraped content with metadata

If scraping fails, explain the error clearly.`,
    tools: [fetchContentTool],
});

// Output schema for scraper
export const ScraperOutputSchema = z.object({
    success: z.boolean(),
    content: z.string().optional(),
    length: z.number().optional(),
    error: z.string().optional(),
});

export type ScraperOutput = z.infer<typeof ScraperOutputSchema>;
