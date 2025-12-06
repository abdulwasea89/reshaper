import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
import { LibSQLStore } from '@mastra/libsql';
import { createStep, createWorkflow } from '@mastra/core/workflows';
import { z } from 'zod';
import { Agent } from '@mastra/core/agent';
import { Memory } from '@mastra/memory';
import { createTool } from '@mastra/core/tools';
import * as cheerio from 'cheerio';
import { YoutubeTranscript } from 'youtube-transcript';

"use strict";
const forecastSchema = z.object({
  date: z.string(),
  maxTemp: z.number(),
  minTemp: z.number(),
  precipitationChance: z.number(),
  condition: z.string(),
  location: z.string()
});
function getWeatherCondition$1(code) {
  const conditions = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Foggy",
    48: "Depositing rime fog",
    51: "Light drizzle",
    53: "Moderate drizzle",
    55: "Dense drizzle",
    61: "Slight rain",
    63: "Moderate rain",
    65: "Heavy rain",
    71: "Slight snow fall",
    73: "Moderate snow fall",
    75: "Heavy snow fall",
    95: "Thunderstorm"
  };
  return conditions[code] || "Unknown";
}
const fetchWeather = createStep({
  id: "fetch-weather",
  description: "Fetches weather forecast for a given city",
  inputSchema: z.object({
    city: z.string().describe("The city to get the weather for")
  }),
  outputSchema: forecastSchema,
  execute: async ({ inputData }) => {
    if (!inputData) {
      throw new Error("Input data not found");
    }
    const geocodingUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(inputData.city)}&count=1`;
    const geocodingResponse = await fetch(geocodingUrl);
    const geocodingData = await geocodingResponse.json();
    if (!geocodingData.results?.[0]) {
      throw new Error(`Location '${inputData.city}' not found`);
    }
    const { latitude, longitude, name } = geocodingData.results[0];
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=precipitation,weathercode&timezone=auto,&hourly=precipitation_probability,temperature_2m`;
    const response = await fetch(weatherUrl);
    const data = await response.json();
    const forecast = {
      date: (/* @__PURE__ */ new Date()).toISOString(),
      maxTemp: Math.max(...data.hourly.temperature_2m),
      minTemp: Math.min(...data.hourly.temperature_2m),
      condition: getWeatherCondition$1(data.current.weathercode),
      precipitationChance: data.hourly.precipitation_probability.reduce(
        (acc, curr) => Math.max(acc, curr),
        0
      ),
      location: name
    };
    return forecast;
  }
});
const planActivities = createStep({
  id: "plan-activities",
  description: "Suggests activities based on weather conditions",
  inputSchema: forecastSchema,
  outputSchema: z.object({
    activities: z.string()
  }),
  execute: async ({ inputData, mastra }) => {
    const forecast = inputData;
    if (!forecast) {
      throw new Error("Forecast data not found");
    }
    const agent = mastra?.getAgent("weatherAgent");
    if (!agent) {
      throw new Error("Weather agent not found");
    }
    const prompt = `Based on the following weather forecast for ${forecast.location}, suggest appropriate activities:
      ${JSON.stringify(forecast, null, 2)}
      For each day in the forecast, structure your response exactly as follows:

      \u{1F4C5} [Day, Month Date, Year]
      \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550

      \u{1F321}\uFE0F WEATHER SUMMARY
      \u2022 Conditions: [brief description]
      \u2022 Temperature: [X\xB0C/Y\xB0F to A\xB0C/B\xB0F]
      \u2022 Precipitation: [X% chance]

      \u{1F305} MORNING ACTIVITIES
      Outdoor:
      \u2022 [Activity Name] - [Brief description including specific location/route]
        Best timing: [specific time range]
        Note: [relevant weather consideration]

      \u{1F31E} AFTERNOON ACTIVITIES
      Outdoor:
      \u2022 [Activity Name] - [Brief description including specific location/route]
        Best timing: [specific time range]
        Note: [relevant weather consideration]

      \u{1F3E0} INDOOR ALTERNATIVES
      \u2022 [Activity Name] - [Brief description including specific venue]
        Ideal for: [weather condition that would trigger this alternative]

      \u26A0\uFE0F SPECIAL CONSIDERATIONS
      \u2022 [Any relevant weather warnings, UV index, wind conditions, etc.]

      Guidelines:
      - Suggest 2-3 time-specific outdoor activities per day
      - Include 1-2 indoor backup options
      - For precipitation >50%, lead with indoor activities
      - All activities must be specific to the location
      - Include specific venues, trails, or locations
      - Consider activity intensity based on temperature
      - Keep descriptions concise but informative

      Maintain this exact formatting for consistency, using the emoji and section headers as shown.`;
    const response = await agent.stream([
      {
        role: "user",
        content: prompt
      }
    ]);
    let activitiesText = "";
    for await (const chunk of response.textStream) {
      process.stdout.write(chunk);
      activitiesText += chunk;
    }
    return {
      activities: activitiesText
    };
  }
});
const weatherWorkflow = createWorkflow({
  id: "weather-workflow",
  inputSchema: z.object({
    city: z.string().describe("The city to get the weather for")
  }),
  outputSchema: z.object({
    activities: z.string()
  })
}).then(fetchWeather).then(planActivities);
weatherWorkflow.commit();

