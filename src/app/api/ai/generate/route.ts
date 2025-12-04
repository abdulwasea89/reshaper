import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import * as cheerio from 'cheerio';

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

        // Scrape the URL
        const response = await fetch(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1)' },
        });
        const html = await response.text();
        const $ = cheerio.load(html);
        $('script, style, nav, header, footer').remove();
        const pageContent = $('article, main, .content').first().text().trim() || $('body').text().trim();
        const cleanContent = pageContent.replace(/\s+/g, ' ').slice(0, 4000);

        // Generate content using Gemini
        const model = google("gemini-2.0-flash-exp");

        const result = await generateText({
            model,
            prompt: `Based on this content, generate social media posts:

${cleanContent}

Return ONLY a JSON object with these fields:
{
  "title": "catchy title (max 100 chars)",
  "linkedinPost": "professional LinkedIn post (max 300 chars)",
  "twitterPost": "engaging tweet (max 280 chars)",
  "summary": "brief summary (max 200 chars)"
}`,
        });

        let generatedContent;
        try {
            const jsonMatch = result.text.match(/\{[\s\S]*\}/);
            generatedContent = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
        } catch {
            generatedContent = {
                title: "Generated Content",
                linkedinPost: cleanContent.slice(0, 300),
                twitterPost: cleanContent.slice(0, 280),
                summary: cleanContent.slice(0, 200),
            };
        }

        return NextResponse.json({
            success: true,
            originalUrl: url,
            ...generatedContent,
        });
    } catch (error) {
        console.error("Error generating content:", error);
        return NextResponse.json(
            {
                error: "Failed to generate content",
                details: error instanceof Error ? error.message : "Unknown error"
            },
            { status: 500 }
        );
    }
}

