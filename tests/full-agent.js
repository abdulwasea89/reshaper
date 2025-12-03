// full-agent.js - Multi-Agent Content Intelligence Platform
import "dotenv/config";
import { Agent, run, tool } from "@openai/agents";
import { aisdk } from "@openai/agents-extensions";
import { google } from "@ai-sdk/google";
import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";
import RSSParser from "rss-parser";
import ytdl from "ytdl-core";
import z from "zod";
import axios from "axios";

/**
 * ═══════════════════════════════════════════════════════════
 *  TOOLS - Building Blocks for Agent Capabilities
 * ═══════════════════════════════════════════════════════════
 */

// ────────────────────────────────────────────────────────────
// 1. WEB SCRAPER TOOLS
// ────────────────────────────────────────────────────────────

const scrapeWebTool = tool({
  name: "scrape_web",
  description: "Scrape webpage content and metadata using Cheerio",
  parameters: z.object({ url: z.string().url() }),
  execute: async ({ url }) => {
    try {
      const loader = new CheerioWebBaseLoader(url);
      const docs = await loader.load();
      const doc = docs[0] || { pageContent: "", metadata: {} };
      return {
        success: true,
        type: "web",
        source: url,
        content: doc.pageContent || "",
        metadata: {
          title: doc.metadata?.title || "",
          description: doc.metadata?.description || "",
          images: doc.metadata?.images || [],
          author: doc.metadata?.author || ""
        },
      };
    } catch (error) {
      return {
        success: false,
        type: "web",
        source: url,
        content: "",
        metadata: {},
        error: error.message
      };
    }
  },
});

const scrapeYouTubeTool = tool({
  name: "scrape_youtube",
  description: "Extract YouTube video metadata and transcript",
  parameters: z.object({ url: z.string() }),
  execute: async ({ url }) => {
    try {
      const info = await ytdl.getInfo(url);
      const { title, description, author, viewCount, likes } = info.videoDetails;
      return {
        success: true,
        type: "youtube",
        source: url,
        content: description,
        metadata: {
          title,
          author: author.name,
          viewCount: parseInt(viewCount),
          likes: likes || 0,
          publishDate: info.videoDetails.publishDate,
        },
      };
    } catch (error) {
      return {
        success: false,
        type: "youtube",
        source: url,
        content: "",
        metadata: {},
        error: error.message
      };
    }
  },
});

const scrapeRSSTool = tool({
  name: "scrape_rss",
  description: "Parse RSS feed and extract articles",
  parameters: z.object({ url: z.string() }),
  execute: async ({ url }) => {
    try {
      const parser = new RSSParser();
      const feed = await parser.parseURL(url);
      const articles = feed.items.slice(0, 5).map(item => ({
        title: item.title || "",
        content: item.contentSnippet || item.content || "",
        link: item.link || "",
        pubDate: item.pubDate || "",
      }));
      return {
        success: true,
        type: "rss",
        source: url,
        content: JSON.stringify(articles),
        metadata: {
          feedTitle: feed.title || "",
          feedDescription: feed.description || "",
          articleCount: articles.length,
        },
      };
    } catch (error) {
      return {
        success: false,
        type: "rss",
        source: url,
        content: "",
        metadata: {},
        error: error.message
      };
    }
  },
});

// ────────────────────────────────────────────────────────────
// 2. SIMILAR POSTS ANALYZER TOOLS
// ────────────────────────────────────────────────────────────

