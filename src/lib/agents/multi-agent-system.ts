/**
 * Multi-Agent Content Intelligence System
 * 
 * Implements the OpenAI Agents SDK pattern with Vercel AI SDK adapter.
 * Based on tests/full-agent.js
 */

import { Agent, tool } from "@openai/agents";
import { z } from "zod";
import { geminiModel } from "../ai-config";
import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";
import RSSParser from "rss-parser";
import ytdl from "ytdl-core";
import type {
    Platform,
    ScrapedContent,
    SimilarPostsAnalysis,
    ViralityScore,
    OptimizedContent,
    FormattedPost,
    PostMetadata,
    PlatformTrends,
} from "@/types/multi-agent";

// ══════════════════════════════════════════════════════════
// TOOLS
// ══════════════════════════════════════════════════════════

// 1. WEB SCRAPER TOOLS

export const scrapeWebTool = tool({
    name: "scrape_web",
    description: "Scrape webpage content and metadata using Cheerio",
    parameters: z.object({ url: z.string().url() }),
    execute: async ({ url }) => {
        try {
            const loader = new CheerioWebBaseLoader(url);
            const docs = await loader.load();
            const doc = docs[0] || { pageContent: "", metadata: {} };

            return JSON.stringify({
                success: true,
                type: "web",
                source: url,
                content: doc.pageContent || "",
                metadata: {
                    title: doc.metadata?.title || "",
                    description: doc.metadata?.description || "",
                    images: doc.metadata?.images || [],
                    author: doc.metadata?.author || "",
                },
            });
        } catch (error) {
            return JSON.stringify({
                success: false,
                type: "web",
                source: url,
                error: error instanceof Error ? error.message : "Unknown error",
            });
        }
    },
});

export const scrapeYouTubeTool = tool({
    name: "scrape_youtube",
    description: "Extract YouTube video metadata and description",
    parameters: z.object({ url: z.string() }),
    execute: async ({ url }) => {
        try {
            const info = await ytdl.getInfo(url);
            const details = info.videoDetails as any;
            const { title, description, author, viewCount } = details;

            return JSON.stringify({
                success: true,
                type: "youtube",
                source: url,
                content: description,
                metadata: {
                    title,
                    author: author.name,
                    viewCount: parseInt(viewCount),
                    publishDate: details.publishDate,
                },
            });
        } catch (error) {
            return JSON.stringify({
                success: false,
                type: "youtube",
                source: url,
                error: error instanceof Error ? error.message : "Unknown error",
            });
        }
    },
});

export const scrapeRSSTool = tool({
    name: "scrape_rss",
    description: "Parse RSS feed and extract articles",
    parameters: z.object({ url: z.string() }),
    execute: async ({ url }) => {
        try {
            const parser = new RSSParser();
            const feed = await parser.parseURL(url);
            const articles = feed.items.slice(0, 5).map((item) => ({
                title: item.title || "",
                content: item.contentSnippet || item.content || "",
                link: item.link || "",
                pubDate: item.pubDate || "",
            }));

            return JSON.stringify({
                success: true,
                type: "rss",
                source: url,
                content: JSON.stringify(articles),
                metadata: {
                    title: feed.title || "",
                    description: feed.description || "",
                },
            });
        } catch (error) {
            return JSON.stringify({
                success: false,
                type: "rss",
                source: url,
                error: error instanceof Error ? error.message : "Unknown error",
            });
        }
    },
});

// 2. SIMILAR POSTS ANALYZER TOOLS

export const analyzeSimilarPostsTool = tool({
    name: "analyze_similar_posts",
    description: "Analyze trending and underperforming posts on a platform",
    parameters: z.object({
        query: z.string(),
        platform: z.enum(["linkedin", "twitter", "instagram", "threads"]),
    }),
    execute: async ({ query, platform }) => {
        // Mock data for now
        return JSON.stringify({
            success: true,
            platform,
            query,
            trending: [
                {
                    content: "🚀 Quick tips on AI that went viral...",
                    engagement: { likes: 5420, comments: 342, shares: 891 },
                    reasons: ["Strong hook", "List format", "Actionable tips"],
                    url: `https://${platform}.com/post/trending1`,
                },
            ],
            underperforming: [],
            insights: {
                bestHooks: ["🚀 Quick tips on...", "Here's what nobody tells you..."],
                bestFormats: ["Numbered lists", "Story + lesson"],
                bestHashtags: ["#AI", "#TechTrends"],
                bestPostingTimes: ["8-9 AM", "5-6 PM"],
                avgEngagementRate: 4.2,
            },
        });
    },
});

export const fetchPlatformTrendsTool = tool({
    name: "fetch_platform_trends",
    description: "Get current trending topics and hashtags for a platform",
    parameters: z.object({
        platform: z.enum(["linkedin", "twitter", "instagram", "threads"]),
    }),
    execute: async ({ platform }) => {
        return JSON.stringify({
            success: true,
            platform,
            trends: [
                { topic: "Artificial Intelligence", volume: 125000, growth: "+45%" },
                { topic: "Remote Work", volume: 89000, growth: "+12%" },
            ],
            trendingHashtags: ["#AI", "#FutureOfWork", "#Innovation"],
        });
    },
});

// 3. VIRALITY SCORER TOOL

