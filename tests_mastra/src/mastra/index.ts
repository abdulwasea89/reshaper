
import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
import { LibSQLStore } from '@mastra/libsql';

// Workflows
import { weatherWorkflow } from './workflows/weather-workflow';
import { contentPipelineWorkflow } from './workflows/content-pipeline-workflow';

// Agents
import { weatherAgent } from './agents/weather-agent';
import { scraperAgent } from './agents/scraper-agent';
import { analyzerAgent } from './agents/analyzer-agent';
import { generatorAgent } from './agents/generator-agent';
import { scorerAgent } from './agents/scorer-agent';
import { optimizerAgent } from './agents/optimizer-agent';
import { formatterAgent } from './agents/formatter-agent';


export const mastra = new Mastra({
  workflows: {
    weatherWorkflow,
    contentPipelineWorkflow,
  },
  agents: {
    weatherAgent,
    scraperAgent,
    analyzerAgent,
    generatorAgent,
    scorerAgent,
    optimizerAgent,
    formatterAgent,
  },
  storage: new LibSQLStore({
    // stores observability, scores, ... into memory storage, if it needs to persist, change to file:../mastra.db
    url: ":memory:",
  }),
  logger: new PinoLogger({
    name: 'Mastra',
    level: 'info',
  }),
  telemetry: {
    // Telemetry is deprecated and will be removed in the Nov 4th release
    enabled: false,
  },
  observability: {
    // Enables DefaultExporter and CloudExporter for AI tracing
    default: { enabled: true },
  },
});
