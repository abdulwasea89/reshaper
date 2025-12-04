import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { postVersionId, content, platform = 'x', scores, suggestions } = body;

        if (!content && !postVersionId) {
            return NextResponse.json(
                { error: "Either content or postVersionId is required" },
                { status: 400 }
            );
        }

        let postContent = content;
        let postVersion = null;
        let currentScores = scores;
        let currentSuggestions = suggestions;

        // Get content from post version if ID provided
        if (postVersionId) {
            postVersion = await prisma.postVersion.findUnique({
                where: { id: postVersionId },
                include: { post: true },
            });

            if (!postVersion || postVersion.post.userId !== session.user.id) {
                return NextResponse.json(
                    { error: "Post version not found or unauthorized" },
                    { status: 404 }
                );
            }

            postContent = postVersion.content;
            currentScores = postVersion.scoreDetails as Record<string, number> || scores;
            currentSuggestions = postVersion.suggestions || suggestions;
        }

        const model = google("gemini-2.5-pro");

        const optimizePrompt = `You are an expert social media content optimizer. Improve this post to increase its virality score.

ORIGINAL POST:
"${postContent}"

PLATFORM: ${platform === 'x' ? 'X (Twitter) - 280 char limit' : 'LinkedIn - use line breaks, professional tone'}

CURRENT SCORES (out of 10):
${currentScores ? Object.entries(currentScores).map(([k, v]) => `- ${k}: ${v}`).join('\n') : 'Not available'}

SUGGESTIONS TO ADDRESS:
${Array.isArray(currentSuggestions) ? currentSuggestions.map((s, i) => `${i + 1}. ${s}`).join('\n') : 'Improve overall quality'}

OPTIMIZATION RULES:
1. Keep the core message intact
2. Strengthen the hook - use pattern interrupts, surprising stats, or bold claims
3. Improve clarity - one idea per sentence, simple words
4. Boost emotion - add stakes, personal connection, transformation
5. Increase novelty - unique angle, contrarian view, specific numbers
6. Fix platform compliance - correct length, formatting, hashtags

${platform === 'x' ? 'CRITICAL: Keep under 280 characters or format as a thread.' : 'CRITICAL: Use line breaks between paragraphs for readability.'}

Respond ONLY with valid JSON:
{
  "optimizedContent": "The improved post content",
  "changes": ["Change 1", "Change 2"],
  "platformVersions": {
    "x": "280-char X version or thread format",
    "linkedin": "LinkedIn formatted version with line breaks"
  },
  "hashtags": ["hashtag1", "hashtag2"],
  "estimatedScoreImprovement": 1.5
}`;

        const result = await generateText({
            model,
            prompt: optimizePrompt,
        });

        let optimizedData;
        try {
            const jsonMatch = result.text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                optimizedData = JSON.parse(jsonMatch[0]);
            } else {
                throw new Error('No JSON found');
            }
        } catch {
            return NextResponse.json(
                { error: "Failed to parse optimization response" },
                { status: 500 }
            );
        }

        // Create a new optimized version if we have a post version
        let newVersionId = null;
        if (postVersion) {
            const newVersion = await prisma.postVersion.create({
                data: {
                    postId: postVersion.postId,
                    style: postVersion.style,
                    platform: postVersion.platform,
                    content: optimizedData.optimizedContent,
                    version: postVersion.version + 1,
                    isOptimized: true,
                    suggestions: [],
                },
            });
            newVersionId = newVersion.id;
        }

        return NextResponse.json({
            success: true,
            optimizedContent: optimizedData.optimizedContent,
            changes: optimizedData.changes,
            platformVersions: optimizedData.platformVersions,
            hashtags: optimizedData.hashtags,
            estimatedScoreImprovement: optimizedData.estimatedScoreImprovement,
            newVersionId,
            originalVersionId: postVersion?.id,
        });
    } catch (error) {
        console.error("Error optimizing content:", error);
        return NextResponse.json(
            {
                error: "Failed to optimize content",
                details: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        );
    }
}