const analyzeSimilarPostsTool = tool({
  name: "analyze_similar_posts",
  description: "Analyze trending and underperforming posts on a platform",
  parameters: z.object({
    query: z.string(),
    platform: z.enum(["linkedin", "twitter", "instagram", "threads"]),
  }),
  execute: async ({ query, platform }) => {
    // Placeholder for real API integration (LinkedIn, X, Instagram Graph API)
    // This would call platform APIs to fetch similar posts and analyze engagement

    const mockTrendingPosts = [
      {
        content: "Quick tips on AI that went viral...",
        engagement: { likes: 5420, comments: 342, shares: 891 },
        reasons: ["Strong hook", "List format", "Actionable tips", "Perfect timing (morning)"]
      },
      {
        content: "Here's what nobody tells you about...",
        engagement: { likes: 3210, comments: 198, shares: 445 },
        reasons: ["Curiosity gap", "Bold statement", "Personal story"]
      }
    ];

    const mockUnderperformingPosts = [
      {
        content: "Check out this article about AI...",
        engagement: { likes: 23, comments: 2, shares: 1 },
        reasons: ["Weak hook", "Too generic", "No value proposition", "Bad timing (late night)"]
      }
    ];

    return {
      success: true,
      platform,
      query,
      trending: mockTrendingPosts,
      underperforming: mockUnderperformingPosts,
      insights: {
        bestHooks: ["Quick tips on...", "Here's what nobody tells you...", "I analyzed 100+ posts..."],
        bestFormats: ["Numbered lists", "Before/After", "Story + lesson"],
        bestHashtags: ["#AI", "#ProductivityHacks", "#TechTrends"],
        bestPostingTimes: ["8-9 AM", "12-1 PM", "5-6 PM"],
        avgEngagementRate: 4.2,
      },
    };
  },
});

const fetchPlatformTrendsTool = tool({
  name: "fetch_platform_trends",
  description: "Get current trending topics and hashtags for a platform",
  parameters: z.object({
    platform: z.enum(["linkedin", "twitter", "instagram", "threads"]),
  }),
  execute: async ({ platform }) => {
    // Placeholder: Would integrate with Twitter Trends API, LinkedIn Trends, etc.
    return {
      success: true,
      platform,
      trends: [
        { topic: "Artificial Intelligence", volume: 125000, growth: "+45%" },
        { topic: "Remote Work", volume: 89000, growth: "+12%" },
        { topic: "Sustainability", volume: 67000, growth: "+28%" },
      ],
      trendingHashtags: ["#AI", "#FutureOfWork", "#Innovation", "#TechLeadership"],
    };
  },
});

// ────────────────────────────────────────────────────────────
// 3. VIRALITY SCORER TOOLS
// ────────────────────────────────────────────────────────────

const scoreViralityTool = tool({
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
    // Virality scoring algorithm
    let score = 50; // Base score

    // Hook scoring (0-20 points)
    if (metadata.hasHook) score += 20;

    // Format scoring (0-15 points)
    const goodFormats = ["list", "story", "question", "statistics"];
    if (goodFormats.some(fmt => metadata.format.toLowerCase().includes(fmt))) {
      score += 15;
    }

    // Hashtag scoring (0-10 points)
    const hashtagCount = metadata.hashtags.length;
    if (platform === "linkedin" && hashtagCount >= 3 && hashtagCount <= 5) {
      score += 10;
    } else if (platform === "twitter" && hashtagCount >= 1 && hashtagCount <= 2) {
      score += 10;
    } else if (platform === "instagram" && hashtagCount >= 5 && hashtagCount <= 10) {
      score += 10;
    }

    // Length scoring (0-10 points)
    const optimalLengths = {
      linkedin: { min: 150, max: 300 },
      twitter: { min: 100, max: 280 },
      instagram: { min: 100, max: 200 },
      threads: { min: 100, max: 500 },
    };
    const optimal = optimalLengths[platform];
    if (metadata.wordCount >= optimal.min && metadata.wordCount <= optimal.max) {
      score += 10;
    }

    // Emoji scoring (0-5 points)
    if (metadata.hasEmojis && platform !== "linkedin") score += 5;

    // CTA scoring (0-10 points)
    if (metadata.hasCTA) score += 10;

    // Engagement prediction
    const percentile = Math.min(99, Math.max(1, score));
    const predictedEngagement = {
      likes: Math.floor(percentile * 100),
      comments: Math.floor(percentile * 10),
      shares: Math.floor(percentile * 5),
    };

    return {
      success: true,
      viralityScore: score,
      percentile,
      predictedEngagement,
      strengths: [],
      weaknesses: [],
      recommendations: [
        score < 60 && !metadata.hasHook ? "Add a strong hook in the first line" : null,
        score < 60 && !metadata.hasCTA ? "Include a clear call-to-action" : null,
        score < 60 ? "Consider using a list or story format" : null,
      ].filter(Boolean),
    };
  },
});