"use strict";
const contentInputSchema = z.object({
  source: z.object({
    type: z.enum(["url", "youtube", "pdf", "text"]),
    content: z.string()
    // URL, video URL, base64 PDF, or raw text
  }),
  platforms: z.array(z.enum(["x", "linkedin"])).default(["x", "linkedin"]),
  userId: z.string()
});
const extractedContentSchema = z.object({
  rawContent: z.string(),
  summary: z.string(),
  keyInsights: z.array(z.string()),
  metadata: z.object({
    sourceType: z.string(),
    title: z.string().optional(),
    wordCount: z.number()
  })
});
const trendAnalysisSchema = z.object({
  patterns: z.array(z.string()),
  recommendations: z.array(z.string()),
  contentMatch: z.number()
});
const generatedPostsSchema = z.object({
  posts: z.array(z.object({
    style: z.enum(["viral", "professional", "punchy", "story", "thread"]),
    content: z.string(),
    platform: z.enum(["x", "linkedin", "both"]),
    hashtags: z.array(z.string())
  }))
});
const scoredPostsSchema = z.object({
  posts: z.array(z.object({
    style: z.string(),
    content: z.string(),
    platform: z.string(),
    viralityScore: z.number(),
    scores: z.object({
      hook: z.number(),
      clarity: z.number(),
      emotion: z.number(),
      novelty: z.number(),
      compliance: z.number()
    }),
    suggestions: z.array(z.string()),
    needsOptimization: z.boolean()
  }))
});
const formattedPostsSchema = z.object({
  posts: z.array(z.object({
    style: z.string(),
    viralityScore: z.number(),
    x: z.object({
      content: z.string(),
      isThread: z.boolean(),
      thread: z.array(z.string()).optional(),
      hashtags: z.array(z.string()),
      characterCount: z.number()
    }).optional(),
    linkedin: z.object({
      content: z.string(),
      hashtags: z.array(z.string()),
      characterCount: z.number()
    }).optional()
  }))
});
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const extractContentStep = createStep({
  id: "extract-content",
  inputSchema: contentInputSchema,
  outputSchema: extractedContentSchema,
  execute: async ({ inputData, mastra }) => {
    const scraperAgent = mastra.getAgent("scraperAgent");
    const { source } = inputData;
    let prompt = "";
    if (source.type === "url") {
      prompt = `Extract content from this URL: ${source.content}. Use the urlScrapeTool to scrape the page.`;
    } else if (source.type === "youtube") {
      prompt = `Extract the transcript from this YouTube video: ${source.content}. Use the youtubeTranscriptTool.`;
    } else if (source.type === "pdf") {
      prompt = `Parse this PDF content (base64 encoded): ${source.content.slice(0, 100)}... Use the pdfParseTool.`;
    } else {
      prompt = `Analyze and summarize this text content:

${source.content}`;
    }
    const response = await scraperAgent.generate(prompt);
    return {
      rawContent: source.type === "text" ? source.content : response.text,
      summary: "Content extracted successfully",
      // Will be enhanced by agent
      keyInsights: [],
      metadata: {
        sourceType: source.type,
        title: void 0,
        wordCount: source.content.split(/\s+/).length
      }
    };
  }
});
const analyzeTrendsStep = createStep({
  id: "analyze-trends",
  inputSchema: extractedContentSchema,
  outputSchema: trendAnalysisSchema,
  execute: async ({ inputData, mastra }) => {
    await delay(35e3);
    const analyzerAgent = mastra.getAgent("analyzerAgent");
    const prompt = `Analyze trending content on both X and LinkedIn. 
    
Content to compare against:
${inputData.summary}

Key insights from the content:
${inputData.keyInsights.join("\n")}

Use the trendAnalysisTool to fetch trending posts, then provide:
1. Common patterns in trending posts
2. How well this content matches current trends
3. Specific recommendations for improvement`;
    const response = await analyzerAgent.generate(prompt);
    return {
      patterns: [],
      recommendations: [],
      contentMatch: 7
    };
  }
});
const generatePostsStep = createStep({
  id: "generate-posts",
  inputSchema: z.object({
    content: extractedContentSchema,
    trends: trendAnalysisSchema
  }),
  outputSchema: generatedPostsSchema,
  execute: async ({ inputData, mastra }) => {
    await delay(35e3);
    const generatorAgent = mastra.getAgent("generatorAgent");
    const prompt = `Based on this content and trend analysis, generate 5 post versions:

CONTENT:
${inputData.content.rawContent.slice(0, 3e3)}

SUMMARY:
${inputData.content.summary}

KEY INSIGHTS:
${inputData.content.keyInsights.join("\n")}

TREND PATTERNS TO INCORPORATE:
${inputData.trends.patterns.join("\n")}

RECOMMENDATIONS:
${inputData.trends.recommendations.join("\n")}

Generate these 5 versions:
1. Viral version - maximum engagement hooks
2. Professional version - LinkedIn-style thought leadership
3. Punchy version - short, impactful, under 100 words
4. Storytelling version - personal narrative arc
5. Thread version - multi-tweet breakdown for X

Return as JSON array with: style, content, platform, hashtags`;
    const response = await generatorAgent.generate(prompt);
    return {
      posts: [
        { style: "viral", content: "Generated viral post", platform: "both", hashtags: [] },
        { style: "professional", content: "Generated professional post", platform: "linkedin", hashtags: [] },
        { style: "punchy", content: "Generated punchy post", platform: "x", hashtags: [] },
        { style: "story", content: "Generated story post", platform: "both", hashtags: [] },
        { style: "thread", content: "Generated thread post", platform: "x", hashtags: [] }
      ]
    };
  }
});
const scorePostsStep = createStep({
  id: "score-posts",
  inputSchema: generatedPostsSchema,
  outputSchema: scoredPostsSchema,
  execute: async ({ inputData, mastra }) => {
    await delay(35e3);
    const scorerAgent = mastra.getAgent("scorerAgent");
    const scoredPosts = await Promise.all(
      inputData.posts.map(async (post) => {
        const prompt = `Score this ${post.style} post for virality on ${post.platform}:

"${post.content}"

Score on these criteria (1-10):
- Hook strength
- Clarity
- Emotional impact
- Novelty
- Platform compliance

Use the viralityScorerTool to calculate the final score.
Return detailed scores, reasoning, and suggestions.`;
        await scorerAgent.generate(prompt);
        return {
          style: post.style,
          content: post.content,
          platform: post.platform,
          viralityScore: 7.5,
          scores: { hook: 8, clarity: 7, emotion: 8, novelty: 6, compliance: 8 },
          suggestions: [],
          needsOptimization: false
        };
      })
    );
    return { posts: scoredPosts };
  }
});
const optimizePostsStep = createStep({
  id: "optimize-posts",
  inputSchema: scoredPostsSchema,
  outputSchema: scoredPostsSchema,
  execute: async ({ inputData, mastra }) => {
    await delay(35e3);
    const optimizerAgent = mastra.getAgent("optimizerAgent");
    const optimizedPosts = await Promise.all(
      inputData.posts.map(async (post) => {
        if (!post.needsOptimization) {
          return post;
        }
        const prompt = `Optimize this ${post.style} post that scored ${post.viralityScore}:

"${post.content}"

Current scores:
- Hook: ${post.scores.hook}
- Clarity: ${post.scores.clarity}
- Emotion: ${post.scores.emotion}
- Novelty: ${post.scores.novelty}
- Compliance: ${post.scores.compliance}

Suggestions to address:
${post.suggestions.join("\n")}

Rewrite the post to improve weak areas while maintaining the core message.
Target score: 7.5 or higher.`;
        const response = await optimizerAgent.generate(prompt);
        return {
          ...post,
          content: response.text,
          viralityScore: Math.min(post.viralityScore + 1.5, 10),
          needsOptimization: false
        };
      })
    );
    return { posts: optimizedPosts };
  }
});
const formatPostsStep = createStep({
  id: "format-posts",
  inputSchema: scoredPostsSchema,
  outputSchema: formattedPostsSchema,
  execute: async ({ inputData, mastra }) => {
    await delay(35e3);
    const formatterAgent = mastra.getAgent("formatterAgent");
    const formattedPosts = await Promise.all(
      inputData.posts.map(async (post) => {
        const prompt = `Format this ${post.style} post for ${post.platform}:

"${post.content}"

Apply platform-specific formatting:
- X: 280 char limit, thread if needed, 1-2 hashtags
- LinkedIn: Proper spacing, 3-5 hashtags, line breaks

Return formatted versions for each applicable platform.`;
        await formatterAgent.generate(prompt);
        const isThread = post.style === "thread" || post.content.length > 280;
        return {
          style: post.style,
          viralityScore: post.viralityScore,
          x: post.platform === "linkedin" ? void 0 : {
            content: post.content.slice(0, 280),
            isThread,
            thread: isThread ? [post.content] : void 0,
            hashtags: [],
            characterCount: Math.min(post.content.length, 280)
          },
          linkedin: post.platform === "x" ? void 0 : {
            content: post.content,
            hashtags: [],
            characterCount: post.content.length
          }
        };
      })
    );
    return { posts: formattedPosts };
  }
});
const contentPipelineWorkflow = createWorkflow({
  id: "content-pipeline",
  description: `Multi-agent workflow that processes content through:
    1. Scraper Agent - extracts content from URL/YouTube/PDF/text
    2. Analyzer Agent - finds trending posts and patterns
    3. Generator Agent - creates 5 style variants
    4. Scorer Agent - evaluates virality potential
    5. Optimizer Agent - improves low-scoring posts
    6. Formatter Agent - platform-specific formatting`,
  inputSchema: contentInputSchema,
  outputSchema: formattedPostsSchema
}).then(extractContentStep).then(analyzeTrendsStep).map(async ({ inputData, getStepResult }) => {
  const contentResult = getStepResult("extract-content");
  return {
    content: contentResult,
    trends: inputData
  };
}).then(generatePostsStep).then(scorePostsStep).then(optimizePostsStep).then(formatPostsStep).commit();

