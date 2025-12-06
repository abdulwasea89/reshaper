import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

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
    const { content, platform, scores} = context;
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

export { viralityScorerTool };