// ────────────────────────────────────────────────────────────
// 4. CONTENT OPTIMIZER TOOLS
// ────────────────────────────────────────────────────────────

const optimizeContentTool = tool({
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
    // This would typically call an LLM to rewrite the content
    // For now, we'll provide optimization suggestions

    const suggestions = [];

    if (viralityScore < 60) {
      suggestions.push({
        type: "hook",
        suggestion: `Try starting with: "${similarPostInsights.bestHooks[0]}"`,
        impact: "high",
      });
    }

    if (!originalContent.includes("\n\n")) {
      suggestions.push({
        type: "format",
        suggestion: "Break content into shorter paragraphs for better readability",
        impact: "medium",
      });
    }

    suggestions.push({
      type: "hashtags",
      suggestion: `Add these trending hashtags: ${similarPostInsights.bestHashtags.slice(0, 3).join(", ")}`,
      impact: "medium",
    });

    return {
      success: true,
      optimizedContent: originalContent, // Would be AI-rewritten version
      suggestions,
      improvements: {
        readability: "+15%",
        engagement: "+25%",
        virality: "+30%",
      },
    };
  },
});

// ────────────────────────────────────────────────────────────
// 5. CROSS-PLATFORM FORMATTING TOOLS
// ────────────────────────────────────────────────────────────

const formatForPlatformTool = tool({
  name: "format_for_platform",
  description: "Format content specifically for each platform's best practices",
  parameters: z.object({
    content: z.string(),
    platform: z.enum(["linkedin", "twitter", "instagram", "threads"]),
  }),
  execute: async ({ content, platform }) => {
    const platformRules = {
      linkedin: {
        maxLength: 3000,
        hashtagLimit: 5,
        emojiUse: "minimal",
        format: "Professional tone, paragraphs with line breaks",
      },
      twitter: {
        maxLength: 280,
        hashtagLimit: 2,
        emojiUse: "moderate",
        format: "Concise, punchy, thread-friendly",
      },
      instagram: {
        maxLength: 2200,
        hashtagLimit: 10,
        emojiUse: "generous",
        format: "Visual-first, storytelling",
      },
      threads: {
        maxLength: 500,
        hashtagLimit: 3,
        emojiUse: "moderate",
        format: "Conversational, thread structure",
      },
    };

    const rules = platformRules[platform];
    const truncatedContent = content.slice(0, rules.maxLength);

    return {
      success: true,
      platform,
      formattedContent: truncatedContent,
      rules,
      compliance: {
        lengthOk: content.length <= rules.maxLength,
        formatSuggestion: rules.format,
      },
    };
  },
});

// ────────────────────────────────────────────────────────────
// 6. FEEDBACK LOOP TOOLS
// ────────────────────────────────────────────────────────────

const trackPerformanceTool = tool({
  name: "track_performance",
  description: "Monitor post performance and update learning models",
  parameters: z.object({
    postId: z.string(),
    platform: z.string(),
    predictedScore: z.number(),
  }),
  execute: async ({ postId, platform, predictedScore }) => {
    // Placeholder: Would integrate with platform APIs to track real performance
    const actualEngagement = {
      likes: Math.floor(Math.random() * 1000),
      comments: Math.floor(Math.random() * 100),
      shares: Math.floor(Math.random() * 50),
    };

    const actualScore = (actualEngagement.likes + actualEngagement.comments * 5 + actualEngagement.shares * 10) / 10;
    const accuracy = 100 - Math.abs(predictedScore - actualScore);

    return {
      success: true,
      postId,
      platform,
      predictedScore,
      actualScore,
      accuracy: `${accuracy.toFixed(1)}%`,
      actualEngagement,
      learningUpdate: accuracy < 80 ? "Model needs adjustment" : "Model performing well",
    };
  },
});


