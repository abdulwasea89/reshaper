/**
 * Multi-Agent Content Intelligence System
 * TypeScript Type Definitions
 */

// ══════════════════════════════════════════════════════════
// PLATFORM TYPES
// ══════════════════════════════════════════════════════════

export type Platform = "linkedin" | "twitter" | "instagram" | "threads";

export type ContentType = "web" | "youtube" | "rss";

// ══════════════════════════════════════════════════════════
// PIPELINE STEP TYPES
// ══════════════════════════════════════════════════════════

export type StepStatus = "pending" | "active" | "complete" | "error";

export type PipelineStepName =
    | "scraping"
    | "analyzing"
    | "generating"
    | "scoring"
    | "optimizing"
    | "formatting"
    | "complete";

export interface PipelineStep {
    id: string;
    name: PipelineStepName;
    status: StepStatus;
    message?: string;
    progress?: number;
    startTime?: Date;
    endTime?: Date;
    result?: any;
    error?: string;
}

// ══════════════════════════════════════════════════════════
// SCRAPER TYPES
// ══════════════════════════════════════════════════════════

export interface ScrapedContent {
    success: boolean;
    type: ContentType;
    source: string;
    content: string;
    metadata: {
        title?: string;
        description?: string;
        author?: string;
        publishDate?: string;
        images?: string[];
        viewCount?: number;
        likes?: number;
    };
    error?: string;
}

// ══════════════════════════════════════════════════════════
// ANALYZER TYPES
// ══════════════════════════════════════════════════════════

export interface TrendingPost {
    content: string;
    engagement: {
        likes: number;
        comments: number;
        shares: number;
    };
    reasons: string[];
    url?: string;
}

export interface UnderperformingPost {
    content: string;
    engagement: {
        likes: number;
        comments: number;
        shares: number;
    };
    reasons: string[];
    url?: string;
}

export interface SimilarPostsAnalysis {
    success: boolean;
    platform: Platform;
    query: string;
    trending: TrendingPost[];
    underperforming: UnderperformingPost[];
    insights: {
        bestHooks: string[];
        bestFormats: string[];
        bestHashtags: string[];
        bestPostingTimes: string[];
        avgEngagementRate: number;
    };
}

export interface PlatformTrends {
    success: boolean;
    platform: Platform;
    trends: Array<{
        topic: string;
        volume: number;
        growth: string;
    }>;
    trendingHashtags: string[];
}



// ══════════════════════════════════════════════════════════
// SCORING TYPES
// ══════════════════════════════════════════════════════════

export interface PostMetadata {
    hasHook: boolean;
    format: string;
    hashtags: string[];
    wordCount: number;
    hasEmojis: boolean;
    hasCTA: boolean;
}

export interface ViralityScore {
    success: boolean;
    viralityScore: number; // 0-100
    percentile: number; // 0-100
    predictedEngagement: {
        likes: number;
        comments: number;
        shares: number;
    };
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
}

// ══════════════════════════════════════════════════════════
// OPTIMIZER TYPES
// ══════════════════════════════════════════════════════════

export interface OptimizationSuggestion {
    type: "hook" | "format" | "hashtags" | "cta" | "emoji" | "length";
    suggestion: string;
    impact: "high" | "medium" | "low";
}

export interface OptimizedContent {
    success: boolean;
    optimizedContent: string;
    suggestions: OptimizationSuggestion[];
    improvements: {
        readability: string;
        engagement: string;
        virality: string;
    };
}

// ══════════════════════════════════════════════════════════
// CROSS-PLATFORM TYPES
// ══════════════════════════════════════════════════════════

export interface PlatformRules {
    maxLength: number;
    hashtagLimit: number;
    emojiUse: "minimal" | "moderate" | "generous";
    format: string;
}

export interface FormattedPost {
    success: boolean;
    platform: Platform;
    formattedContent: string;
    rules: PlatformRules;
    compliance: {
        lengthOk: boolean;
        hashtagsOk: boolean;
        formatSuggestion: string;
    };
}

// ══════════════════════════════════════════════════════════
// GENERATED POST TYPES
// ══════════════════════════════════════════════════════════

