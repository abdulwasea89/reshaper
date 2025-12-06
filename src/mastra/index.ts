import { Mastra } from '@mastra/core/mastra';
import { LibSQLStore } from '@mastra/libsql';
import { contentCreatorAgent } from './agents/content-creator-agent';

// Workflows
import { researchToLinkedinWorkflow } from './workflows/research-to-linkedin-workflow';

export const mastra = new Mastra({
  workflows: {
    researchToLinkedinWorkflow,
  },
  agents: {
    contentCreatorAgent,
  },
  storage: new LibSQLStore({
    url: ":memory:",
  }), 
  telemetry: {
    enabled: true,
  },
});