/**
 * ═══════════════════════════════════════════════════════════
 *  MODEL CONFIGURATION
 * ═══════════════════════════════════════════════════════════
 */

const model = aisdk(
  google("models/gemini-2.0-flash", {
    apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY || "",
  })
);


/**
 * ═══════════════════════════════════════════════════════════
 *  AGENTS - Specialized AI Workers
 * ═══════════════════════════════════════════════════════════
 */

// ────────────────────────────────────────────────────────────
// 1. SCRAPER AGENT
// ────────────────────────────────────────────────────────────

const scraperAgent = new Agent({
  name: "ScraperAgent",
  model,
  tools: [scrapeWebTool, scrapeYouTubeTool, scrapeRSSTool],
  instructions: `
You are the Scraper Agent. Your job is to extract content from any URL.

**Capabilities:**
- Web pages: Use scrape_web
- YouTube videos: Use scrape_youtube  
- RSS feeds: Use scrape_rss

**Process:**
1. Identify URL type
2. Call the appropriate scraping tool
3. Return structured data with content and metadata

**Output Format:**
{
  "success": true/false,
  "type": "web/youtube/rss",
  "source": "url",
  "content": "extracted content",
  "metadata": { ... }
}
`,
});

// ────────────────────────────────────────────────────────────
// 2. SIMILAR POSTS ANALYZER AGENT
// ────────────────────────────────────────────────────────────

const analyzerAgent = new Agent({
  name: "AnalyzerAgent",
  model,
  tools: [analyzeSimilarPostsTool, fetchPlatformTrendsTool],
  instructions: `
You are the Analyzer Agent. Your job is to research what works on each platform.

**Capabilities:**
- Analyze trending posts: Use analyze_similar_posts
- Get current trends: Use fetch_platform_trends

**Process:**
1. Research similar content on the target platform
2. Identify what makes top posts successful
3. Identify why underperforming posts fail
4. Extract patterns: hooks, formats, hashtags, timing

**Output Format:**
{
  "trending": [...],
  "underperforming": [...],
  "insights": {
    "bestHooks": [...],
    "bestFormats": [...],
    "bestHashtags": [...],
    "bestPostingTimes": [...]
  }
}
`,
});

// ────────────────────────────────────────────────────────────
// 3. POST GENERATOR AGENT
// ────────────────────────────────────────────────────────────

const generatorAgent = new Agent({
  name: "GeneratorAgent",
  model,
  instructions: `
You are the Post Generator Agent. Your job is to create engaging social media posts.

**Input:**
- Scraped content
- Analysis insights from AnalyzerAgent

**Process:**
1. Extract key points from source content
2. Apply successful patterns from analysis
3. Create platform-specific posts with:
   - Strong hooks (first 1-2 lines)
   - Clear structure (lists, stories, questions)
   - Relevant hashtags
   - Call-to-action

**Output Format for each platform:**
{
  "linkedin": "...",
  "twitter": "...",
  "instagram": "...",
  "threads": "..."
}

**Best Practices:**
- LinkedIn: Professional, insightful, 150-300 words
- Twitter: Concise, punchy, under 280 chars
- Instagram: Visual, storytelling, 100-200 words
- Threads: Conversational, thread-ready, 100-500 words
`,
});

// ────────────────────────────────────────────────────────────
// 4. VIRALITY SCORER AGENT
// ────────────────────────────────────────────────────────────

const scorerAgent = new Agent({
  name: "ScorerAgent",
  model,
  tools: [scoreViralityTool],
  instructions: `
You are the Virality Scorer Agent. Your job is to predict engagement.

**Process:**
1. Analyze post content
2. Extract features: hook, format, hashtags, length, emojis, CTA
3. Use score_virality tool to get predictions
4. Return score (0-100) and engagement predictions

**Scoring Factors:**
- Hook quality: 0-20 points
- Format effectiveness: 0-15 points
- Hashtag optimization: 0-10 points
- Optimal length: 0-10 points
- Emoji usage: 0-5 points
- CTA presence: 0-10 points

**Output:**
{
  "viralityScore": 85,
  "percentile": 85,
  "predictedEngagement": { likes, comments, shares },
  "recommendations": [...]
}
`,
});