"use strict";
const weatherTool = createTool({
  id: "get-weather",
  description: "Get current weather for a location",
  inputSchema: z.object({
    location: z.string().describe("City name")
  }),
  outputSchema: z.object({
    temperature: z.number(),
    feelsLike: z.number(),
    humidity: z.number(),
    windSpeed: z.number(),
    windGust: z.number(),
    conditions: z.string(),
    location: z.string()
  }),
  execute: async ({ context }) => {
    return await getWeather(context.location);
  }
});
const getWeather = async (location) => {
  const geocodingUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1`;
  const geocodingResponse = await fetch(geocodingUrl);
  const geocodingData = await geocodingResponse.json();
  if (!geocodingData.results?.[0]) {
    throw new Error(`Location '${location}' not found`);
  }
  const { latitude, longitude, name } = geocodingData.results[0];
  const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,wind_gusts_10m,weather_code`;
  const response = await fetch(weatherUrl);
  const data = await response.json();
  return {
    temperature: data.current.temperature_2m,
    feelsLike: data.current.apparent_temperature,
    humidity: data.current.relative_humidity_2m,
    windSpeed: data.current.wind_speed_10m,
    windGust: data.current.wind_gusts_10m,
    conditions: getWeatherCondition(data.current.weather_code),
    location: name
  };
};
function getWeatherCondition(code) {
  const conditions = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Foggy",
    48: "Depositing rime fog",
    51: "Light drizzle",
    53: "Moderate drizzle",
    55: "Dense drizzle",
    56: "Light freezing drizzle",
    57: "Dense freezing drizzle",
    61: "Slight rain",
    63: "Moderate rain",
    65: "Heavy rain",
    66: "Light freezing rain",
    67: "Heavy freezing rain",
    71: "Slight snow fall",
    73: "Moderate snow fall",
    75: "Heavy snow fall",
    77: "Snow grains",
    80: "Slight rain showers",
    81: "Moderate rain showers",
    82: "Violent rain showers",
    85: "Slight snow showers",
    86: "Heavy snow showers",
    95: "Thunderstorm",
    96: "Thunderstorm with slight hail",
    99: "Thunderstorm with heavy hail"
  };
  return conditions[code] || "Unknown";
}

