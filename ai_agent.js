/**
 * AI Agent Test Runner
 * 
 * This file demonstrates how to test the AI agents locally.
 * The actual agents are configured in src/lib/ai-agents.ts
 * 
 * Setup:
 * 1. Copy .env.example to .env.local
 * 2. Add your Gemini API key to .env.local
 * 3. Run: node --env-file=.env.local ai_agent.js
 */

import { OpenAI } from "openai";
import { Agent, run, OpenAIChatCompletionsModel } from "@openai/agents";

// Load API key from environment
const geminiApiKey = process.env.GEMINI_API_KEY;

if (!geminiApiKey) {
    console.error("❌ GEMINI_API_KEY not found in environment variables");
    console.log("Please create .env.local and add your API key");
    process.exit(1);
}

// Initialize Gemini client
const externalClient = new OpenAI({
    apiKey: geminiApiKey,
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
});

// Create model instance
const model = new OpenAIChatCompletionsModel(
    externalClient,
    "gemini-2.0-flash-exp"
);

// Test agent
const agent = new Agent({
    name: "TestAgent",
    instructions: "You are a helpful assistant for testing AI integration.",
    model: model,
});

async function runAgent() {
    console.log("🚀 Running agent with Gemini model...\n");

    const result = await run(
        agent,
        "Generate a short LinkedIn post about the benefits of AI automation."
    );

    console.log("✅ Agent Response:");
    console.log("─".repeat(50));
    console.log(result.finalOutput);
    console.log("─".repeat(50));
}

runAgent().catch((error) => {
    console.error("❌ Error:", error.message);
    process.exit(1);
});



// // TOOLS
// // fucntion tool and laso opiton refernce and also non-stric json schema tool 
// import { tool } from '@openai/agents';
// import { z } from 'zod';

// const getWeatherTool = tool({
//   name: 'get_weather',
//   description: 'Get the weather for a given city',
//   parameters: z.object({ city: z.string() }),
//   async execute({ city }) {
//     return `The weather in ${city} is sunny.`;
//   },
// });

// // Field	Required	Description
// // name	No	Defaults to the function name (e.g., get_weather).
// // description	Yes	Clear, human-readable description shown to the LLM.
// // parameters	Yes	Either a Zod schema or a raw JSON schema object. Zod parameters automatically enable strict mode.
// // strict	No	When true (default), the SDK returns a model error if the arguments don’t validate. Set to false for fuzzy matching.
// // execute	Yes	(args, context) => string | Promise<string>– your business logic. The optional second parameter is theRunContext.
// // errorFunction	No	Custom handler (context, error) => string for transforming internal errors into a user-visible string.


// import { tool } from '@openai/agents';

// interface LooseToolInput {
//   text: string;
// }

// const looseTool = tool({
//   description: 'Echo input; be forgiving about typos',
//   strict: false,
//   parameters: {
//     type: 'object',
//     properties: { text: { type: 'string' } },
//     required: ['text'],
//     additionalProperties: true,
//   },
//   execute: async (input) => {
//     // because strict is false we need to do our own verification
//     if (typeof input !== 'object' || input === null || !('text' in input)) {
//       return 'Invalid input. Please try again';
//     }
//     return (input as LooseToolInput).text;
//   },
// });


// // 3. Agents as tools
// // Sometimes you want an Agent to assist another Agent without fully handing off the conversation. Use agent.asTool():


// import { Agent } from '@openai/agents';

// const summarizer = new Agent({
//   name: 'Summarizer',
//   instructions: 'Generate a concise summary of the supplied text.',
// });

// const summarizerTool = summarizer.asTool({
//   toolName: 'summarize_text',
//   toolDescription: 'Generate a concise summary of the supplied text.',
// });

// const mainAgent = new Agent({
//   name: 'Research assistant',
//   tools: [summarizerTool],
// });

// Guardrails
// Guardrails can run alongside your agents or block execution until they complete, allowing you to perform checks and validations on user input or agent output. For example, you may run a lightweight model as a guardrail before invoking an expensive model. If the guardrail detects malicious usage, it can trigger an error and stop the costly model from running.

