import { createWorkflow, createStep } from '@mastra/core/workflows';
import { z } from 'zod';

// Step 1: Research Agent - gathers information on the topic
const researchStep = createStep({
    id: 'research-step',
    description: 'Research a topic using web search and content extraction',
    inputSchema: z.object({
        topic: z.string().describe('The topic to research'),
        additionalContext: z.string().optional().describe('Any additional context or URLs to include'),
    }),
    outputSchema: z.object({
        research: z.string().describe('The research findings'),
    }),
    execute: async ({ inputData, mastra }) => {
        const { topic, additionalContext } = inputData;

        const researchAgent = mastra.getAgent('researchAgent');

        const prompt = additionalContext
            ? `Research the following topic thoroughly: "${topic}"\n\nAdditional context or sources to consider: ${additionalContext}\n\nProvide comprehensive research findings that can be used to create a LinkedIn post.`
            : `Research the following topic thoroughly: "${topic}"\n\nProvide comprehensive research findings that can be used to create a LinkedIn post. Include key facts, statistics, trends, and insights.`;

        const response = await researchAgent.generate(prompt);

        return {
            research: response.text,
        };
    },
});

// Step 2: LinkedIn Post Agent - creates a post from the research
const linkedinPostStep = createStep({
    id: 'linkedin-post-step',
    description: 'Create a LinkedIn post from research findings',
    inputSchema: z.object({
        research: z.string().describe('The research findings to turn into a post'),
    }),
    outputSchema: z.object({
        post: z.string().describe('The final LinkedIn post'),
    }),
    execute: async ({ inputData, mastra }) => {
        const { research } = inputData;

        const linkedinAgent = mastra.getAgent('linkedinPostAgent');

        const prompt = `Based on the following research, create an engaging LinkedIn post that will resonate with professionals:\n\n${research}\n\nCreate a compelling post that:\n- Has a hook that stops the scroll\n- Is well-formatted with short paragraphs\n- Includes a call-to-action\n- Has 3-5 relevant hashtags`;

        const response = await linkedinAgent.generate(prompt);

        return {
            post: response.text,
        };
    },
});

// Workflow: Research → LinkedIn Post
export const researchToLinkedinWorkflow = createWorkflow({
    id: 'research-to-linkedin',
    description: 'Research a topic and create an engaging LinkedIn post from the findings',
    inputSchema: z.object({
        topic: z.string().describe('The topic to research and create a post about'),
        additionalContext: z.string().optional().describe('Any additional context, URLs, or specific angles to consider'),
    }),
    outputSchema: z.object({
        post: z.string().describe('The final LinkedIn post'),
    }),
})
    .then(researchStep)
    .then(linkedinPostStep)
    .commit();