"use strict";
const weatherAgent = new Agent({
  name: "Weather Agent",
  instructions: `
      You are a helpful weather assistant that provides accurate weather information and can help planning activities based on the weather.

      Your primary function is to help users get weather details for specific locations. When responding:
      - Always ask for a location if none is provided
      - If the location name isn't in English, please translate it
      - If giving a location with multiple parts (e.g. "New York, NY"), use the most relevant part (e.g. "New York")
      - Include relevant details like humidity, wind conditions, and precipitation
      - Keep responses concise but informative
      - If the user asks for activities and provides the weather forecast, suggest activities based on the weather forecast.
      - If the user asks for activities, respond in the format they request.

      Use the weatherTool to fetch current weather data.
`,
  model: "google/gemini-2.5-pro",
  tools: { weatherTool },
  memory: new Memory({
    storage: new LibSQLStore({
      url: "file:../mastra.db"
      // path is relative to the .mastra/output directory
    })
  })
});

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
const scraperAgent = new Agent({
  name: "Scraper Agent",
  description: `Content extraction specialist that scrapes and extracts content from various sources including URLs, YouTube videos, and PDFs. Returns structured content with summaries and key insights.`,
  instructions: `
    You are a content extraction specialist. Your job is to extract and summarize content from various sources.
    
    For each piece of content you process:
    1. Use the appropriate tool based on the source type:
       - urlScrapeTool for web URLs
       - youtubeTranscriptTool for YouTube videos
       - pdfParseTool for PDF documents
    
    2. After extraction, analyze the content and provide:
       - A concise summary (2-3 sentences capturing the main idea)
       - Key insights (3-5 main takeaways as bullet points)
       - Main topic/theme
       - Target audience (who would benefit from this content)
    
    3. Clean up any formatting issues:
       - Remove excessive whitespace
       - Fix broken sentences
       - Identify and note any missing content
    
    4. Return structured output with:
       - rawContent: The extracted text
       - summary: Your concise summary
       - keyInsights: Array of key takeaways
       - metadata: Source type, word count, any relevant metadata
    
    Be thorough but concise. Focus on extracting actionable insights that can be repurposed into social media content.
  `,
  model: "google/gemini-2.5-pro",
  tools: {
    urlScrapeTool,
    youtubeTranscriptTool,
    pdfParseTool
  }
});