// There are two kinds of guardrails:

// Input guardrails run on the initial user input.
// Output guardrails run on the final agent output.
// Input guardrails
// Input guardrails run in three steps:

// The guardrail receives the same input passed to the agent.
// The guardrail function executes and returns a GuardrailFunctionOutput wrapped inside an InputGuardrailResult.
// If tripwireTriggered is true, an InputGuardrailTripwireTriggered error is thrown.
// Note Input guardrails are intended for user input, so they only run if the agent is the first agent in the workflow. Guardrails are configured on the agent itself because different agents often require different guardrails.

// Execution modes
// runInParallel: true (default) starts guardrails alongside the LLM/tool calls. This minimizes latency but the model may already have consumed tokens or run tools if the guardrail later triggers.
// runInParallel: false runs the guardrail before calling the model, preventing token spend and tool execution when the guardrail blocks the request. Use this when you prefer safety and cost over latency.
// Output guardrails
// Output guardrails run in 3 steps:

// The guardrail receives the output produced by the agent.
// The guardrail function executes and returns a GuardrailFunctionOutput wrapped inside an OutputGuardrailResult.
// If tripwireTriggered is true, an OutputGuardrailTripwireTriggered error is thrown.
// Note Output guardrails only run if the agent is the last agent in the workflow. For realtime voice interactions see the voice agents guide.

// Tripwires
// When a guardrail fails, it signals this via a tripwire. As soon as a tripwire is triggered, the runner throws the corresponding error and halts execution.

// Implementing a guardrail
// A guardrail is simply a function that returns a GuardrailFunctionOutput. Below is a minimal example that checks whether the user is asking for math homework help by running another agent under the hood.

// Input guardrail example
// import {
//   Agent,
//   run,
//   InputGuardrailTripwireTriggered,
//   InputGuardrail,
// } from '@openai/agents';
// import { z } from 'zod';

// const guardrailAgent = new Agent({
//   name: 'Guardrail check',
//   instructions: 'Check if the user is asking you to do their math homework.',
//   outputType: z.object({
//     isMathHomework: z.boolean(),
//     reasoning: z.string(),
//   }),
// });

// const mathGuardrail: InputGuardrail = {
//   name: 'Math Homework Guardrail',
//   // Set runInParallel to false to block the model until the guardrail completes.
//   runInParallel: false,
//   execute: async ({ input, context }) => {
//     const result = await run(guardrailAgent, input, { context });
//     return {
//       outputInfo: result.finalOutput,
//       tripwireTriggered: result.finalOutput?.isMathHomework ?? false,
//     };
//   },
// };

// const agent = new Agent({
//   name: 'Customer support agent',
//   instructions:
//     'You are a customer support agent. You help customers with their questions.',
//   inputGuardrails: [mathGuardrail],
// });

// async function main() {
//   try {
//     await run(agent, 'Hello, can you help me solve for x: 2x + 3 = 11?');
//     console.log("Guardrail didn't trip - this is unexpected");
//   } catch (e) {
//     if (e instanceof InputGuardrailTripwireTriggered) {
//       console.log('Math homework guardrail tripped');
//     }
//   }
// }

// main().catch(console.error);

// Output guardrails work the same way.

// Output guardrail example
// import {
//   Agent,
//   run,
//   OutputGuardrailTripwireTriggered,
//   OutputGuardrail,
// } from '@openai/agents';
// import { z } from 'zod';

// // The output by the main agent
// const MessageOutput = z.object({ response: z.string() });
// type MessageOutput = z.infer<typeof MessageOutput>;

// // The output by the math guardrail agent
// const MathOutput = z.object({ reasoning: z.string(), isMath: z.boolean() });

// // The guardrail agent
// const guardrailAgent = new Agent({
//   name: 'Guardrail check',
//   instructions: 'Check if the output includes any math.',
//   outputType: MathOutput,
// });

