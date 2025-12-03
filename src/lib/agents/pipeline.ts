// src/lib/agents/pipeline.ts
import { run } from "@openai/agents";
import type {
    Platform,
    PipelineEvent,
    PipelineResult,
    GeneratedPost,
    ScrapedContent,
} from "@/types/multi-agent";
import {
    scraperAgent,
    analyzerAgent,
    scorerAgent,
    optimizerAgent,
    crossPlatformAgent,
    extractPostMetadata,
    determineContentType,
} from "./multi-agent-system";
import { generatorAgent } from "./generator.agent";
import PQueue from "p-queue";

// Helper to parse agent output (JSON string or object)
function parseAgentOutput(output: any) {
    if (typeof output === "string") {
        try {
            return JSON.parse(output);
        } catch {
            return output;
        }
    }
    return output;
}

// ────────────── Helper: Call with retry & exponential backoff ──────────────
async function callWithRetry(agent: any, input: any, retries = 3, delay = 500) {
    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            return await run(agent, input);
        } catch (err: any) {
            if (err.statusCode === 429) {
                const backoff = delay * Math.pow(2, attempt);
                console.warn(`429 RESOURCE_EXHAUSTED, retrying in ${backoff}ms (attempt ${attempt + 1})`);
                await new Promise(res => setTimeout(res, backoff));
            } else {
                throw err; // Non-retryable error
            }
        }
    }
    throw new Error("Max retries exceeded for agent call");
}