// ────────────────────────────────────────────────────────────
// 5. CONTENT OPTIMIZER AGENT
// ────────────────────────────────────────────────────────────

const optimizerAgent = new Agent({
  name: "OptimizerAgent",
  model,
  tools: [optimizeContentTool],
  instructions: `
You are the Content Optimizer Agent. Your job is to improve posts based on scoring.

**Input:**
- Generated post
- Virality score
- Analysis insights

**Process:**
1. If score < 70, suggest improvements
2. Use optimize_content tool
3. Apply best practices from similar posts
4. Refine hooks, structure, hashtags

**Output:**
{
  "optimizedContent": "improved version",
  "suggestions": [...],
  "improvements": { readability, engagement, virality }
}
`,
});

// ────────────────────────────────────────────────────────────
// 6. CROSS-PLATFORM SYNC AGENT
// ────────────────────────────────────────────────────────────

const crossPlatformAgent = new Agent({
  name: "CrossPlatformAgent",
  model,
  tools: [formatForPlatformTool],
  instructions: `
You are the Cross-Platform Sync Agent. Your job is to format posts for each platform.

**Process:**
1. Take optimized content
2. Use format_for_platform for each platform
3. Ensure compliance with platform rules
4. Apply platform-specific best practices

**Platform Rules:**
- LinkedIn: Max 3000 chars, 3-5 hashtags, professional tone
- Twitter: Max 280 chars, 1-2 hashtags, concise
- Instagram: Max 2200 chars, 5-10 hashtags, visual
- Threads: Max 500 chars, 2-3 hashtags, conversational

**Output:**
{
  "linkedin": { content, rules, compliance },
  "twitter": { content, rules, compliance },
  "instagram": { content, rules, compliance },
  "threads": { content, rules, compliance }
}
`,
});

// ────────────────────────────────────────────────────────────
// 7. FEEDBACK LOOP AGENT
// ────────────────────────────────────────────────────────────

const feedbackAgent = new Agent({
  name: "FeedbackAgent",
  model,
  tools: [trackPerformanceTool],
  instructions: `
You are the Feedback Loop Agent. Your job is to learn from results.

**Process:**
1. After post is published, track performance
2. Compare predicted vs actual engagement
3. Update internal models based on accuracy
4. Identify patterns in successful/failed predictions

**Output:**
{
  "accuracy": "85%",
  "learningUpdate": "Model performing well / needs adjustment",
  "insights": [...]
}
`,
});

// ────────────────────────────────────────────────────────────
// 8. TREND FINDER AGENT
// ────────────────────────────────────────────────────────────

const trendFinderAgent = new Agent({
  name: "TrendFinderAgent",
  model,
  tools: [fetchPlatformTrendsTool],
  instructions: `
You are the Trend Finder Agent. Your job is to suggest next topics.

**Process:**
1. Monitor platform trends using fetch_platform_trends
2. Identify gaps in current content strategy
3. Suggest trending topics user should post about
4. Prioritize by volume and growth rate

**Output:**
{
  "suggestedTopics": [...],
  "trendingHashtags": [...],
  "contentGaps": [...]
}
`,
});

// ────────────────────────────────────────────────────────────
// 9. SUPERVISOR AGENT (Orchestrator)
// ────────────────────────────────────────────────────────────

const supervisorAgent = new Agent({
  name: "SupervisorAgent",
  model,
  instructions: `
You are the Supervisor Agent. You orchestrate the entire content creation pipeline.

**Pipeline Flow:**
1. User submits URL → ScraperAgent
2. Scraped content → AnalyzerAgent (research similar posts)
3. Content + Analysis → GeneratorAgent (create posts)
4. Generated posts → ScorerAgent (predict engagement)
5. Posts + Scores → OptimizerAgent (improve if score < 70)
6. Optimized posts → CrossPlatformAgent (format for each platform)
7. Final posts → User
8. After publishing → FeedbackAgent (track & learn)
9. Periodic → TrendFinderAgent (suggest next topics)

**Coordination:**
- Route tasks to appropriate agents
- Manage data flow between agents
- Handle errors and retries
- Return final results to user

**Output:**
Complete package with all platform posts, scores, and recommendations.
`,
});


