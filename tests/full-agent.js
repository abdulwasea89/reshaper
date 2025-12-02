import "dotenv/config";
import { Agent, run, tool } from "@openai/agents";
import { google } from "@ai-sdk/google";
import { aisdk } from "@openai/agents-extensions";
import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";
import pdfParse from "pdf-parse";
import fs from "fs/promises";
import RSSParser from "rss-parser";
import axios from "axios";
import ytdl from "ytdl-core";
import { getTranscript } from "youtube-transcript"; // npm install youtube-transcript
import z from "zod";

// --- Web Tool ---
const scrapeWebTool = tool({
  name: "scrape_web",
  description: "Scrape webpage text + metadata + images",
  parameters: z.object({ url: z.string() }),
  execute: async ({ url }) => {
    const loader = new CheerioWebBaseLoader(url);
    const docs = await loader.load();
    return {
      success: true,
      type: "web",
      source: url,
      content: docs[0].pageContent,
      metadata: { title: docs[0].metadata.title, images: docs[0].metadata.images },
    };
  },
});

// --- PDF Tool ---
const pdfTool = tool({
  name: "load_pdf",
  description: "Extract text from PDF",
  parameters: z.object({ pathOrUrl: z.string() }),
  execute: async ({ pathOrUrl }) => {
    let dataBuffer;
    if (pathOrUrl.startsWith("http")) {
      const response = await axios.get(pathOrUrl, { responseType: "arraybuffer" });
      dataBuffer = response.data;
    } else {
      await fs.access(pathOrUrl);
      dataBuffer = await fs.readFile(pathOrUrl);
    }
    const data = await pdfParse(dataBuffer);
    return { success: true, type: "pdf", source: pathOrUrl, content: data.text };
  },
});

// --- RSS Tool ---
const rssTool = tool({
  name: "rss_parser",
  description: "Parse RSS feed",
  parameters: z.object({ url: z.string() }),
  execute: async ({ url }) => {
    const parser = new RSSParser();
    const feed = await parser.parseURL(url);
    return {
      success: true,
      type: "rss",
      source: url,
      content: feed.items.map(i => i.contentSnippet || i.content).join("\n"),
      metadata: { title: feed.title },
    };
  },
});

// --- YouTube Tool with Transcript ---
const youtubeTool = tool({
  name: "youtube_extractor",
  description: "Extract video info + transcript",
  parameters: z.object({ url: z.string() }),
  execute: async ({ url }) => {
    const info = await ytdl.getInfo(url);
    let transcript = "";
    try { transcript = (await getTranscript(info.videoDetails.videoId)).map(t => t.text).join("\n"); }
    catch { transcript = info.videoDetails.description; }
    return {
      success: true,
      type: "youtube",
      source: url,
      content: transcript,
      metadata: { title: info.videoDetails.title }
    };
  },
});

// --- Social Profile Placeholder ---
const socialProfileTool = tool({
  name: "social_profile",
  description: "Fetch social media profile info (API required)",
  parameters: z.object({ profileUrl: z.string() }),
  execute: async ({ profileUrl }) => ({ success: true, type: "social", source: profileUrl, content: "API integration required" }),
});

// --- AI Model ---
const model = aisdk(google("models/gemini-2.0-flash", { apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY }));

// --- ReAct Agent ---
const agent = new Agent({
  name: "ReActContentAgent",
  instructions: `
    You receive any input (URL or PDF). Detect type (web, PDF, RSS, YouTube, social), 
    choose the appropriate tool, extract content + metadata, and return structured data:
    { source, type, content, metadata, linkedinPost, xPost }.
    Follow ReAct reasoning: plan → act → observe → respond.
    After generating posts, review your work for completeness and relevance.
  `,
  model,
  tools: [scrapeWebTool, pdfTool, rssTool, youtubeTool, socialProfileTool],
  modelSettings: { toolChoice: "required" },
});

// --- Example Inputs ---
const inputs = [
  "https://www.example.com/article-about-ai-trends",
  "https://techcrunch.com/feed/",
  "https://www.torontomu.ca/sciencerendezvous/SR2021/A_Brief_Introduction_To_AI.pdf",
  "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "https://www.linkedin.com/in/example-profile/"
];

// --- Run Agent ---
for (const input of inputs) {
  console.log(`\n=== Processing: ${input} ===`);
  const result = await run(agent, `Process this input and return structured data + LinkedIn/X posts: ${input}`, { stream: true });
  result.toTextStream({ compatibleWithNodeStreams: true }).pipe(process.stdout);
}