export interface GeneratedPost {
    platform: Platform;
    content: string;
    score: ViralityScore;
    formattedContent: string;
    compliance: {
        lengthOk: boolean;
        hashtagsOk: boolean;
    };
    metadata: PostMetadata;
}

// ══════════════════════════════════════════════════════════
// FEEDBACK TYPES
// ══════════════════════════════════════════════════════════

export interface PostPerformance {
    success: boolean;
    postId: string;
    platform: Platform;
    predictedScore: number;
    actualScore: number;
    accuracy: string;
    actualEngagement: {
        likes: number;
        comments: number;
        shares: number;
    };
    learningUpdate: string;
}

// ══════════════════════════════════════════════════════════
// PIPELINE EVENT TYPES (for SSE streaming)
// ══════════════════════════════════════════════════════════

export type PipelineEvent =
    | {
        type: "step";
        step: PipelineStepName;
        status: StepStatus;
        message?: string;
        progress?: number;
    }
    | {
        type: "search_results";
        platform: Platform;
        results: string[];
    }
    | {
        type: "score";
        platform: Platform;
        score: ViralityScore;
    }
    | {
        type: "optimization";
        platform: Platform;
        suggestions: OptimizationSuggestion[];
    }
    | {
        type: "complete";
        posts: Record<Platform, GeneratedPost>;
    }
    | {
        type: "error";
        error: string;
        step?: PipelineStepName;
    };

// ══════════════════════════════════════════════════════════
// PIPELINE RESULT TYPE
// ══════════════════════════════════════════════════════════

export interface PipelineResult {
    success: boolean;
    source: {
        url: string;
        type: ContentType;
        title?: string;
    };
    posts: Record<Platform, GeneratedPost>;
    scores: Partial<Record<Platform, ViralityScore>>;
    analysis: Partial<Record<Platform, SimilarPostsAnalysis>>;
    nextTopics?: PlatformTrends;
    timestamp: string;
    error?: string;
}

// ══════════════════════════════════════════════════════════
// AGENT CONFIGURATION TYPES
// ══════════════════════════════════════════════════════════

export interface AgentConfig {
    enableScraper: boolean;
    enableAnalyzer: boolean;
    enableScorer: boolean;
    enableOptimizer: boolean;
    enableFeedback: boolean;
    enableTrendFinder: boolean;
    useMockSimilarPosts: boolean;
    enableCache: boolean;
}

// ══════════════════════════════════════════════════════════
// DATABASE TYPES (aligns with Prisma schema)
// ══════════════════════════════════════════════════════════

export interface PostData {
    id?: string;
    title?: string;
    linkedinPost?: string;
    twitterPost?: string;
    instagramPost?: string;
    threadsPost?: string;
    viralityScores?: Record<Platform, number>;
    predictedEngagement?: Record<Platform, {
        likes: number;
        comments: number;
        shares: number;
    }>;
    actualEngagement?: Record<Platform, {
        likes: number;
        comments: number;
        shares: number;
    }>;
    platforms: Platform[];
    status: "draft" | "published" | "scheduled";
    originalLink?: string;
    userId: string;
    createdAt?: Date;
    updatedAt?: Date;
    publishedAt?: Date;
}

// ══════════════════════════════════════════════════════════
// TOOL EXECUTION TYPES
// ══════════════════════════════════════════════════════════

export interface ToolExecution {
    toolName: string;
    status: "pending" | "running" | "complete" | "error";
    startTime: Date;
    endTime?: Date;
    input: any;
    output?: any;
    error?: string;
}

// ══════════════════════════════════════════════════════════
// CHAIN OF THOUGHT UI TYPES
// ══════════════════════════════════════════════════════════

export interface ChainOfThoughtStep {
    id: string;
    icon?: any; // LucideIcon
    label: string;
    description?: string;
    status: StepStatus;
    searchResults?: string[];
    imageUrl?: string;
    imageCaption?: string;
    metadata?: Record<string, any>;
}

// ══════════════════════════════════════════════════════════
// API REQUEST/RESPONSE TYPES
// ══════════════════════════════════════════════════════════

export interface MultiAgentStreamRequest {
    url: string;
    platforms: Platform[];
    userId: string;
}

export interface MultiAgentStreamResponse {
    stream: ReadableStream<Uint8Array>;
}