/**
 * ═══════════════════════════════════════════════════════════
 *  PIPELINE ORCHESTRATION
 * ═══════════════════════════════════════════════════════════
 */

async function runAgent(agent, input) {
  const payload = typeof input === "string" ? input : JSON.stringify(input);
  const result = await run(agent, payload);

  if (result?.output?.[0]) {
    const content = result.output[0].content || result.output[0];
    try {
      return JSON.parse(content);
    } catch {
      return content;
    }
  }

  return result;
}

/**
 * Main Content Intelligence Pipeline
 */
async function processContent(url, targetPlatforms = ["linkedin", "twitter", "instagram", "threads"]) {
  console.log("\n═══════════════════════════════════════════════════════════");
  console.log("🚀 MULTI-AGENT CONTENT INTELLIGENCE PIPELINE");
  console.log("═══════════════════════════════════════════════════════════\n");
  console.log(`📎 Input: ${url}`);
  console.log(`🎯 Target Platforms: ${targetPlatforms.join(", ")}\n`);

  // ────────────────────────────────────────────────────────────
  // STEP 1: SCRAPE CONTENT
  // ────────────────────────────────────────────────────────────
  console.log("⚡ Step 1: Scraping content...");
  const scrapedData = await runAgent(scraperAgent, url);
  console.log(`✅ Scraped ${scrapedData.type} content from ${scrapedData.source}`);
  console.log(`   Content length: ${scrapedData.content?.length || 0} chars\n`);

  if (!scrapedData.success) {
    console.error("❌ Scraping failed:", scrapedData.error);
    return { error: "Scraping failed", details: scrapedData };
  }

  // ────────────────────────────────────────────────────────────
  // STEP 2: ANALYZE SIMILAR POSTS
  // ────────────────────────────────────────────────────────────
  console.log("⚡ Step 2: Analyzing similar posts on platforms...");
  const analysisResults = {};

  for (const platform of targetPlatforms) {
    const analysis = await runAgent(analyzerAgent, {
      query: scrapedData.metadata?.title || url,
      platform,
    });
    analysisResults[platform] = analysis;
    console.log(`✅ ${platform}: Found insights on hooks, formats, hashtags`);
  }
  console.log();

  // ────────────────────────────────────────────────────────────
  // STEP 3: GENERATE POSTS
  // ────────────────────────────────────────────────────────────
  console.log("⚡ Step 3: Generating posts for each platform...");
  const generatedPosts = await runAgent(generatorAgent, {
    content: scrapedData.content,
    metadata: scrapedData.metadata,
    analysis: analysisResults,
  });
  console.log("✅ Generated initial posts for all platforms\n");

  // ────────────────────────────────────────────────────────────
  // STEP 4: SCORE VIRALITY
  // ────────────────────────────────────────────────────────────
  console.log("⚡ Step 4: Scoring virality for each post...");
  const scores = {};

  for (const platform of targetPlatforms) {
    const postContent = generatedPosts[platform] || "";
    const metadata = {
      hasHook: postContent.split("\n")[0]?.length > 20,
      format: "professional",
      hashtags: (postContent.match(/#\w+/g) || []),
      wordCount: postContent.split(" ").length,
      hasEmojis: /[\u{1F600}-\u{1F64F}]/u.test(postContent),
      hasCTA: /\b(click|learn|read|check|visit|join|follow)\b/i.test(postContent),
    };

    const score = await runAgent(scorerAgent, {
      content: postContent,
      platform,
      metadata,
    });

    scores[platform] = score;
    console.log(`✅ ${platform}: Virality score ${score.viralityScore}/100 (${score.percentile}th percentile)`);
  }
  console.log();

  // ────────────────────────────────────────────────────────────
  // STEP 5: OPTIMIZE CONTENT
  // ────────────────────────────────────────────────────────────
  console.log("⚡ Step 5: Optimizing low-scoring posts...");
  const optimizedPosts = {};

  for (const platform of targetPlatforms) {
    const score = scores[platform];
    const analysis = analysisResults[platform];

    if (score.viralityScore < 70) {
      console.log(`   🔧 ${platform}: Score ${score.viralityScore} - optimizing...`);
      const optimized = await runAgent(optimizerAgent, {
        originalContent: generatedPosts[platform],
        viralityScore: score.viralityScore,
        similarPostInsights: analysis.insights || {},
      });
      optimizedPosts[platform] = optimized.optimizedContent;
    } else {
      console.log(`   ✓ ${platform}: Score ${score.viralityScore} - no optimization needed`);
      optimizedPosts[platform] = generatedPosts[platform];
    }
  }
  console.log();

  // ────────────────────────────────────────────────────────────
  // STEP 6: CROSS-PLATFORM FORMATTING
  // ────────────────────────────────────────────────────────────
  console.log("⚡ Step 6: Formatting for platform compliance...");
  const finalPosts = {};

  for (const platform of targetPlatforms) {
    const formatted = await runAgent(crossPlatformAgent, {
      content: optimizedPosts[platform],
      platform,
    });
    finalPosts[platform] = formatted;
    console.log(`✅ ${platform}: Formatted and validated`);
  }
  console.log();

  // ────────────────────────────────────────────────────────────
  // STEP 7: TREND SUGGESTIONS
  // ────────────────────────────────────────────────────────────
  console.log("⚡ Step 7: Finding next topic suggestions...");
  const trendSuggestions = await runAgent(trendFinderAgent, {
    platforms: targetPlatforms,
  });
  console.log("✅ Generated topic suggestions based on current trends\n");

  // ────────────────────────────────────────────────────────────
  // FINAL OUTPUT
  // ────────────────────────────────────────────────────────────
  console.log("═══════════════════════════════════════════════════════════");
  console.log("✨ PIPELINE COMPLETE");
  console.log("═══════════════════════════════════════════════════════════\n");

  return {
    success: true,
    source: {
      url,
      type: scrapedData.type,
      title: scrapedData.metadata?.title,
    },
    posts: finalPosts,
    scores,
    analysis: analysisResults,
    nextTopics: trendSuggestions,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Track Performance (Run after publishing)
 */
async function trackPublishedPost(postId, platform, predictedScore) {
  console.log(`\n📊 Tracking performance for ${platform} post ${postId}...`);

  const performance = await runAgent(feedbackAgent, {
    postId,
    platform,
    predictedScore,
  });

  console.log(`✅ Tracking complete: ${performance.accuracy} accuracy`);
  console.log(`   Learning update: ${performance.learningUpdate}\n`);

  return performance;
}


/**
 * ═══════════════════════════════════════════════════════════
 *  MAIN ENTRY POINT
 * ═══════════════════════════════════════════════════════════
 */

async function main() {
  const testUrls = [
    "https://techcrunch.com/2024/12/01/openai-announces-new-features/",
    "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "https://techcrunch.com/feed/",
  ];

  for (const url of testUrls) {
    try {
      const result = await processContent(url);

      console.log("\n📋 FINAL RESULTS:");
      console.log("─────────────────────────────────────────────────────────");
      console.log(JSON.stringify(result, null, 2));
      console.log("─────────────────────────────────────────────────────────\n");

      // Simulate post publishing and tracking
      if (result.success) {
        for (const platform of Object.keys(result.posts)) {
          const score = result.scores[platform];
          // await trackPublishedPost(`post_${Date.now()}`, platform, score.viralityScore);
        }
      }

    } catch (error) {
      console.error("\n❌ Pipeline failed:", error.message);
      console.error(error.stack);
    }
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

// Export for use as module
export {
  processContent,
  trackPublishedPost,
  scraperAgent,
  analyzerAgent,
  generatorAgent,
  scorerAgent,
  optimizerAgent,
  crossPlatformAgent,
  feedbackAgent,
  trendFinderAgent,
  supervisorAgent,
};
