import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { YoutubeTranscript } from 'youtube-transcript';

const YOUTUBE_REGEX = /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/;
function extractVideoId(url) {
  const match = url.match(YOUTUBE_REGEX);
  return match ? match[1] : null;
}
const youtubeTranscriptTool = createTool({
  id: "youtube-transcript",
  description: "Extracts transcript from a YouTube video URL",
  inputSchema: z.object({
    url: z.string().describe("YouTube video URL")
  }),
  outputSchema: z.object({
    videoId: z.string(),
    title: z.string(),
    transcript: z.string(),
    duration: z.number().describe("Duration in seconds"),
    wordCount: z.number(),
    segments: z.array(z.object({
      text: z.string(),
      offset: z.number(),
      duration: z.number()
    }))
  }),
  execute: async ({ context }) => {
    const { url } = context;
    const videoId = extractVideoId(url);
    if (!videoId) {
      throw new Error("Invalid YouTube URL: Could not extract video ID");
    }
    try {
      const metadataResponse = await fetch(
        `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
      );
      let title = "Unknown Title";
      if (metadataResponse.ok) {
        const metadata = await metadataResponse.json();
        title = metadata.title || "Unknown Title";
      }
      const transcriptData = await YoutubeTranscript.fetchTranscript(videoId);
      if (!transcriptData || transcriptData.length === 0) {
        throw new Error("No transcript available for this video");
      }
      const segments = transcriptData.map((segment) => ({
        text: segment.text,
        offset: segment.offset,
        duration: segment.duration
      }));
      const fullTranscript = transcriptData.map((segment) => segment.text).join(" ").replace(/\s+/g, " ").trim();
      const duration = transcriptData.length > 0 ? transcriptData[transcriptData.length - 1].offset + transcriptData[transcriptData.length - 1].duration : 0;
      return {
        videoId,
        title,
        transcript: fullTranscript,
        duration: Math.round(duration),
        wordCount: fullTranscript.split(/\s+/).length,
        segments
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to fetch YouTube transcript: ${error.message}`);
      }
      throw new Error("Failed to fetch YouTube transcript: Unknown error");
    }
  }
});

export { youtubeTranscriptTool };