export const scoreViralityTool = tool({
    name: "score_virality",
    description: "Predict engagement score for a post based on multiple factors",
    parameters: z.object({
        content: z.string(),
        platform: z.enum(["linkedin", "twitter", "instagram", "threads"]),
        metadata: z.object({
            hasHook: z.boolean(),
            format: z.string(),
            hashtags: z.array(z.string()),
            wordCount: z.number(),
            hasEmojis: z.boolean(),
            hasCTA: z.boolean(),
        }),
    }),
    execute: async ({ content, platform, metadata }) => {
        let score = 50;
        if (metadata.hasHook) score += 20;
        if (metadata.hasCTA) score += 10;
        if (metadata.wordCount > 50) score += 10;

        score = Math.min(100, score);

        return JSON.stringify({
            success: true,
            viralityScore: score,
            percentile: score,
            predictedEngagement: {
                likes: score * 10,
                comments: score,
                shares: score / 2,
            },
            strengths: metadata.hasHook ? ["Strong hook"] : [],
            weaknesses: !metadata.hasCTA ? ["Missing CTA"] : [],
            recommendations: score < 70 ? ["Add a hook", "Include CTA"] : [],
        });
    },
});

// 4. CONTENT OPTIMIZER TOOL

export const optimizeContentTool = tool({
    name: "optimize_content",
    description: "Refine post content based on analysis and scoring",
    parameters: z.object({
        originalContent: z.string(),
        viralityScore: z.number(),
        similarPostInsights: z.object({
            bestHooks: z.array(z.string()),
            bestFormats: z.array(z.string()),
            bestHashtags: z.array(z.string()),
        }),
    }),
    execute: async ({ originalContent, viralityScore, similarPostInsights }) => {
        return JSON.stringify({
            success: true,
            optimizedContent: originalContent + "\n\n#Optimized",
            suggestions: [
                { type: "hook", suggestion: "Use a stronger hook", impact: "high" },
            ],
            improvements: {
                readability: "+10%",
                engagement: "+20%",
                virality: "+15%",
            },
        });
    },
});

// 5. CROSS-PLATFORM FORMATTING TOOL

export const formatForPlatformTool = tool({
    name: "format_for_platform",
    description: "Format content specifically for each platform's best practices",
    parameters: z.object({
        content: z.string(),
        platform: z.enum(["linkedin", "twitter", "instagram", "threads"]),
    }),
    execute: async ({ content, platform }) => {
        const maxLengths: Record<string, number> = {
            linkedin: 3000,
            twitter: 280,
            instagram: 2200,
            threads: 500,
        };
        const maxLength = maxLengths[platform] || 280;

        return JSON.stringify({
            success: true,
            platform,
            formattedContent: content.slice(0, maxLength),
            rules: { maxLength },
            compliance: {
                lengthOk: content.length <= maxLength,
                hashtagsOk: true,
                formatSuggestion: "Good",
            },
        });
    },
});

// ══════════════════════════════════════════════════════════
// AGENTS
// ══════════════════════════════════════════════════════════

export const scraperAgent = new Agent({
    name: "ScraperAgent",
    model: geminiModel,
    tools: [scrapeWebTool, scrapeYouTubeTool, scrapeRSSTool],
    instructions: `You are the Scraper Agent. Extract content from URLs.
1. Identify if it's web, YouTube, or RSS
2. Use the appropriate scraping tool
3. Return structured content with metadata`,
});

export const analyzerAgent = new Agent({
    name: "AnalyzerAgent",
    model: geminiModel,
    tools: [analyzeSimilarPostsTool, fetchPlatformTrendsTool],
    instructions: `You are the Analyzer Agent. Research what works on social platforms.
1. Analyze similar successful posts
2. Identify patterns in hooks, formats, hashtags
3. Note optimal posting times`,
});

export const scorerAgent = new Agent({
    name: "ScorerAgent",
    model: geminiModel,
    tools: [scoreViralityTool],
    instructions: `You are the Virality Scorer Agent. Predict post engagement.
1. Extract features (hook, format, hashtags, length, emojis, CTA)
2. Calculate virality score (0-100)
3. Predict engagement metrics`,
});

export const optimizerAgent = new Agent({
    name: "OptimizerAgent",
    model: geminiModel,
    tools: [optimizeContentTool],
    instructions: `You are the Content Optimizer Agent. Improve low-scoring posts.
1. Identify specific weaknesses
2. Apply best practices from analysis
3. Suggest concrete improvements`,
});

export const crossPlatformAgent = new Agent({
    name: "CrossPlatformAgent",
    model: geminiModel,
    tools: [formatForPlatformTool],
    instructions: `You are the Cross-Platform Agent. Format posts for each platform.
Ensure posts comply with character limits and platform norms.`,
});

// Helper functions

export function extractPostMetadata(content: string): PostMetadata {
    const firstLine = content.split("\n")[0] || "";
    const hashtags = content.match(/#\w+/g) || [];
    const words = content.split(/\s+/).filter((w) => w.length > 0);

    return {
        hasHook: firstLine.length > 20,
        format: content.includes("\n\n") ? "paragraphs" : "single",
        hashtags,
        wordCount: words.length,
        hasEmojis: /[\u{1F600}-\u{1F64F}]/u.test(content),
        hasCTA: /\b(click|learn|read|check|visit|join|follow|comment|share)\b/i.test(content),
    };
}

export function determineContentType(url: string): "web" | "youtube" | "rss" {
    if (url.includes("youtube.com") || url.includes("youtu.be")) {
        return "youtube";
    }
    if (url.includes("/feed") || url.includes("rss") || url.includes(".xml")) {
        return "rss";
    }
    return "web";
}