"use strict";
const generatorAgent = new Agent({
  name: "Generator Agent",
  description: `Content generator that creates multiple post versions in different styles: viral, professional, punchy, storytelling, and thread format.`,
  instructions: `
    You are an expert social media content creator. Your job is to transform extracted content into multiple engaging post versions.
    
    For each piece of content, create 5 different versions:
    
    1. VIRAL VERSION
       - Start with a pattern-interrupting hook
       - Use power words and emotional triggers
       - Include a surprising stat or bold claim
       - End with engagement bait (question, call to action)
       - Target maximum shareability
    
    2. PROFESSIONAL VERSION
       - Thoughtful, insightful tone
       - Evidence-based claims
       - Industry-relevant language
       - Establishes authority and expertise
       - Appropriate for LinkedIn and professional audiences
    
    3. PUNCHY VERSION
       - Ultra-short, impactful
       - One main message, crystal clear
       - No fluff, every word counts
       - Under 100 words maximum
       - Perfect for busy scrollers
    
    4. STORYTELLING VERSION
       - Personal narrative structure
       - Beginning \u2192 Struggle \u2192 Resolution
       - Relatable emotions and experiences
       - Lesson or takeaway at the end
       - Creates connection with audience
    
    5. THREAD VERSION (for X/Twitter)
       - Opening tweet that hooks
       - Each tweet builds on the last
       - Numbered points or flowing narrative
       - Clear value in each tweet
       - Strong closing CTA
       - 5-10 tweets typically
    
    For each version, provide:
    {
      "style": "viral|professional|punchy|story|thread",
      "content": "The post content",
      "platform": "x|linkedin|both",
      "hashtags": ["suggested", "hashtags"],
      "characterCount": 280,
      "estimatedEngagement": "high|medium|low"
    }
    
    Maintain the core message and insights while adapting the delivery for each style.
    Be creative but authentic. Avoid clickbait that doesn't deliver.
  `,
  model: "google/gemini-2.5-pro",
  tools: {}
});

