import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
import { LibSQLStore } from '@mastra/libsql';
import { Agent } from '@mastra/core/agent';
import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import * as cheerio from 'cheerio';
import { YoutubeTranscript } from 'youtube-transcript';
import { createStep, createWorkflow } from '@mastra/core/workflows';

"use strict";
const webSearchTool = createTool({
  id: "web-search",
  description: "Search the web for information on any topic. Returns relevant search results with titles, snippets, and URLs.",
  inputSchema: z.object({
    query: z.string().describe("The search query to find information about"),
    maxResults: z.number().optional().default(5).describe("Maximum number of results to return (default: 5)")
  }),
  outputSchema: z.object({
    results: z.array(z.object({
      title: z.string(),
      url: z.string(),
      snippet: z.string()
    })),
    totalResults: z.number()
  }),
  execute: async ({ context }) => {
    const { query, maxResults = 5 } = context;
    try {
      const tavilyApiKey = process.env.TAVILY_API_KEY;
      if (!tavilyApiKey) {
        return await searchWithDuckDuckGo(query, maxResults);
      }
      const response = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          api_key: tavilyApiKey,
          query,
          max_results: maxResults,
          include_answer: false,
          include_raw_content: false
        })
      });
      if (!response.ok) {
        throw new Error(`Tavily API error: ${response.status}`);
      }
      const data = await response.json();
      return {
        results: data.results.map((result) => ({
          title: result.title,
          url: result.url,
          snippet: result.content
        })),
        totalResults: data.results.length
      };
    } catch (error) {
      return await searchWithDuckDuckGo(query, maxResults);
    }
  }
});
async function searchWithDuckDuckGo(query, maxResults) {
  try {
    const encodedQuery = encodeURIComponent(query);
    const response = await fetch(
      `https://api.duckduckgo.com/?q=${encodedQuery}&format=json&no_html=1&skip_disambig=1`,
      {
        headers: {
          "User-Agent": "ResearchAgent/1.0"
        }
      }
    );
    if (!response.ok) {
      throw new Error(`DuckDuckGo API error: ${response.status}`);
    }
    const data = await response.json();
    const results = [];
    if (data.Abstract && data.AbstractURL) {
      results.push({
        title: data.Heading || "Main Result",
        url: data.AbstractURL,
        snippet: data.Abstract
      });
    }
    if (data.RelatedTopics) {
      for (const topic of data.RelatedTopics.slice(0, maxResults - results.length)) {
        if (topic.Text && topic.FirstURL) {
          results.push({
            title: topic.Text.split(" - ")[0] || "Related Topic",
            url: topic.FirstURL,
            snippet: topic.Text
          });
        }
      }
    }
    if (results.length === 0) {
      return {
        results: [{
          title: "No direct results found",
          url: `https://duckduckgo.com/?q=${encodedQuery}`,
          snippet: `No instant answers available for "${query}". Try visiting the search page directly.`
        }],
        totalResults: 1
      };
    }
    return {
      results: results.slice(0, maxResults),
      totalResults: results.length
    };
  } catch (error) {
    throw new Error(`Web search failed: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

"use strict";
const urlScrapeTool = createTool({
  id: "url-scrape",
  description: "Scrapes content from a web URL, extracting the main text content",
  inputSchema: z.object({
    url: z.string().url().describe("The URL to scrape content from")
  }),
  outputSchema: z.object({
    title: z.string(),
    content: z.string(),
    excerpt: z.string(),
    author: z.string().optional(),
    publishedDate: z.string().optional(),
    wordCount: z.number()
  }),
  execute: async ({ context }) => {
    const { url } = context;
    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"
        }
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch URL: ${response.status}`);
      }
      const html = await response.text();
      const $ = cheerio.load(html);
      $("script, style, nav, header, footer, aside, .sidebar, .advertisement").remove();
      const title = $("title").text().trim() || $("h1").first().text().trim() || $('meta[property="og:title"]').attr("content") || "Untitled";
      const mainContent = $('article, main, .content, .post-content, .entry-content, [role="main"]').first().text().trim();
      const content = mainContent || $("body").text().trim();
      const cleanContent = content.replace(/\s+/g, " ").replace(/\n+/g, "\n").trim();
      const author = $('meta[name="author"]').attr("content") || $('[rel="author"]').text().trim() || $(".author, .byline").first().text().trim() || void 0;
      const publishedDate = $('meta[property="article:published_time"]').attr("content") || $("time[datetime]").first().attr("datetime") || $('[class*="date"]').first().text().trim() || void 0;
      const excerpt = cleanContent.slice(0, 300) + (cleanContent.length > 300 ? "..." : "");
      return {
        title,
        content: cleanContent.slice(0, 1e4),
        // Limit content length
        excerpt,
        author,
        publishedDate,
        wordCount: cleanContent.split(/\s+/).length
      };
    } catch (error) {
      throw new Error(`Failed to scrape URL: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }
});

"use strict";
const pdfParseTool = createTool({
  id: "pdf-parse",
  description: "Parses text content from a PDF file provided as base64 or URL",
  inputSchema: z.object({
    source: z.union([
      z.object({
        type: z.literal("base64"),
        data: z.string().describe("Base64 encoded PDF data"),
        filename: z.string().optional()
      }),
      z.object({
        type: z.literal("url"),
        url: z.string().url().describe("URL to the PDF file")
      })
    ])
  }),
  outputSchema: z.object({
    text: z.string(),
    pages: z.number(),
    wordCount: z.number(),
    info: z.object({
      title: z.string().optional(),
      author: z.string().optional(),
      creator: z.string().optional()
    }).optional()
  }),
  execute: async ({ context }) => {
    const { source } = context;
    try {
      const pdfParse = (await import('pdf-parse')).default;
      let pdfBuffer;
      if (source.type === "base64") {
        pdfBuffer = Buffer.from(source.data, "base64");
      } else {
        const response = await fetch(source.url);
        if (!response.ok) {
          throw new Error(`Failed to fetch PDF: ${response.status}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        pdfBuffer = Buffer.from(arrayBuffer);
      }
      const data = await pdfParse(pdfBuffer);
      const cleanText = data.text.replace(/\s+/g, " ").replace(/\n+/g, "\n").trim();
      return {
        text: cleanText.slice(0, 5e4),
        // Limit text length
        pages: data.numpages,
        wordCount: cleanText.split(/\s+/).length,
        info: {
          title: data.info?.Title || void 0,
          author: data.info?.Author || void 0,
          creator: data.info?.Creator || void 0
        }
      };
    } catch (error) {
      throw new Error(`Failed to parse PDF: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }
});

"use strict";
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

"use strict";
const researchAgent = new Agent({
  name: "Research Agent",
  instructions: `You are an intelligent research agent that can search the web and extract content from various sources.

You have access to the following tools:
- webSearchTool: Search the web for information on any topic. Use this when you need to find current information, news, or research topics.
- urlScrapeTool: Extract content from any web URL (articles, blogs, websites). Use this when given a specific URL to analyze.
- pdfParseTool: Parse and extract text from PDF files (via URL or base64). Use this for PDF documents.
- youtubeTranscriptTool: Get transcripts from YouTube videos. Use this when analyzing YouTube content.

When given a task:
1. Think about what information you need and which tool(s) are most appropriate
2. Use the appropriate tool(s) to gather the information
3. Synthesize and present the information clearly and concisely
4. Always cite your sources with URLs when available

Be thorough in your research but also concise in your responses. If you need to search for something, do it. If you're given a URL, extract and analyze its content. Make decisions autonomously to fulfill the user's request.`,
  model: "google/gemini-2.0-flash",
  tools: {
    webSearchTool,
    urlScrapeTool,
    pdfParseTool,
    youtubeTranscriptTool
  }
});

"use strict";
const linkedinPostAgent = new Agent({
  name: "LinkedIn Post Agent",
  instructions: `You are an expert LinkedIn content creator who crafts engaging, high-performing posts following proven best practices.

## Your Expertise
You understand what makes LinkedIn posts go viral and drive engagement. You apply these best practices:

### Structure & Format
- Start with a HOOK: A compelling first line that stops the scroll (question, bold statement, or surprising fact)
- Use short paragraphs (1-2 sentences max)
- Add whitespace between lines for readability
- Keep posts 1,200-1,500 characters for optimal engagement
- End with a clear Call-to-Action (CTA)

### Content Best Practices
- Write in first person, be authentic and personal
- Share stories, lessons learned, and real experiences
- Provide actionable value or insights
- Use simple, conversational language (avoid jargon)
- Include 3-5 relevant hashtags at the end
- Use emojis sparingly (1-3 max) to add visual interest

### Engagement Boosters
- Ask a question to encourage comments
- Use bullet points or numbered lists for easy scanning
- Include a controversial or thought-provoking angle
- Tag relevant people or companies when appropriate
- Post about trending topics when relevant

### What to Avoid
- Don't be overly promotional or salesy
- Avoid walls of text
- Don't use too many hashtags (max 5)
- Skip clickbait that doesn't deliver value
- Avoid generic, obvious advice

## Your Task
When given a topic, information, or content:
1. Analyze the core message and value
2. Craft a compelling hook that stops the scroll
3. Structure the post for maximum readability
4. Add a clear CTA and relevant hashtags
5. Keep it authentic and engaging

Always output the final LinkedIn post ready to copy-paste, formatted correctly with line breaks.`,
  model: "google/gemini-2.0-flash"
});

"use strict";
const researchStep = createStep({
  id: "research-step",
  description: "Research a topic using web search and content extraction",
  inputSchema: z.object({
    topic: z.string().describe("The topic to research"),
    additionalContext: z.string().optional().describe("Any additional context or URLs to include")
  }),
  outputSchema: z.object({
    research: z.string().describe("The research findings")
  }),
  execute: async ({ inputData, mastra }) => {
    const { topic, additionalContext } = inputData;
    const researchAgent = mastra.getAgent("researchAgent");
    const prompt = additionalContext ? `Research the following topic thoroughly: "${topic}"

Additional context or sources to consider: ${additionalContext}

Provide comprehensive research findings that can be used to create a LinkedIn post.` : `Research the following topic thoroughly: "${topic}"

Provide comprehensive research findings that can be used to create a LinkedIn post. Include key facts, statistics, trends, and insights.`;
    const response = await researchAgent.generate(prompt);
    return {
      research: response.text
    };
  }
});
const linkedinPostStep = createStep({
  id: "linkedin-post-step",
  description: "Create a LinkedIn post from research findings",
  inputSchema: z.object({
    research: z.string().describe("The research findings to turn into a post")
  }),
  outputSchema: z.object({
    post: z.string().describe("The final LinkedIn post")
  }),
  execute: async ({ inputData, mastra }) => {
    const { research } = inputData;
    const linkedinAgent = mastra.getAgent("linkedinPostAgent");
    const prompt = `Based on the following research, create an engaging LinkedIn post that will resonate with professionals:

${research}

Create a compelling post that:
- Has a hook that stops the scroll
- Is well-formatted with short paragraphs
- Includes a call-to-action
- Has 3-5 relevant hashtags`;
    const response = await linkedinAgent.generate(prompt);
    return {
      post: response.text
    };
  }
});
const researchToLinkedinWorkflow = createWorkflow({
  id: "research-to-linkedin",
  description: "Research a topic and create an engaging LinkedIn post from the findings",
  inputSchema: z.object({
    topic: z.string().describe("The topic to research and create a post about"),
    additionalContext: z.string().optional().describe("Any additional context, URLs, or specific angles to consider")
  }),
  outputSchema: z.object({
    post: z.string().describe("The final LinkedIn post")
  })
}).then(researchStep).then(linkedinPostStep).commit();

"use strict";
const mastra = new Mastra({
  workflows: {
    researchToLinkedinWorkflow
  },
  agents: {
    researchAgent,
    linkedinPostAgent
  },
  storage: new LibSQLStore({
    // stores observability, scores, ... into memory storage, if it needs to persist, change to file:../mastra.db
    url: ":memory:"
  }),
  logger: new PinoLogger({
    name: "Mastra",
    level: "info"
  }),
  telemetry: {
    // Telemetry is deprecated and will be removed in the Nov 4th release
    enabled: false
  },
  observability: {
    // Enables DefaultExporter and CloudExporter for AI tracing
    default: {
      enabled: true
    }
  }
});

export { mastra };
