import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { PromptTemplate } from "@langchain/core/prompts";
import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";

export async function POST(request: NextRequest) {
    try {
        // Get authenticated user
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { url } = await request.json();

        if (!url) {
            return NextResponse.json({ error: "URL is required" }, { status: 400 });
        }

        // Load and scrape the web page
        const loader = new CheerioWebBaseLoader(url);
        const docs = await loader.load();

        const pageContent = docs[0].pageContent;

        // Initialize OpenAI model
        const model = new ChatGoogleGenerativeAI({
model: "gemini-2.5-pro",
            temperature: 0.7,
            apiKey: process.env.GEMINI_API_KEY
        });

        // Create prompt template for generating social media posts
        const template = `You are a social media content expert. Based on the following web content, create engaging social media posts.

Web Content:
{content}

Generate the following:
1. A catchy title (max 100 characters)
2. A LinkedIn post (max 300 characters, professional tone)
3. A Twitter/X post (max 280 characters, engaging and concise)
4. A brief summary (max 200 characters)

Return your response in the following JSON format:
{{
  "title": "...",
  "linkedinPost": "...",
  "twitterPost": "...",
  "summary": "..."
}}`;
        
        const prompt = PromptTemplate.fromTemplate(template);
        const chain = prompt.pipe(model);

        // Generate content
        const result = await chain.invoke({
            content: pageContent.slice(0, 4000), // Limit content to avoid token limits
        });

        // Parse the AI response
        const generatedContent = JSON.parse(result.content as string);

        return NextResponse.json({
            success: true,
            originalUrl: url,
            ...generatedContent,
        });
    } catch (error) {
        console.error("Error scraping and processing URL:", error);
        return NextResponse.json(
            { error: "Failed to process URL", details: error instanceof Error ? error.message : "Unknown error" },
            { status: 500 }
        );
    }
}
