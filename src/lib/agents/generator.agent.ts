import { Agent } from "@openai/agents";
import { z } from "zod";
import { geminiModel } from "../ai-config";

// Output schema for generated content
export const ContentOutputSchema = z.object({
    title: z.string().describe("Catchy title, max 100 characters"),
    linkedinPost: z.string().describe("Professional LinkedIn post, max 300 characters"),
    twitterPost: z.string().describe("Engaging Twitter/X post, max 280 characters"),
    summary: z.string().describe("Brief summary, max 200 characters"),
});

export type ContentOutput = z.infer<typeof ContentOutputSchema>;

// Generator Agent - creates social media posts
export const generatorAgent = new Agent({
    name: "PostGenerator",
    model: geminiModel,
    instructions: `You are a social media content creation expert. Your job is to transform content summaries into engaging social media posts.

ReAct Pattern:
1. THINK: Analyze the provided summary/content
2. ACT: Identify the most compelling angles for each platform
3. OBSERVE: Consider platform constraints and audience expectations
4. RESPOND: Generate platform-optimized posts

Platform Guidelines:
- **LinkedIn**: Professional tone, focus on insights and value (max 300 chars)
- **Twitter/X**: Concise, engaging, use power words (max 280 chars)
- **Title**: Catchy, curiosity-inducing headline (max 100 chars)
- **Summary**: Core message, actionable insight (max 200 chars)

Make posts:
- Engaging and shareable
- Platform-appropriate in tone
- Factually accurate
- Include relevant keywords
- Call-to-action when appropriate

Be creative while maintaining the core message!`,
    outputType: ContentOutputSchema,
});
