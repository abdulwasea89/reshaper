import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

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

export { pdfParseTool };
