import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { google } from "@ai-sdk/google";
import { generateText, streamText } from "ai";
import { prisma } from "@/lib/db";

// Post styles to generate
const POST_STYLES = ['viral', 'professional', 'punchy', 'story', 'thread'] as const;

export async function POST(request: NextRequest) {
    try {
        // Get authenticated user
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { contentSourceId, platforms = ['x', 'linkedin'] } = body;

        if (!contentSourceId) {
            return NextResponse.json(
                { error: "contentSourceId is required" },
                { status: 400 }
            );
        }

        // Get content source
        const contentSource = await prisma.contentSource.findUnique({
            where: { id: contentSourceId },
        });

        if (!contentSource) {
            return NextResponse.json(
                { error: "Content source not found" },
                { status: 404 }
            );
        }

        if (contentSource.userId !== session.user.id) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 403 }
            );
        }

        const model = google("gemini-2.5-pro");

        // Generate posts for each style
        const generatedPosts = await Promise.all(
            POST_STYLES.map(async (style) => {
                const prompt = getStylePrompt(style, contentSource.rawContent, contentSource.summary || '', contentSource.keyInsights);

                const result = await generateText({
                    model,
                    prompt,
                });

                // Try to parse JSON from response
                let postContent;
                try {
                    const jsonMatch = result.text.match(/\{[\s\S]*\}/);
                    if (jsonMatch) {
                        postContent = JSON.parse(jsonMatch[0]);
                    } else {
                        throw new Error('No JSON found');
                    }
                } catch {
                    postContent = {
                        content: result.text,
                        hashtags: [],
                        platform: 'both',
                    };
                }

                return {
                    style,
                    ...postContent,
                };
            })
        );

        // Create a post in database
        const post = await prisma.post.create({
            data: {
                title: contentSource.summary?.slice(0, 100) || 'Generated Post',
                content: generatedPosts[0]?.content || '',
                originalLink: contentSource.originalUrl,
                sourceId: contentSourceId,
                platforms,
                userId: session.user.id,
                linkedinPost: generatedPosts.find(p => p.style === 'professional')?.content,
                twitterPost: generatedPosts.find(p => p.style === 'punchy')?.content,
            },
        });

        // Create post versions
        const postVersions = await Promise.all(
            generatedPosts.map(async (genPost) => {
                const targetPlatform = genPost.platform === 'both' ? 'x' : genPost.platform;

                return prisma.postVersion.create({
                    data: {
                        postId: post.id,
                        style: genPost.style,
                        platform: targetPlatform,
                        content: genPost.content,
                        suggestions: [],
                    },
                });
            })
        );

        return NextResponse.json({
            success: true,
            postId: post.id,
            posts: generatedPosts.map((p, i) => ({
                ...p,
                versionId: postVersions[i].id,
            })),
        });
    } catch (error) {
        console.error("Error generating posts:", error);
        return NextResponse.json(
            {
                error: "Failed to generate posts",
                details: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        );
    }
}

function getStylePrompt(
    style: typeof POST_STYLES[number],
    rawContent: string,
    summary: string,
    keyInsights: string[]
): string {
    const baseContext = `
CONTENT SUMMARY: ${summary}

KEY INSIGHTS:
${keyInsights.map((i, idx) => `${idx + 1}. ${i}`).join('\n')}

FULL CONTENT (use as reference):
${rawContent.slice(0, 3000)}
`;

    const styleInstructions: Record<typeof POST_STYLES[number], string> = {
        viral: `Create a VIRAL social media post that will get maximum engagement.
- Start with a pattern-interrupting hook (surprising stat, bold claim, or intriguing question)
- Use power words and emotional triggers
- Include a clear value proposition
- End with a strong call-to-action
- Keep it shareable and discussion-worthy`,

        professional: `Create a PROFESSIONAL post suitable for LinkedIn.
- Thoughtful, insightful tone
- Evidence-based claims when possible
- Industry-relevant language
- Establishes authority and expertise
- Add reflective questions or takeaways
- Include appropriate line breaks for readability`,

        punchy: `Create a SHORT, PUNCHY post (under 100 words).
- One main message, crystal clear
- No fluff, every word counts
- Perfect for busy scrollers
- Immediate impact
- Consider using a bold statement or question`,

        story: `Create a STORYTELLING post with a personal narrative.
- Beginning → Challenge → Resolution structure
- Use "I" statements and personal experience
- Relatable emotions and experiences
- End with a lesson or takeaway
- Create connection with the audience`,

        thread: `Create a THREAD of 5-7 connected tweets for X/Twitter.
- First tweet: Strong hook that makes people want to read more
- Each tweet builds on the previous
- Include specific insights or steps
- Last tweet: Summary and call-to-action
- Format as numbered list (1/5, 2/5, etc.)`,
    };

    return `${baseContext}

TASK: ${styleInstructions[style]}

Respond with ONLY a JSON object in this exact format:
{
  "content": "Your post content here",
  "hashtags": ["hashtag1", "hashtag2"],
  "platform": "x|linkedin|both"
}

For thread style, the "content" should include all tweets separated by "---".`;
}

// Streaming version for real-time generation
export async function PUT(request: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { contentSourceId, style = 'viral' } = body;

        if (!contentSourceId) {
            return NextResponse.json(
                { error: "contentSourceId is required" },
                { status: 400 }
            );
        }

        const contentSource = await prisma.contentSource.findUnique({
            where: { id: contentSourceId },
        });

        if (!contentSource || contentSource.userId !== session.user.id) {
            return NextResponse.json(
                { error: "Content source not found or unauthorized" },
                { status: 404 }
            );
        }

        const model = google("gemini-2.5-pro");
        const prompt = getStylePrompt(
            style as typeof POST_STYLES[number],
            contentSource.rawContent,
            contentSource.summary || '',
            contentSource.keyInsights
        );

        const result = streamText({
            model,
            prompt,
        });

        return result.toTextStreamResponse();
    } catch (error) {
        console.error("Error in streaming generation:", error);
        return NextResponse.json(
            {
                error: "Failed to stream generation",
                details: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        );
    }
}