// // An output guardrail using an agent internally
// const mathGuardrail: OutputGuardrail<typeof MessageOutput> = {
//   name: 'Math Guardrail',
//   async execute({ agentOutput, context }) {
//     const result = await run(guardrailAgent, agentOutput.response, {
//       context,
//     });
//     return {
//       outputInfo: result.finalOutput,
//       tripwireTriggered: result.finalOutput?.isMath ?? false,
//     };
//   },
// };

// const agent = new Agent({
//   name: 'Support agent',
//   instructions:
//     'You are a user support agent. You help users with their questions.',
//   outputGuardrails: [mathGuardrail],
//   outputType: MessageOutput,
// });

// async function main() {
//   try {
//     const input = 'Hello, can you help me solve for x: 2x + 3 = 11?';
//     await run(agent, input);
//     console.log("Guardrail didn't trip - this is unexpected");
//   } catch (e) {
//     if (e instanceof OutputGuardrailTripwireTriggered) {
//       console.log('Math output guardrail tripped');
//     }
//   }
// }

// main().catch(console.error);

// guardrailAgent is used inside the guardrail functions.
// The guardrail function receives the agent input or output and returns the result.
// Extra information can be included in the guardrail result.
// agent defines the actual workflow where guardrails are applied.


// Sessions
// Sessions give the Agents SDK a persistent memory layer. Provide any object that implements the Session interface to Runner.run, and the SDK handles the rest. When a session is present, the runner automatically:

// Fetches previously stored conversation items and prepends them to the next turn.
// Persists new user input and assistant output after each run completes.
// Keeps the session available for future turns, whether you call the runner with new user text or resume from an interrupted RunState.
// This removes the need to manually call toInputList() or stitch history between turns. The TypeScript SDK ships with two implementations: OpenAIConversationsSession for the Conversations API and MemorySession, which is intended for local development. Because they share the Session interface, you can plug in your own storage backend. For inspiration beyond the Conversations API, explore the sample session backends under examples/memory/ (Prisma, file-backed, and more).

// Tip: To run the OpenAIConversationsSession examples on this page, set the OPENAI_API_KEY environment variable (or provide an apiKey when constructing the session) so the SDK can call the Conversations API.

// Quick start
// Use OpenAIConversationsSession to sync memory with the Conversations API, or swap in any other Session implementation.

// Use the Conversations API as session memory
// import { Agent, OpenAIConversationsSession, run } from '@openai/agents';

// const agent = new Agent({
//   name: 'TourGuide',
//   instructions: 'Answer with compact travel facts.',
// });

// // Any object that implements the Session interface works here. This example uses
// // the built-in OpenAIConversationsSession, but you can swap in a custom Session.
// const session = new OpenAIConversationsSession();

// const firstTurn = await run(agent, 'What city is the Golden Gate Bridge in?', {
//   session,
// });
// console.log(firstTurn.finalOutput); // "San Francisco"

// const secondTurn = await run(agent, 'What state is it in?', { session });
// console.log(secondTurn.finalOutput); // "California"

// Reusing the same session instance ensures the agent receives the full conversation history before every turn and automatically persists new items. Switching to a different Session implementation requires no other code changes.

// How the runner uses sessions
// Before each run it retrieves the session history, merges it with the new turn’s input, and passes the combined list to your agent.
// After a non-streaming run one call to session.addItems() persists both the original user input and the model outputs from the latest turn.
// For streaming runs it writes the user input first and appends streamed outputs once the turn completes.
// When resuming from RunResult.state (for approvals or other interruptions) keep passing the same session. The resumed turn is added to memory without re-preparing the input.
// Inspecting and editing history
// Sessions expose simple CRUD helpers so you can build “undo”, “clear chat”, or audit features.

// Read and edit stored items
// import { OpenAIConversationsSession } from '@openai/agents';
// import type { AgentInputItem } from '@openai/agents-core';

// // Replace OpenAIConversationsSession with any other Session implementation that
// // supports get/add/pop/clear if you store history elsewhere.
// const session = new OpenAIConversationsSession({
//   conversationId: 'conv_123', // Resume an existing conversation if you have one.
// });

// const history = await session.getItems();
// console.log(`Loaded ${history.length} prior items.`);

