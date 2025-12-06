import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

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

export { webSearchTool };
