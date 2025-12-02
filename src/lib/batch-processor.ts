import { LimitsConfig, needsBatching, calculateBatchCount } from "../config/limits";

export interface Batch {
    index: number;
    content: string;
    startChar: number;
    endChar: number;
    hasOverlap: boolean;
}

/**
 * Split long content into overlapping batches for processing
 */
export function splitContentIntoBatches(content: string): Batch[] {
    if (!needsBatching(content.length)) {
        return [{
            index: 0,
            content,
            startChar: 0,
            endChar: content.length,
            hasOverlap: false,
        }];
    }

    const batches: Batch[] = [];
    const chunkSize = LimitsConfig.batchChunkSize;
    const overlap = LimitsConfig.overlapSize;
    const effectiveChunkSize = chunkSize - overlap;

    let currentPosition = 0;
    let batchIndex = 0;

    while (currentPosition < content.length && batchIndex < LimitsConfig.maxBatches) {
        const start = Math.max(0, currentPosition - (batchIndex > 0 ? overlap : 0));
        const end = Math.min(content.length, currentPosition + chunkSize - (batchIndex > 0 ? overlap : 0));

        batches.push({
            index: batchIndex,
            content: content.slice(start, end),
            startChar: start,
            endChar: end,
            hasOverlap: batchIndex > 0,
        });

        currentPosition = end;
        batchIndex++;
    }

    return batches;
}

/**
 * Validate batch configuration
 */
export function validateBatchConfig(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (LimitsConfig.batchChunkSize < 1000) {
        errors.push("Batch chunk size too small (minimum 1000 characters)");
    }

    if (LimitsConfig.overlapSize >= LimitsConfig.batchChunkSize / 2) {
        errors.push("Overlap size must be less than half of chunk size");
    }

    if (LimitsConfig.maxBatches < 1) {
        errors.push("Max batches must be at least 1");
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}

/**
 * Calculate processing statistics
 */
export function calculateBatchStats(content: string) {
    const batches = splitContentIntoBatches(content);

    return {
        totalLength: content.length,
        needsBatching: needsBatching(content.length),
        batchCount: batches.length,
        avgBatchSize: batches.reduce((sum, b) => sum + b.content.length, 0) / batches.length,
        totalOverlapChars: batches.filter(b => b.hasOverlap).length * LimitsConfig.overlapSize,
    };
}