// const followUp: AgentInputItem[] = [
//   {
//     type: 'message',
//     role: 'user',
//     content: [{ type: 'input_text', text: 'Let’s continue later.' }],
//   },
// ];
// await session.addItems(followUp);

// const undone = await session.popItem();

// if (undone?.type === 'message') {
//   console.log(undone.role); // "user"
// }

// await session.clearSession();

// session.getItems() returns the stored AgentInputItem[]. Call popItem() to remove the last entry—useful for user corrections before you rerun the agent.

// Bring your own storage
// Implement the Session interface to back memory with Redis, DynamoDB, SQLite, or another datastore. Only five asynchronous methods are required.

// Custom in-memory session implementation
// import { Agent, run } from '@openai/agents';
// import { randomUUID } from '@openai/agents-core/_shims';
// import { logger, Logger } from '@openai/agents-core/dist/logger';
// import type { AgentInputItem, Session } from '@openai/agents-core';

// /**
//  * Minimal example of a Session implementation; swap this class for any storage-backed version.
//  */
// export class CustomMemorySession implements Session {
//   private readonly sessionId: string;
//   private readonly logger: Logger;

//   private items: AgentInputItem[];

//   constructor(
//     options: {
//       sessionId?: string;
//       initialItems?: AgentInputItem[];
//       logger?: Logger;
//     } = {},
//   ) {
//     this.sessionId = options.sessionId ?? randomUUID();
//     this.items = options.initialItems
//       ? options.initialItems.map(cloneAgentItem)
//       : [];
//     this.logger = options.logger ?? logger;
//   }

//   async getSessionId(): Promise<string> {
//     return this.sessionId;
//   }

//   async getItems(limit?: number): Promise<AgentInputItem[]> {
//     if (limit === undefined) {
//       const cloned = this.items.map(cloneAgentItem);
//       this.logger.debug(
//         `Getting items from memory session (${this.sessionId}): ${JSON.stringify(cloned)}`,
//       );
//       return cloned;
//     }
//     if (limit <= 0) {
//       return [];
//     }
//     const start = Math.max(this.items.length - limit, 0);
//     const items = this.items.slice(start).map(cloneAgentItem);
//     this.logger.debug(
//       `Getting items from memory session (${this.sessionId}): ${JSON.stringify(items)}`,
//     );
//     return items;
//   }

//   async addItems(items: AgentInputItem[]): Promise<void> {
//     if (items.length === 0) {
//       return;
//     }
//     const cloned = items.map(cloneAgentItem);
//     this.logger.debug(
//       `Adding items to memory session (${this.sessionId}): ${JSON.stringify(cloned)}`,
//     );
//     this.items = [...this.items, ...cloned];
//   }

//   async popItem(): Promise<AgentInputItem | undefined> {
//     if (this.items.length === 0) {
//       return undefined;
//     }
//     const item = this.items[this.items.length - 1];
//     const cloned = cloneAgentItem(item);
//     this.logger.debug(
//       `Popping item from memory session (${this.sessionId}): ${JSON.stringify(cloned)}`,
//     );
//     this.items = this.items.slice(0, -1);
//     return cloned;
//   }

//   async clearSession(): Promise<void> {
//     this.logger.debug(`Clearing memory session (${this.sessionId})`);
//     this.items = [];
//   }
// }

// function cloneAgentItem<T extends AgentInputItem>(item: T): T {
//   return structuredClone(item);
// }

// const agent = new Agent({
//   name: 'MemoryDemo',
//   instructions: 'Remember the running total.',
// });

// // Using the above custom memory session implementation here
// const session = new CustomMemorySession({
//   sessionId: 'session-123-4567',
// });

// const first = await run(agent, 'Add 3 to the total.', { session });
// console.log(first.finalOutput);

// const second = await run(agent, 'Add 4 more.', { session });
// console.log(second.finalOutput);

// Custom sessions let you enforce retention policies, add encryption, or attach metadata to each conversation turn before persisting it.