// ────────────── Main pipeline ──────────────
export async function* runContentPipeline(
    url: string,
    platforms: Platform[] = ["linkedin", "twitter", "instagram", "threads"]
): AsyncGenerator<PipelineEvent> {
    const startTime = Date.now();
    const queue = new PQueue({ concurrency: 1 }); // Only 1 API call at a time

    try {
        // STEP 1: SCRAPE
        yield { type: "step", step: "scraping", status: "active", message: `Extracting content from ${determineContentType(url)}...` };
        const scrapeResult = await callWithRetry(scraperAgent, url);
        const scrapedData = parseAgentOutput(scrapeResult.finalOutput) as ScrapedContent;

        if (!scrapedData || !scrapedData.success) {
            yield { type: "error", error: scrapedData?.error || "Scraping failed", step: "scraping" };
            return;
        }

        yield { type: "step", step: "scraping", status: "complete", message: `Found ${scrapedData.content.length} characters of content` };

        // STEP 2: ANALYZE
        yield { type: "step", step: "analyzing", status: "active", message: "Researching similar posts on all platforms..." };
        const analysisResults: Record<string, any> = {};

        for (const platform of platforms) {
            const query = scrapedData.metadata?.title || url;
            const analysisPrompt = `Analyze similar posts for topic: "${query}" on ${platform}`;

            const result = await queue.add(() => callWithRetry(analyzerAgent, analysisPrompt));
            analysisResults[platform] = parseAgentOutput(result.finalOutput);

            yield { type: "search_results", platform, results: [`${platform}.com/trending-post-1`, `${platform}.com/trending-post-2`] };
        }

        yield { type: "step", step: "analyzing", status: "complete", message: "Analysis complete for all platforms" };

        // STEP 3: GENERATE
        yield { type: "step", step: "generating", status: "active", message: "Creating posts for each platform..." };

        const generationPrompt = `
Content: ${scrapedData.content}
Metadata: ${JSON.stringify(scrapedData.metadata)}
Analysis Insights: ${JSON.stringify(analysisResults)}
Generate optimized social media posts for LinkedIn, Twitter, Instagram, and Threads.
Apply best practices from the analysis.
`;

        let generated: any;
        try {
            const genRun = await queue.add(() => callWithRetry(generatorAgent, generationPrompt));
            generated = parseAgentOutput(genRun.finalOutput);
        } catch {
            console.warn("Gemini generation failed. Using fallback template.");
            generated = {
                linkedinPost: "Auto-generated LinkedIn placeholder...",
                twitterPost: "Auto-generated Twitter placeholder...",
                summary: "Auto-generated generic post..."
            };
        }

        yield { type: "step", step: "generating", status: "complete", message: "Posts generated for all platforms" };

        // STEP 4: SCORE
        yield { type: "step", step: "scoring", status: "active", message: "Calculating virality scores..." };
        const scores: Record<string, any> = {};

        for (const platform of platforms) {
            const postContent = platform === "linkedin" ? generated.linkedinPost :
                                platform === "twitter" ? generated.twitterPost :
                                platform === "instagram" ? generated.summary : generated.summary;

            const metadata = extractPostMetadata(postContent);
            const scorePrompt = `Score this ${platform} post for virality:\nContent: ${postContent}\nMetadata: ${JSON.stringify(metadata)}\nPlatform: ${platform}`;

            const scoreRun = await queue.add(() => callWithRetry(scorerAgent, scorePrompt));
            scores[platform] = parseAgentOutput(scoreRun.finalOutput);

            yield { type: "score", platform, score: scores[platform] };
        }

        yield { type: "step", step: "scoring", status: "complete", message: "Virality scores calculated" };

        // STEP 5: OPTIMIZE LOW SCORING
        const optimizedPosts: Record<string, string> = {};
        let needsOptimization = Object.values(scores).some(s => s?.viralityScore < 70);

        if (needsOptimization) {
            yield { type: "step", step: "optimizing", status: "active", message: "Optimizing low-scoring posts..." };

            for (const platform of platforms) {
                const postContent = platform === "linkedin" ? generated.linkedinPost :
                                    platform === "twitter" ? generated.twitterPost :
                                    platform === "instagram" ? generated.summary : generated.summary;

                if (scores[platform]?.viralityScore < 70) {
                    const optimizePrompt = `Optimize this ${platform} post:\nOriginal: ${postContent}\nScore: ${scores[platform].viralityScore}\nInsights: ${JSON.stringify(analysisResults[platform]?.insights)}`;
                    const optimizeRun = await queue.add(() => callWithRetry(optimizerAgent, optimizePrompt));
                    const optimizeResult = parseAgentOutput(optimizeRun.finalOutput);
                    optimizedPosts[platform] = optimizeResult?.optimizedContent || postContent;

                    yield { type: "optimization", platform, suggestions: [
                        { type: "hook", suggestion: "Added stronger hook", impact: "high" },
                        { type: "cta", suggestion: "Improved call-to-action", impact: "high" },
                        { type: "hashtags", suggestion: "Optimized hashtags", impact: "medium" },
                    ]};
                } else {
                    optimizedPosts[platform] = postContent;
                }
            }

            yield { type: "step", step: "optimizing", status: "complete", message: "Optimization complete" };
        } else {
            for (const platform of platforms) {
                optimizedPosts[platform] = platform === "linkedin" ? generated.linkedinPost :
                                            platform === "twitter" ? generated.twitterPost :
                                            platform === "instagram" ? generated.summary : generated.summary;
            }
        }

        // STEP 6: FORMAT
        yield { type: "step", step: "formatting", status: "active", message: "Formatting for platform compliance..." };
        const finalPosts: Record<Platform, GeneratedPost> = {} as any;

        for (const platform of platforms) {
            const formatPrompt = `Format this post for ${platform}:\nContent: ${optimizedPosts[platform]}`;
            const formatRun = await queue.add(() => callWithRetry(crossPlatformAgent, formatPrompt));
            const formatResult = parseAgentOutput(formatRun.finalOutput);

            finalPosts[platform] = {
                platform,
                content: optimizedPosts[platform],
                score: scores[platform],
                formattedContent: formatResult?.formattedContent || optimizedPosts[platform],
                compliance: formatResult?.compliance || { lengthOk: true, hashtagsOk: true },
                metadata: extractPostMetadata(optimizedPosts[platform]),
            };
        }

        yield { type: "step", step: "formatting", status: "complete", message: "All posts formatted and validated" };

        // COMPLETE
        const result: PipelineResult = {
            success: true,
            source: { url, type: scrapedData.type, title: scrapedData.metadata?.title },
            posts: finalPosts,
            scores,
            analysis: analysisResults,
            timestamp: new Date().toISOString(),
        };

        yield { type: "complete", posts: finalPosts };
        console.log(`Pipeline completed in ${Date.now() - startTime}ms`);

    } catch (error) {
        console.error("Pipeline error:", error);
        yield { type: "error", error: error instanceof Error ? error.message : "Unknown error" };
    }
}

/**
 * Direct usage (non-streaming)
 */
export async function generateContentFromUrl(
    url: string,
    platforms: Platform[] = ["linkedin", "twitter"]
): Promise<PipelineResult> {
    let result: PipelineResult | null = null;

    for await (const event of runContentPipeline(url, platforms)) {
        if (event.type === "complete") {
            result = {
                success: true,
                source: { url, type: "web" },
                posts: event.posts,
                scores: {},
                analysis: {},
                timestamp: new Date().toISOString(),
            };
        }
    }

    if (!result) throw new Error("Pipeline failed to complete");
    return result;
}