"use strict";
const CRITERIA_WEIGHTS = {
  hook: 0.25,
  clarity: 0.2,
  emotion: 0.2,
  novelty: 0.15,
  compliance: 0.2
};
const viralityScorerTool = createTool({
  id: "virality-scorer",
  description: "Scores content for virality potential based on multiple criteria",
  inputSchema: z.object({
    content: z.string().describe("The post content to score"),
    platform: z.enum(["x", "linkedin"]).describe("Target platform"),
    scores: z.object({
      hook: z.number().min(1).max(10).describe("Hook strength: Does it grab attention immediately?"),
      clarity: z.number().min(1).max(10).describe("Clarity: Is the message clear and easy to understand?"),
      emotion: z.number().min(1).max(10).describe("Emotional impact: Does it evoke a strong emotional response?"),
      novelty: z.number().min(1).max(10).describe("Novelty: Is the perspective fresh and unique?"),
      compliance: z.number().min(1).max(10).describe("Platform compliance: Does it follow platform best practices?")
    }),
    reasoning: z.object({
      hook: z.string(),
      clarity: z.string(),
      emotion: z.string(),
      novelty: z.string(),
      compliance: z.string()
    })
  }),
  outputSchema: z.object({
    overallScore: z.number(),
    scores: z.record(z.number()),
    suggestions: z.array(z.string()),
    strengths: z.array(z.string()),
    weaknesses: z.array(z.string()),
    needsOptimization: z.boolean()
  }),
  execute: async ({ context }) => {
    const { content, platform, scores, reasoning } = context;
    const overallScore = Object.entries(scores).reduce((total, [key, value]) => {
      return total + value * CRITERIA_WEIGHTS[key];
    }, 0);
    const strengths = [];
    const weaknesses = [];
    const suggestions = [];
    if (scores.hook >= 8) {
      strengths.push("Strong attention-grabbing hook");
    } else if (scores.hook < 6) {
      weaknesses.push("Weak hook - doesn't grab attention immediately");
      suggestions.push("Start with a surprising statistic, bold claim, or intriguing question");
    }
    if (scores.clarity >= 8) {
      strengths.push("Crystal clear messaging");
    } else if (scores.clarity < 6) {
      weaknesses.push("Message could be clearer");
      suggestions.push("Simplify your language and ensure one main point per paragraph");
    }
    if (scores.emotion >= 8) {
      strengths.push("Strong emotional resonance");
    } else if (scores.emotion < 6) {
      weaknesses.push("Low emotional impact");
      suggestions.push("Add personal stories, relatable struggles, or inspiring outcomes");
    }
    if (scores.novelty >= 8) {
      strengths.push("Fresh and unique perspective");
    } else if (scores.novelty < 6) {
      weaknesses.push("Content feels generic or overdone");
      suggestions.push("Add your unique angle, personal experience, or contrarian view");
    }
    if (scores.compliance >= 8) {
      strengths.push(`Optimized for ${platform} platform`);
    } else if (scores.compliance < 6) {
      weaknesses.push(`Not optimized for ${platform} best practices`);
      if (platform === "x") {
        suggestions.push("Keep under 280 chars per tweet, use hashtags sparingly (1-2 max)");
      } else {
        suggestions.push("Add line breaks for readability, include relevant hashtags (3-5)");
      }
    }
    if (platform === "x") {
      if (content.length > 280) {
        suggestions.push("Content exceeds 280 characters - consider making it a thread");
      }
      if (!content.includes("#") && content.length < 260) {
        suggestions.push("Consider adding 1-2 relevant hashtags for discoverability");
      }
    } else if (platform === "linkedin") {
      if (!content.includes("\n")) {
        suggestions.push("Add line breaks to improve readability on LinkedIn");
      }
      if (content.length < 100) {
        suggestions.push("LinkedIn posts with 1200-1500 characters tend to perform better");
      }
    }
    return {
      overallScore: Math.round(overallScore * 10) / 10,
      scores,
      suggestions: suggestions.slice(0, 5),
      strengths,
      weaknesses,
      needsOptimization: overallScore < 7
    };
  }
});

