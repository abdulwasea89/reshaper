import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import * as cheerio from 'cheerio';
import { YoutubeTranscript } from 'youtube-transcript';
import { prisma } from "@/lib/db";

// YouTube URL patterns
const YOUTUBE_REGEX = /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/;

function extractVideoId(url: string): string | null {
    const match = url.match(YOUTUBE_REGEX);
    return match ? match[1] : null;
}

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
        const { type, content } = body;

        if (!type || !content) {
            return NextResponse.json(
                { error: "Type and content are required" },
                { status: 400 }
            );
        }

        let extractedContent: {
            rawContent: string;
            title?: string;
            metadata?: Record<string, unknown>;
        };

        // Extract content based on type
        switch (type) {
            case "url": {
                const response = await fetch(content, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
                    },
                });

                if (!response.ok) {
                    throw new Error(`Failed to fetch URL: ${response.status}`);
                }

                const html = await response.text();
                const $ = cheerio.load(html);

                // Remove unwanted elements
                $('script, style, nav, header, footer, aside').remove();

                const title = $('title').text().trim() ||
                    $('h1').first().text().trim() ||
                    'Untitled';

                const mainContent = $('article, main, .content, .post-content').first().text().trim() ||
                    $('body').text().trim();

                extractedContent = {
                    rawContent: mainContent.replace(/\s+/g, ' ').trim().slice(0, 10000),
                    title,
                    metadata: {
                        sourceType: 'url',
                        originalUrl: content,
                        wordCount: mainContent.split(/\s+/).length,
                    },
                };
                break;
            }

            case "youtube": {
                const videoId = extractVideoId(content);
                if (!videoId) {
                    throw new Error('Invalid YouTube URL');
                }

                // Fetch video metadata
                const metadataResponse = await fetch(
                    `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
                );

                let title = 'Unknown Video';
                if (metadataResponse.ok) {
                    const metadata = await metadataResponse.json();
                    title = metadata.title || 'Unknown Video';
                }

                // Fetch transcript
                const transcriptData = await YoutubeTranscript.fetchTranscript(videoId);
                const transcript = transcriptData
                    .map(segment => segment.text)
                    .join(' ')
                    .replace(/\s+/g, ' ')
                    .trim();

                extractedContent = {
                    rawContent: transcript.slice(0, 10000),
                    title,
                    metadata: {
                        sourceType: 'youtube',
                        videoId,
                        originalUrl: content,
                        wordCount: transcript.split(/\s+/).length,
                    },
                };
                break;
            }

            case "pdf": {
                // Assume content is base64 encoded PDF
                const pdfParse = (await import('pdf-parse')).default;
                const pdfBuffer = Buffer.from(content, 'base64');
                const data = await pdfParse(pdfBuffer) as {
                    text: string;
                    numpages?: number;
                    info?: { Title?: string; Author?: string };
                };

                extractedContent = {
                    rawContent: data.text.replace(/\s+/g, ' ').trim().slice(0, 50000),
                    title: data.info?.Title || 'PDF Document',
                    metadata: {
                        sourceType: 'pdf',
                        pages: data.numpages,
                        author: data.info?.Author,
                        wordCount: data.text.split(/\s+/).length,
                    },
                };
                break;
            }

            case "text": {
                extractedContent = {
                    rawContent: content.slice(0, 50000),
                    metadata: {
                        sourceType: 'text',
                        wordCount: content.split(/\s+/).length,
                    },
                };
                break;
            }

            default:
                return NextResponse.json(
                    { error: "Invalid content type. Use: url, youtube, pdf, or text" },
                    { status: 400 }
                );
        }

        // Use Gemini to generate summary and key insights
        const model = google("gemini-2.5-pro");

        const analysisPrompt = `Analyze this content and provide a JSON response with:
1. A concise summary (2-3 sentences)
2. 3-5 key insights as an array
3. The main topic/theme
4. Target audience

Content:
${extractedContent.rawContent.slice(0, 4000)}

Respond ONLY with valid JSON in this format:
{
  "summary": "...",
  "keyInsights": ["insight1", "insight2", "insight3"],
  "mainTopic": "...",
  "targetAudience": "..."
}`;

        const analysisResult = await generateText({
            model,
            prompt: analysisPrompt,
        });

        let analysis;
        try {
            // Try to parse JSON from the response
            const jsonMatch = analysisResult.text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                analysis = JSON.parse(jsonMatch[0]);
            } else {
                throw new Error('No JSON found');
            }
        } catch {
            analysis = {
                summary: extractedContent.rawContent.slice(0, 300) + '...',
                keyInsights: [],
                mainTopic: 'General',
                targetAudience: 'General audience',
            };
        }

        // Save to database
        const contentSource = await prisma.contentSource.create({
            data: {
                type,
                originalUrl: type === 'url' || type === 'youtube' ? content : null,
                rawContent: extractedContent.rawContent,
                summary: analysis.summary,
                keyInsights: analysis.keyInsights,
                metadata: extractedContent.metadata as Record<string, unknown> as import('@prisma/client').Prisma.InputJsonValue,
                userId: session.user.id,
            },
        });

        return NextResponse.json({
            success: true,
            contentSourceId: contentSource.id,
            title: extractedContent.title,
            summary: analysis.summary,
            keyInsights: analysis.keyInsights,
            mainTopic: analysis.mainTopic,
            targetAudience: analysis.targetAudience,
            wordCount: extractedContent.metadata?.wordCount,
            type,
        });
    } catch (error) {
        console.error("Error extracting content:", error);
        return NextResponse.json(
            {
                error: "Failed to extract content",
                details: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        );
    }
}
