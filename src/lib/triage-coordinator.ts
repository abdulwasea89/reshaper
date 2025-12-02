import { run } from "@openai/agents";
import { scraperAgent, ScraperOutput } from "./agents/scraper.agent";
import { summarizerAgent, SummarizerOutput } from "./agents/summarizer.agent";
import { aggregatorAgent, AggregatorOutput } from "./agents/aggregator.agent";
import { generatorAgent, ContentOutput } from "./agents/generator.agent";
import { splitContentIntoBatches, calculateBatchStats, validateBatchConfig } from "./batch-processor";
import { needsBatching } from "../config/limits";

// Event types for streaming progress
export type TriageEvent =
    | { type: "scraping"; url: string }
    | { type: "scraped"; length: number; needsBatching: boolean }
    | { type: "batch_created"; count: number; stats: ReturnType<typeof calculateBatchStats> }
    | { type: "summarizing_batch"; index: number; total: number }
    | { type: "batch_summarized"; index: number }
    | { type: "aggregating"; summaryCount: number }
    | { type: "aggregated" }
    | { type: "generating" }
    | { type: "complete"; posts: ContentOutput }
    | { type: "error"; error: string; stage: string };

/**
 * Main Triage Coordinator
 * Orchestrates the multi-agent workflow for content processing
 */
export class TriageCoordinator {
    /**
     * Process a URL through the entire triage pipeline
     */
    async *processURL(url: string): AsyncGenerator<TriageEvent> {
        try {
            // Validate batch configuration
            const configValidation = validateBatchConfig();
            if (!configValidation.valid) {
                yield {
                    type: "error",
                    error: `Invalid batch config: ${configValidation.errors.join(", ")}`,
                    stage: "validation",
                };
                return;
            }

            // Step 1: Scrape content
            yield { type: "scraping", url };

            const scraperResult = await run(scraperAgent, `Fetch content from: ${url}`);
            const scraperOutput = scraperResult.finalOutput as any;

            if (!scraperOutput.success) {
                yield {
                    type: "error",
                    error: scraperOutput.error || "Failed to scrape URL",
                    stage: "scraping",
                };
                return;
            }

            const content = scraperOutput.content;
            const contentLength = content.length;

            yield {
                type: "scraped",
                length: contentLength,
                needsBatching: needsBatching(contentLength),
            };

            // Step 2: Decide on processing strategy
            let finalAnalysis: string;

            if (needsBatching(contentLength)) {
                // Long content: Use batch processing
                const batches = splitContentIntoBatches(content);
                const stats = calculateBatchStats(content);

                yield {
                    type: "batch_created",
                    count: batches.length,
                    stats,
                };

                // Step 3: Summarize each batch
                const summaries: SummarizerOutput[] = [];

                for (let i = 0; i < batches.length; i++) {
                    yield {
                        type: "summarizing_batch",
                        index: i,
                        total: batches.length,
                    };

                    const batch = batches[i];
                    const summaryResult = await run(
                        summarizerAgent,
                        `Summarize this content (batch ${i + 1}/${batches.length}):\n\n${batch.content}`
                    );

                    summaries.push(summaryResult.finalOutput!);

                    yield {
                        type: "batch_summarized",
                        index: i,
                    };
                }

                // Step 4: Aggregate summaries
                yield {
                    type: "aggregating",
                    summaryCount: summaries.length,
                };

                const aggregatorResult = await run(
                    aggregatorAgent,
                    `Combine these ${summaries.length} summaries into one unified summary:\n\n${JSON.stringify(summaries, null, 2)}`
                );

                const aggregated = aggregatorResult.finalOutput;
                if (!aggregated) {
                    throw new Error("Aggregator failed to produce output");
                }
                finalAnalysis = aggregated.unifiedSummary;

                yield { type: "aggregated" };
            } else {
                // Short content: Direct processing
                const summaryResult = await run(
                    summarizerAgent,
                    `Analyze and summarize this content:\n\n${content.slice(0, 8000)}`
                );

                const summary = summaryResult.finalOutput;
                if (!summary) {
                    throw new Error("Summarizer failed to produce output");
                }
                finalAnalysis = summary.summary;
            }

            // Step 5: Generate social media posts
            yield { type: "generating" };

            const generatorResult = await run(
                generatorAgent,
                `Create engaging social media posts based on this analysis:\n\n${finalAnalysis}`
            );

            const posts = generatorResult.finalOutput;
            if (!posts) {
                throw new Error("Generator failed to produce output");
            }

            yield {
                type: "complete",
                posts,
            };
        } catch (error) {
            yield {
                type: "error",
                error: error instanceof Error ? error.message : "Unknown error",
                stage: "unknown",
            };
        }
    }

    /**
     * Process URL without streaming (for non-streaming endpoints)
     */
    async processURLDirect(url: string): Promise<ContentOutput> {
        let finalPosts: ContentOutput | null = null;

        for await (const event of this.processURL(url)) {
            if (event.type === "complete") {
                finalPosts = event.posts;
            } else if (event.type === "error") {
                throw new Error(`${event.stage}: ${event.error}`);
            }
        }

        if (!finalPosts) {
            throw new Error("No posts generated");
        }

        return finalPosts;
    }
}

// Export singleton instance
export const triageCoordinator = new TriageCoordinator();