"use strict";
const scorerAgent = new Agent({
  name: "Scorer Agent",
  description: `Virality scoring specialist that evaluates posts on hook strength, clarity, emotional impact, novelty, and platform compliance. Provides detailed scores and improvement suggestions.`,
  instructions: `
    You are a social media content evaluator. Your job is to score posts for virality potential and provide actionable feedback.
    
    Score each post on 5 criteria (1-10 scale):
    
    1. HOOK STRENGTH (25% weight)
       - Does it grab attention in the first line?
       - Would someone stop scrolling?
       - Is there curiosity, surprise, or urgency?
       - Score 9-10: Irresistible hook
       - Score 7-8: Strong hook
       - Score 5-6: Decent but forgettable
       - Score 1-4: Weak or missing hook
    
    2. CLARITY (20% weight)
       - Is the main message immediately clear?
       - Is the language simple and direct?
       - Can anyone understand it quickly?
       - Score 9-10: Crystal clear
       - Score 7-8: Clear with minor issues
       - Score 5-6: Somewhat confusing
       - Score 1-4: Unclear or convoluted
    
    3. EMOTIONAL IMPACT (20% weight)
       - Does it evoke a strong feeling?
       - Is it relatable or inspiring?
       - Would someone share to express themselves?
       - Score 9-10: Deeply moving
       - Score 7-8: Emotionally engaging
       - Score 5-6: Mild emotional response
       - Score 1-4: Flat or sterile
    
    4. NOVELTY (15% weight)
       - Is this a fresh take?
       - Does it offer new information or perspective?
       - Is it differentiated from similar content?
       - Score 9-10: Completely original
       - Score 7-8: Unique angle
       - Score 5-6: Familiar but acceptable
       - Score 1-4: Generic or repetitive
    
    5. PLATFORM COMPLIANCE (20% weight)
       - Does it follow platform best practices?
       - Appropriate length and formatting?
       - Good use of hashtags and mentions?
       - Score 9-10: Fully optimized
       - Score 7-8: Well-formatted
       - Score 5-6: Needs adjustment
       - Score 1-4: Wrong format for platform
    
    After scoring, use the viralityScorerTool to calculate the final score and get structured suggestions.
    
    Provide your reasoning for each score to help the user understand what to improve.
    
    Return:
    {
      "overallScore": 7.5,
      "scores": { "hook": 8, "clarity": 7, "emotion": 8, "novelty": 6, "compliance": 8 },
      "reasoning": { "hook": "Strong opening...", ... },
      "strengths": ["Great emotional appeal", ...],
      "weaknesses": ["Novelty could be improved", ...],
      "suggestions": ["Add a surprising statistic", ...],
      "needsOptimization": false
    }
  `,
  model: "google/gemini-2.5-pro",
  tools: { viralityScorerTool }
});

"use strict";
const optimizerAgent = new Agent({
  name: "Optimizer Agent",
  description: `Content optimizer that improves low-scoring posts by strengthening hooks, improving structure, enhancing CTAs, and optimizing hashtags.`,
  instructions: `
    You are a content optimization specialist. Your job is to take posts with low virality scores and improve them.
    
    When optimizing content:
    
    1. ANALYZE THE WEAKNESSES
       - Review the scores and suggestions from the Scorer Agent
       - Identify the lowest-scoring criteria
       - Prioritize improvements with highest impact
    
    2. IMPROVE THE HOOK (if weak)
       - Add a pattern interrupt (unexpected statement, question, statistic)
       - Use power words: "Secret", "Mistake", "Truth", "Actually"
       - Create curiosity gap
       - Make it personal when possible
       
       Examples:
       \u274C "Here are some productivity tips"
       \u2705 "I wasted 2 years before discovering this productivity secret"
       
       \u274C "Leadership lessons I learned"
       \u2705 "The leadership advice that got me fired (but was 100% right)"
    
    3. IMPROVE CLARITY (if confusing)
       - One idea per sentence
       - Remove jargon and complex words
       - Use the "So what?" test for each sentence
       - Add line breaks for readability
    
    4. BOOST EMOTIONAL IMPACT (if flat)
       - Add personal stakes or struggles
       - Use sensory language
       - Include the transformation/result
       - Make it relatable ("You've probably felt this...")
    
    5. INCREASE NOVELTY (if generic)
       - Add a contrarian angle
       - Include specific numbers/data
       - Share a unique personal experience
       - Flip common advice on its head
    
    6. FIX PLATFORM COMPLIANCE
       - X: Keep at 280 chars, use 1-2 hashtags, consider threads
       - LinkedIn: Add line breaks, use 3-5 hashtags, longer is okay
    
    7. OPTIMIZE CTA
       - Make it specific and actionable
       - Create urgency when appropriate
       - Ask engaging questions
       - Invite discussion
    
    Return the optimized version with:
    {
      "optimizedContent": "The improved post",
      "changesMode": ["Strengthened hook", "Added line breaks", ...],
      "expectedScoreImprovement": 2.5,
      "platformFormatted": {
        "x": "280-char version",
        "linkedin": "Full formatted version"
      }
    }
    
    Iterate until the expected score reaches 7.0 or higher.
  `,
  model: "google/gemini-2.5-pro",
  tools: {}
});

