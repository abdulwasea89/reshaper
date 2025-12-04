import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import { prisma } from "@/lib/db";

// Virality criteria weights
const CRITERIA_WEIGHTS = {
    hook: 0.25,
    clarity: 0.20,
    emotion: 0.20,
    novelty: 0.15,
    compliance: 0.20,
};

export async function POST(request: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { postVersionId, content, platform = 'x' } = body;

        if (!content && !postVersionId) {
            return NextResponse.json(
                { error: "Either content or postVersionId is required" },
                { status: 400 }
            );
        }

        let postContent = content;
        let postVersion = null;

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
        }

        const model = google("gemini-2.5-pro");

        const scoringPrompt = `You are an expert social media content evaluator. Score this post for virality potential on ${platform}.

POST CONTENT:
"${postContent}"

PLATFORM: ${platform === 'x' ? 'X (Twitter)' : 'LinkedIn'}

Score each criterion on a scale of 1-10:

1. HOOK STRENGTH (25% weight)
   - Does it grab attention immediately?
   - Would someone stop scrolling?

2. CLARITY (20% weight)
   - Is the message immediately clear?
   - Simple and direct language?

3. EMOTIONAL IMPACT (20% weight)
   - Does it evoke a strong feeling?
   - Is it relatable or inspiring?

4. NOVELTY (15% weight)
   - Fresh perspective?
   - New information?

5. PLATFORM COMPLIANCE (20% weight)
   - Correct length for platform?
   - Good formatting?
   - Appropriate hashtag usage?

Respond ONLY with valid JSON in this format:
{
  "scores": {
    "hook": 8,
    "clarity": 7,
    "emotion": 8,
    "novelty": 6,
    "compliance": 8
  },
  "reasoning": {
    "hook": "Explanation...",
    "clarity": "Explanation...",
    "emotion": "Explanation...",
    "novelty": "Explanation...",
    "compliance": "Explanation..."
  },
  "strengths": ["strength1", "strength2"],
  "weaknesses": ["weakness1", "weakness2"],
  "suggestions": ["suggestion1", "suggestion2", "suggestion3"]
}`;

        const result = await generateText({
            model,
            prompt: scoringPrompt,
        });

        let scoreData;
        try {
            const jsonMatch = result.text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                scoreData = JSON.parse(jsonMatch[0]);
            } else {
                throw new Error('No JSON found');
            }
        } catch {
            return NextResponse.json(
                { error: "Failed to parse scoring response" },
                { status: 500 }
            );
        }

        // Calculate weighted overall score
        const overallScore = Object.entries(scoreData.scores).reduce(
            (total, [key, value]) => {
                return total + (value as number) * CRITERIA_WEIGHTS[key as keyof typeof CRITERIA_WEIGHTS];
            },
            0
        );

        const roundedScore = Math.round(overallScore * 10) / 10;
        const needsOptimization = roundedScore < 7;

        // Update post version if ID was provided
        if (postVersion) {
            await prisma.postVersion.update({
                where: { id: postVersionId },
                data: {
                    viralityScore: roundedScore,
                    scoreDetails: scoreData.scores,
                    suggestions: scoreData.suggestions,
                },
            });
        }

        return NextResponse.json({
            success: true,
            overallScore: roundedScore,
            scores: scoreData.scores,
            reasoning: scoreData.reasoning,
            strengths: scoreData.strengths,
            weaknesses: scoreData.weaknesses,
            suggestions: scoreData.suggestions,
            needsOptimization,
            postVersionId: postVersion?.id,
        });
    } catch (error) {
        console.error("Error scoring content:", error);
        return NextResponse.json(
            {
                error: "Failed to score content",
                details: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        );
    }
}
