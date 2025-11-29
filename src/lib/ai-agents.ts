import { Agent, run } from "@openai/agents";
import { z } from "zod";
import { geminiModel } from "./ai-config";

// Output schema for generated content
const ContentOutput = z.object({
    title: z.string(),
    linkedinPost: z.string(),
    twitterPost: z.string(),
    summary: z.string(),
});

// Content generation agent
export const contentAgent = new Agent({
    name: "ContentCreator",
    model: geminiModel,
    instructions: `You are a social media content expert. Generate engaging social media posts based on provided content.
  
Your tasks:
1. Create a catchy title (max 100 characters)
2. Write a LinkedIn post (max 300 characters, professional tone)
3. Write a Twitter/X post (max 280 characters, engaging and concise)
4. Generate a brief summary (max 200 characters)

Always maintain high quality and engagement in your content.`,
    outputType: ContentOutput,
});

// Content editing agent
export const editorAgent = new Agent({
    name: "ContentEditor",
    model: geminiModel,
    instructions: `You are a professional content editor. Help users refine and improve their social media posts.
  
Your tasks:
1. Understand the user's editing request
2. Make precise, targeted edits
3. Maintain the original tone and message
4. Ensure posts meet platform character limits
5. Improve clarity and engagement

Return the edited content in the same format as the original.`,
    outputType: ContentOutput,
});

// Web scraping agent
export const scraperAgent = new Agent({
    name: "WebScraper",
    model: geminiModel,
    instructions: `You are a web content analyzer. Extract and summarize key information from web pages.
  
Your tasks:
1. Identify the main topic and key points
2. Extract relevant quotes or statistics
3. Summarize the content concisely
4. Highlight actionable insights

Provide structured output that can be used to generate social media posts.`,
});

// Helper function to generate content from URL
export async function generateContentFromUrl(content: string) {
    const result = await run(contentAgent, content);
    return result.finalOutput;
}

// Helper function to edit content based on user request
export async function editContent(currentContent: string, editRequest: string) {
    const prompt = `Current content:\n${JSON.stringify(currentContent, null, 2)}\n\nEdit request: ${editRequest}`;
    const result = await run(editorAgent, prompt);
    return result.finalOutput;
}
