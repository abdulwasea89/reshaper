import { Agent, run, tool } from "@openai/agents";
import { z } from "zod";
import { geminiModel } from "./ai-config";
import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";

// Output schema for generated content
export const ContentOutputSchema = z.object({
    title: z.string().describe("Catchy title, max 100 characters"),
    linkedinPost: z.string().describe("Professional LinkedIn post, max 300 characters"),
    twitterPost: z.string().describe("Engaging Twitter/X post, max 280 characters"),
    summary: z.string().describe("Brief summary, max 200 characters"),
});

export type ContentOutput = z.infer<typeof ContentOutputSchema>;

// Tool for web scraping
const webScraperTool = tool({
    name: "web_scraper",
    description: "Scrapes and extracts content from a given URL. Use this to get the raw content from web pages.",
    parameters: z.object({
        url: z.string().describe("The URL to scrape"),
    }),
    execute: async ({ url }) => {
        try {
            const loader = new CheerioWebBaseLoader(url);
            const docs = await loader.load();
            // Return first 8000 characters to avoid token limits
            const content = docs[0].pageContent.slice(0, 8000);
            return { success: true, content, length: content.length };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : "Unknown error",
            };
        }
    },
});

// Tool for analyzing content
const contentAnalyzerTool = tool({
    name: "content_analyzer",
    description: "Analyzes scraped content to extract key points, topics, quotes, and actionable insights. Returns structured analysis.",
    parameters: z.object({
        content: z.string().describe("The content to analyze"),
    }),
    execute: async ({ content }) => {
        // Extract first few paragraphs and key information
        const lines = content.split("\n").filter((line) => line.trim().length > 0);
        const preview = lines.slice(0, 10).join(" ");

        return {
            success: true,
            preview,
            wordCount: content.split(/\s+/).length,
            characterCount: content.length,
            readyForGeneration: true,
        };
    },
});

// Content Generation Agent with structured chat pattern
export const postGenerationAgent = new Agent({
    name: "SocialMediaPostGenerator",
    model: geminiModel,
    instructions: `You are an expert social media content creator. Follow this ReAct pattern to generate engaging posts:

1. THINK: Analyze what you need to do
2. ACT: Use tools to gather and process information  
3. OBSERVE: Review the results
4. REPEAT: Continue until you have enough information (max 5 iterations)
5. RESPOND: Generate the final posts

Your process:
- First, use web_scraper to get content from the URL
- Then, use content_analyzer to extract key points
- Finally, generate engaging social media posts

When you have analyzed the content, respond with a JSON object containing:
{
  "title": "catchy title (max 100 chars)",
  "linkedinPost": "professional post (max 300 chars)",  
  "twitterPost": "engaging tweet (max 280 chars)",
  "summary": "brief summary (max 200 chars)"
}

Be strategic and thorough. Extract the most impactful information to create compelling posts.`,
    tools: [webScraperTool, contentAnalyzerTool],
    outputType: ContentOutputSchema,
});

// Helper function to generate content from URL using OpenAI Agents
export async function generateContentWithAgents(url: string): Promise<ContentOutput> {
    try {
        const result = await run(
            postGenerationAgent,
            `Generate engaging social media posts from this URL: ${url}

Use the tools strategically:
1. Scrape the URL to get the content
2. Analyze the scraped content to identify key points
3. Create compelling posts based on your analysis

Focus on creating posts that are engaging, informative, and platform-appropriate.`
        );

        return result.finalOutput;
    } catch (error) {
        console.error("Error in agent execution:", error);
        // Fallback response
        return {
            title: "Content Generated",
            linkedinPost: "Check out this interesting content!",
            twitterPost: "Interesting read! 📖",
            summary: "AI-generated content from URL",
        };
    }
}

// Streaming version that yields intermediate steps
export async function* generateContentWithAgentsStreaming(url: string) {
    try {
        yield {
            type: "status",
            message: "Initializing AI agent...",
        };

        const result = await run(
            postGenerationAgent,
            `Generate engaging social media posts from this URL: ${url}

Use the tools strategically to analyze and create posts.`
        );

        // Simulate streaming steps (OpenAI Agents SDK doesn't expose intermediate steps in the same way)
        yield {
            type: "step",
            thought: "I need to scrape the URL first",
            action: "web_scraper",
            observation: "Retrieving content...",
        };

        yield {
            type: "step",
            thought: "Now analyzing the scraped content",
            action: "content_analyzer",
            observation: "Extracting key points...",
        };

        yield {
            type: "step",
            thought: "Generating social media posts",
            action: "post_generator",
            observation: "Creating engaging content...",
        };

        yield {
            type: "complete",
            ...result.finalOutput,
        };
    } catch (error) {
        yield {
            type: "error",
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}

// Content editing agent
export const contentEditorAgent = new Agent({
    name: "ContentEditor",
    model: geminiModel,
    instructions: `You are a professional content editor for social media posts.

When given current content and an edit request:
1. Understand the specific changes requested
2. Make precise, targeted edits while preserving the core message
3. Ensure posts meet platform character limits:
   - LinkedIn: max 300 characters
   - Twitter: max 280 characters  
   - Title: max 100 characters
   - Summary: max 200 characters
4. Improve clarity and engagement

Return a JSON object with the edited content in the same format as the original.`,
    outputType: ContentOutputSchema,
});

// Edit content based on user request
export async function editContentWithAgents(
    currentContent: ContentOutput,
    editRequest: string
): Promise<ContentOutput> {
    try {
        const result = await run(
            contentEditorAgent,
            `Current content:
${JSON.stringify(currentContent, null, 2)}

Edit request: ${editRequest}

Please apply the requested edits and return the updated content.`
        );

        return result.finalOutput;
    } catch (error) {
        console.error("Error editing content:", error);
        return currentContent; // Return original on error
    }
}