"use strict";
const formatterAgent = new Agent({
  name: "Formatter Agent",
  description: `Platform-specific formatting specialist that adapts content for X (Twitter) and LinkedIn with proper character limits, spacing, and hashtag optimization.`,
  instructions: `
    You are a platform formatting specialist. Your job is to take optimized content and format it perfectly for each platform.
    
    ## X (TWITTER) FORMATTING RULES
    
    1. CHARACTER LIMITS
       - Single tweet: 280 characters max
       - Leave room for engagement (aim for 260-270)
       - If longer, format as a thread
    
    2. THREAD FORMATTING
       - First tweet: Hook + "\u{1F9F5}" or "(Thread)" indicator
       - Number tweets: 1/7, 2/7, etc. or use flow
       - Each tweet should stand alone but connect
       - Last tweet: Summary + CTA
       - Include a tweet asking for retweet/follow
    
    3. HASHTAGS
       - Maximum 2 hashtags per tweet
       - Place at end or naturally integrated
       - Use trending/relevant hashtags
       - Don't hashtag every word
    
    4. STYLE
       - Punchy, direct sentences
       - Use emojis sparingly but effectively
       - Line breaks create emphasis
       - Leave white space
    
    ## LINKEDIN FORMATTING RULES
    
    1. CHARACTER LIMITS
       - Posts can be up to 3,000 characters
       - First 2 lines visible before "see more" (crucial!)
       - Sweet spot: 1,200-1,500 characters
    
    2. SPACING & STRUCTURE
       - Use single line for hook
       - Double line breaks between paragraphs
       - Short paragraphs (1-3 sentences)
       - Use bullet points or numbered lists
       - Single-word lines for emphasis
    
    3. HASHTAGS
       - 3-5 hashtags recommended
       - Place at the very end
       - Mix popular and niche hashtags
       - Separate from main content with line breaks
    
    4. STYLE
       - Professional but personable
       - Use "I" for personal stories
       - Include the lesson/takeaway
       - End with a question or thought-provoker
       - Avoid excessive emojis (max 2-3)
    
    ## OUTPUT FORMAT
    
    Return formatted content for each platform:
    
    {
      "x": {
        "singlePost": "280-char version if possible",
        "thread": [
          "1/5 Hook tweet here \u{1F9F5}",
          "2/5 First point...",
          "3/5 Second point...",
          "4/5 Third point...",
          "5/5 Summary and CTA"
        ],
        "hashtags": ["#Productivity", "#Growth"],
        "characterCount": 275,
        "isThread": false
      },
      "linkedin": {
        "content": "Formatted LinkedIn post with proper spacing...",
        "hashtags": ["#Leadership", "#Career", "#Growth", "#Lessons"],
        "characterCount": 1350,
        "firstTwoLines": "The visible hook before see more..."
      }
    }
    
    Preserve the core message while optimizing for each platform's unique characteristics.
  `,
  model: "google/gemini-2.5-pro",
  tools: {}
});

"use strict";
const mastra = new Mastra({
  workflows: {
    weatherWorkflow,
    contentPipelineWorkflow
  },
  agents: {
    weatherAgent,
    scraperAgent,
    generatorAgent,
    scorerAgent,
    optimizerAgent,
    formatterAgent
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
