import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

// Mock trending posts data - will be replaced with real API calls when credentials available
const MOCK_X_TRENDS = [
    {
        id: '1',
        content: 'Just shipped a major feature and the lessons learned were incredible. Here\'s what I wish I knew earlier: 1. Start with the end user in mind 2. Test early, test often 3. Documentation is not optional',
        engagement: { likes: 15420, retweets: 3200, replies: 450 },
        patterns: ['numbered list', 'personal story', 'lessons learned', 'strong hook'],
    },
    {
        id: '2',
        content: 'Unpopular opinion: The best content strategy is no strategy at all. Just share what you\'re genuinely excited about. Authenticity wins every time.',
        engagement: { likes: 8900, retweets: 1500, replies: 320 },
        patterns: ['contrarian take', 'unpopular opinion', 'short and punchy', 'call to emotion'],
    },
    {
        id: '3',
        content: '🧵 Thread: How we grew from 0 to 100K users in 6 months (a brutally honest breakdown)',
        engagement: { likes: 25000, retweets: 8900, replies: 1200 },
        patterns: ['thread format', 'emoji hook', 'numbers/metrics', 'promise of value'],
    },
];

const MOCK_LINKEDIN_TRENDS = [
    {
        id: '1',
        content: 'I was rejected 47 times before landing my dream job.\n\nHere\'s what finally worked:\n\n1. I stopped applying blindly\n2. I started reaching out to employees directly\n3. I shared my journey publicly\n\nThe result? 3 offers in 2 weeks.',
        engagement: { likes: 12000, comments: 890, shares: 450 },
        patterns: ['personal struggle story', 'numbered tips', 'transformation narrative', 'specific numbers'],
    },
    {
        id: '2',
        content: 'The best career advice I ever received:\n\n"Your network is your net worth."\n\nBut here\'s the part most people miss...\n\nIt\'s not about who YOU know.\n\nIt\'s about who knows YOU.',
        engagement: { likes: 18500, comments: 1200, shares: 890 },
        patterns: ['quote hook', 'line breaks for readability', 'twist/revelation', 'wisdom share'],
    },
    {
        id: '3',
        content: 'I made $0 in my first year of freelancing.\n\nYear 2: $50K\nYear 3: $150K\nYear 5: $500K+\n\nThe difference wasn\'t skill. It was positioning.\n\nHere\'s exactly what changed 👇',
        engagement: { likes: 32000, comments: 2100, shares: 1500 },
        patterns: ['numbers/metrics journey', 'before/after', 'promise of secrets', 'emoji CTA'],
    },
];

export const trendAnalysisTool = createTool({
    id: 'trend-analysis',
    description: 'Analyzes trending posts on X (Twitter) and LinkedIn to extract patterns and insights',
    inputSchema: z.object({
        platform: z.enum(['x', 'linkedin', 'both']).describe('Platform to analyze'),
        topic: z.string().optional().describe('Optional topic to filter trends'),
        count: z.number().min(1).max(10).default(5).describe('Number of trending posts to analyze'),
    }),
    outputSchema: z.object({
        platform: z.string(),
        trends: z.array(z.object({
            id: z.string(),
            content: z.string(),
            engagement: z.record(z.number()),
            patterns: z.array(z.string()),
        })),
        insights: z.object({
            commonPatterns: z.array(z.string()),
            avgEngagement: z.record(z.number()),
            recommendations: z.array(z.string()),
        }),
        isMockData: z.boolean(),
    }),
    execute: async ({ context }) => {
        const { platform, count = 5 } = context;

        // Check if we have real API credentials
        const hasXCredentials = !!process.env.TWITTER_BEARER_TOKEN;
        const hasLinkedInCredentials = !!process.env.LINKEDIN_CLIENT_ID && !!process.env.LINKEDIN_CLIENT_SECRET;

        let trends: typeof MOCK_X_TRENDS = [];
        let isMockData = true;

        if (platform === 'x' || platform === 'both') {
            if (hasXCredentials) {
                // TODO: Implement real X API call when credentials available
                // For now, use mock data
                trends = [...trends, ...MOCK_X_TRENDS.slice(0, count)];
            } else {
                trends = [...trends, ...MOCK_X_TRENDS.slice(0, count)];
            }
        }

        if (platform === 'linkedin' || platform === 'both') {
            if (hasLinkedInCredentials) {
                // TODO: Implement real LinkedIn API call when credentials available
                // For now, use mock data with LinkedIn structure
                const linkedInTrends = MOCK_LINKEDIN_TRENDS.slice(0, count).map(t => ({
                    ...t,
                    engagement: { likes: t.engagement.likes, shares: t.engagement.shares, comments: t.engagement.comments },
                }));
                trends = [...trends, ...linkedInTrends];
            } else {
                const linkedInTrends = MOCK_LINKEDIN_TRENDS.slice(0, count).map(t => ({
                    ...t,
                    engagement: { likes: t.engagement.likes, shares: t.engagement.shares, comments: t.engagement.comments },
                }));
                trends = [...trends, ...linkedInTrends];
            }
        }

        // Extract common patterns
        const allPatterns = trends.flatMap(t => t.patterns);
        const patternCounts = allPatterns.reduce((acc, pattern) => {
            acc[pattern] = (acc[pattern] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const commonPatterns = Object.entries(patternCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([pattern]) => pattern);

        // Calculate average engagement
        const avgEngagement: Record<string, number> = {};
        const engagementKeys = new Set(trends.flatMap(t => Object.keys(t.engagement)));

        for (const key of engagementKeys) {
            const values = trends.map(t => t.engagement[key] || 0);
            avgEngagement[key] = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
        }

        // Generate recommendations based on patterns
        const recommendations = [
            commonPatterns.includes('numbered list') ? 'Use numbered lists for easy scanning' : null,
            commonPatterns.includes('personal story') ? 'Share personal experiences and lessons' : null,
            commonPatterns.includes('strong hook') ? 'Start with an attention-grabbing hook' : null,
            commonPatterns.includes('numbers/metrics') ? 'Include specific numbers and metrics' : null,
            commonPatterns.includes('thread format') ? 'Consider thread format for longer content' : null,
            'Keep your content authentic and value-focused',
            'Engage with your audience through questions or CTAs',
        ].filter(Boolean) as string[];

        return {
            platform,
            trends: trends.slice(0, count),
            insights: {
                commonPatterns,
                avgEngagement,
                recommendations,
            },
            isMockData,
        };
    },
});
