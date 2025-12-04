import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

// PDF parsing is done server-side only
// We'll use dynamic import to avoid issues with the package

export const pdfParseTool = createTool({
    id: 'pdf-parse',
    description: 'Parses text content from a PDF file provided as base64 or URL',
    inputSchema: z.object({
        source: z.union([
            z.object({
                type: z.literal('base64'),
                data: z.string().describe('Base64 encoded PDF data'),
                filename: z.string().optional(),
            }),
            z.object({
                type: z.literal('url'),
                url: z.string().url().describe('URL to the PDF file'),
            }),
        ]),
    }),
    outputSchema: z.object({
        text: z.string(),
        pages: z.number(),
        wordCount: z.number(),
        info: z.object({
            title: z.string().optional(),
            author: z.string().optional(),
            creator: z.string().optional(),
        }).optional(),
    }),
    execute: async ({ context }) => {
        const { source } = context;

        try {
            // Dynamically import pdf-parse to avoid SSR issues
            const pdfParse = (await import('pdf-parse')).default;

            let pdfBuffer: Buffer;

            if (source.type === 'base64') {
                // Decode base64 to buffer
                pdfBuffer = Buffer.from(source.data, 'base64');
            } else {
                // Fetch PDF from URL
                const response = await fetch(source.url);
                if (!response.ok) {
                    throw new Error(`Failed to fetch PDF: ${response.status}`);
                }
                const arrayBuffer = await response.arrayBuffer();
                pdfBuffer = Buffer.from(arrayBuffer);
            }

            // Parse the PDF
            const data = await pdfParse(pdfBuffer);

            // Clean up the text
            const cleanText = data.text
                .replace(/\s+/g, ' ')
                .replace(/\n+/g, '\n')
                .trim();

            return {
                text: cleanText.slice(0, 50000), // Limit text length
                pages: data.numpages,
                wordCount: cleanText.split(/\s+/).length,
                info: {
                    title: data.info?.Title || undefined,
                    author: data.info?.Author || undefined,
                    creator: data.info?.Creator || undefined,
                },
            };
        } catch (error) {
            throw new Error(`Failed to parse PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    },
});