// Control how history and new items merge
// When you pass an array of AgentInputItems as the run input, provide a sessionInputCallback to merge them with stored history deterministically. The runner loads the existing history, calls your callback before the model invocation, and hands the returned array to the model as the turn’s complete input. This hook is ideal for trimming old items, deduplicating tool results, or highlighting only the context you want the model to see.

// Truncate history with sessionInputCallback
// import { Agent, OpenAIConversationsSession, run } from '@openai/agents';
// import type { AgentInputItem } from '@openai/agents-core';

// const agent = new Agent({
//   name: 'Planner',
//   instructions: 'Track outstanding tasks before responding.',
// });

// // Any Session implementation can be passed here; customize storage as needed.
// const session = new OpenAIConversationsSession();

// const todoUpdate: AgentInputItem[] = [
//   {
//     type: 'message',
//     role: 'user',
//     content: [
//       { type: 'input_text', text: 'Add booking a hotel to my todo list.' },
//     ],
//   },
// ];

// await run(agent, todoUpdate, {
//   session,
//   // function that combines session history with new input items before the model call
//   sessionInputCallback: (history, newItems) => {
//     const recentHistory = history.slice(-8);
//     return [...recentHistory, ...newItems];
//   },
// });

// For string inputs the runner merges history automatically, so the callback is optional.

// Handling approvals and resumable runs
// Human-in-the-loop flows often pause a run to wait for approval:

// const result = await runner.run(agent, 'Search the itinerary', {
//   session,
//   stream: true,
// });

// if (result.requiresApproval) {
//   // ... collect user feedback, then resume the agent in a later turn
//   const continuation = await runner.run(agent, result.state, { session });
//   console.log(continuation.finalOutput);
// }

// When you resume from a previous RunState, the new turn is appended to the same memory record to preserve a single conversation history. Human-in-the-loop (HITL) flows stay fully compatible—approval checkpoints still round-trip through RunState while the session keeps the transcript complete.




// Context management
// Context is an overloaded term. There are two main classes of context you might care about:

// Local context that your code can access during a run: dependencies or data needed by tools, callbacks like onHandoff, and lifecycle hooks.
// Agent/LLM context that the language model can see when generating a response.
// Local context
// Local context is represented by the RunContext<T> type. You create any object to hold your state or dependencies and pass it to Runner.run(). All tool calls and hooks receive a RunContext wrapper so they can read from or modify that object.

// Local context example
// import { Agent, run, RunContext, tool } from '@openai/agents';
// import { z } from 'zod';

// interface UserInfo {
//   name: string;
//   uid: number;
// }

// const fetchUserAge = tool({
//   name: 'fetch_user_age',
//   description: 'Return the age of the current user',
//   parameters: z.object({}),
//   execute: async (
//     _args,
//     runContext?: RunContext<UserInfo>,
//   ): Promise<string> => {
//     return `User ${runContext?.context.name} is 47 years old`;
//   },
// });

// async function main() {
//   const userInfo: UserInfo = { name: 'John', uid: 123 };

//   const agent = new Agent<UserInfo>({
//     name: 'Assistant',
//     tools: [fetchUserAge],
//   });

//   const result = await run(agent, 'What is the age of the user?', {
//     context: userInfo,
//   });

//   console.log(result.finalOutput);
//   // The user John is 47 years old.
// }

// main().catch((error) => {
//   console.error(error);
//   process.exit(1);
// });

// Every agent, tool and hook participating in a single run must use the same type of context.

// Use local context for things like:

// Data about the run (user name, IDs, etc.)
// Dependencies such as loggers or data fetchers
// Helper functions
// Note

// The context object is not sent to the LLM. It is purely local and you can read from or write to it freely.

// Agent/LLM context
// When the LLM is called, the only data it can see comes from the conversation history. To make additional information available you have a few options:

// Add it to the Agent instructions – also known as a system or developer message. This can be a static string or a function that receives the context and returns a string.
// Include it in the input when calling Runner.run(). This is similar to the instructions technique but lets you place the message lower in the chain of command.
// Expose it via function tools so the LLM can fetch data on demand.
// Use retrieval or web search tools to ground responses in relevant data from files, databases, or the web.