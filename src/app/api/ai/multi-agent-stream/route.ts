import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import * as cheerio from 'cheerio';

export const runtime = "nodejs";
export const maxDuration = 60;

type Platform = "linkedin" | "twitter" | "instagram" | "threads";

interface PipelineEvent {
    type: "status" | "step" | "content" | "error" | "complete";
    message?: string;
    agent?: string;
    data?: Record<string, unknown>;
}

// Helper to delay between API calls to avoid rate limits
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function POST(req: NextRequest) {
    try {
        // Authenticate
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { url, platforms = ["linkedin", "twitter"] } = body;

        if (!url) {
            return NextResponse.json({ error: "URL is required" }, { status: 400 });
        }

        const validPlatforms: Platform[] = ["linkedin", "twitter", "instagram", "threads"];
        const selectedPlatforms: Platform[] = Array.isArray(platforms)
            ? platforms.filter((p: string) => validPlatforms.includes(p as Platform))
            : ["linkedin", "twitter"];

        // Create SSE stream
        const encoder = new TextEncoder();
        const stream = new TransformStream();
        const writer = stream.writable.getWriter();

        const sendEvent = async (event: PipelineEvent) => {
            await writer.write(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        };

        // Run pipeline in background
        (async () => {
            try {
                const model = google("gemini-2.0-flash-exp");

                // Step 1: Scrape URL
                await sendEvent({ type: "status", message: "Scraping URL...", agent: "scraper" });

                let pageContent = "";
                let pageTitle = "";

                try {
                    const response = await fetch(url, {
                        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1)' },
                    });
                    const html = await response.text();
                    const $ = cheerio.load(html);
                    $('script, style, nav, header, footer').remove();
                    pageTitle = $('title').text().trim() || $('h1').first().text().trim() || 'Untitled';
                    pageContent = $('article, main, .content').first().text().trim() || $('body').text().trim();
                    pageContent = pageContent.replace(/\s+/g, ' ').slice(0, 4000);
                } catch (scrapeError) {
                    await sendEvent({ type: "error", message: `Failed to scrape: ${scrapeError}` });
                    await writer.close();
                    return;
                }

                await sendEvent({
                    type: "step",
                    agent: "scraper",
                    message: `Scraped: ${pageTitle}`,
                    data: { title: pageTitle, wordCount: pageContent.split(/\s+/).length }
                });

                // Add delay to avoid rate limits
                await delay(1000);

                // Step 2: Analyze content
                await sendEvent({ type: "status", message: "Analyzing content...", agent: "analyzer" });

                const analysisResult = await generateText({
                    model,
                    prompt: `Analyze this content and extract key insights:

${pageContent}

Return a JSON object:
{
  "summary": "2-3 sentence summary",
  "keyPoints": ["point1", "point2", "point3"],
  "tone": "informative/inspirational/educational/etc",
  "targetAudience": "who would benefit"
}`,
                });

                let analysis;
                try {
                    const jsonMatch = analysisResult.text.match(/\{[\s\S]*\}/);
                    analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : { summary: pageContent.slice(0, 200) };
                } catch {
                    analysis = { summary: pageContent.slice(0, 200), keyPoints: [], tone: "informative" };
                }

                await sendEvent({
                    type: "step",
                    agent: "analyzer",
                    message: "Content analyzed",
                    data: analysis
                });

                // Add delay to avoid rate limits
                await delay(1500);

                // Step 3: Generate posts for each platform
                await sendEvent({ type: "status", message: "Generating posts...", agent: "generator" });

                const posts: Record<string, string> = {};

                for (const platform of selectedPlatforms) {
                    await delay(1000); // Rate limit between each platform

                    const platformPrompt = getPlatformPrompt(platform, analysis.summary, analysis.keyPoints || []);

                    try {
                        const postResult = await generateText({
                            model,
                            prompt: platformPrompt,
                        });

                        posts[platform] = postResult.text.replace(/```/g, '').trim();

                        await sendEvent({
                            type: "content",
                            agent: "generator",
                            message: `Generated ${platform} post`,
                            data: { platform, content: posts[platform] }
                        });
                    } catch (genError: unknown) {
                        const errorMessage = genError instanceof Error ? genError.message : 'Unknown error';
                        if (errorMessage.includes('429')) {
                            await sendEvent({ type: "status", message: `Rate limited, waiting...`, agent: "generator" });
                            await delay(5000);
                            // Retry once
                            const retryResult = await generateText({ model, prompt: platformPrompt });
                            posts[platform] = retryResult.text.replace(/```/g, '').trim();
                        } else {
                            posts[platform] = `Failed to generate: ${errorMessage}`;
                        }
                    }
                }

                // Step 4: Complete
                await sendEvent({
                    type: "complete",
                    message: "Pipeline complete",
                    data: {
                        title: pageTitle,
                        summary: analysis.summary,
                        posts,
                    }
                });

                await writer.write(encoder.encode("data: [DONE]\n\n"));
            } catch (error) {
                console.error("Pipeline error:", error);
                await sendEvent({
                    type: "error",
                    message: error instanceof Error ? error.message : "Unknown error",
                });
            } finally {
                await writer.close();
            }
        })();

        return new NextResponse(stream.readable, {
            headers: {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
            },
        });
    } catch (error) {
        console.error("API Route Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

function getPlatformPrompt(platform: Platform, summary: string, keyPoints: string[]): string {
    const points = keyPoints.join('\n- ');

    switch (platform) {
        case "linkedin":
            return `Create a LinkedIn post based on this content:

Summary: ${summary}
Key Points:
- ${points}

Requirements:
- Professional tone
- Use line breaks for readability
- Include a thought-provoking question or CTA at the end
- 150-300 words
- Add 3-5 relevant hashtags at the end

Write ONLY the post content, no JSON or markdown.`;

        case "twitter":
            return `Create a Twitter/X post based on this content:

Summary: ${summary}

Requirements:
- Maximum 280 characters
- Punchy and engaging
- Include 1-2 relevant hashtags
- Make it shareable

Write ONLY the tweet, no JSON or markdown.`;

        case "instagram":
            return `Create an Instagram caption based on this content:

Summary: ${summary}

Requirements:
- Engaging and visual language
- Include emojis
- Add a CTA (like, comment, share)
- 5-10 relevant hashtags at the end
- 100-200 words

Write ONLY the caption, no JSON or markdown.`;

        case "threads":
            return `Create a Threads post based on this content:

Summary: ${summary}

Requirements:
- Conversational tone
- 500 characters max
- Minimal hashtags (1-2)
- Encourage discussion

Write ONLY the post, no JSON or markdown.`;

        default:
            return `Create a social media post: ${summary}`;
    }
}

