import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import * as cheerio from 'cheerio';

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

export { urlScrapeTool };
