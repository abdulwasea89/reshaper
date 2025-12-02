/**
 * Batch Processing and Token Limits Configuration
 * Controls how long content is split and processed
 */

export const LimitsConfig = {
    // Content length thresholds (in characters)
    maxContentLength: parseInt(process.env.MAX_CONTENT_LENGTH || "80000"),
    batchChunkSize: parseInt(process.env.BATCH_CHUNK_SIZE || "8000"),
    overlapSize: parseInt(process.env.BATCH_OVERLAP || "500"),

    // Batch processing limits
    maxBatches: parseInt(process.env.MAX_BATCHES || "10"),
    maxConcurrentSummarizers: parseInt(process.env.MAX_CONCURRENT_SUMMARIZERS || "3"),

    // Model token limits (estimated)
    estimatedTokenRatio: 0.25, // ~4 chars per token
} as const;

/**
 * Calculate if content needs batching
 */
export function needsBatching(contentLength: number): boolean {
    return contentLength > LimitsConfig.batchChunkSize;
}

/**
 * Calculate number of batches needed
 */
export function calculateBatchCount(contentLength: number): number {
    if (!needsBatching(contentLength)) return 1;

    const effectiveChunkSize = LimitsConfig.batchChunkSize - LimitsConfig.overlapSize;
    const batches = Math.ceil(contentLength / effectiveChunkSize);

    return Math.min(batches, LimitsConfig.maxBatches);
}

/**
 * Estimate token count from character count
 */
export function estimateTokens(chars: number): number {
    return Math.ceil(chars * LimitsConfig.estimatedTokenRatio);
}

export type LimitsConfigType = typeof LimitsConfig;
