# AI Agent Plan (Draft)

## Purpose
Define the initial plan for integrating an AI assistant into the Family Hub app.
This document is planning-only; no implementation changes are included yet.

## Decisions (Current)
- AI integration: TanStack AI
- Model provider: OpenAI
- Scope: Planning phase only (no code changes yet)

## UX Placement
- The assistant should be accessible from anywhere in the UI.
- The dashboard (root route) is the primary home for the assistant experience.

## Near-Term Goals
1. Establish a minimal AI request/response flow.
2. Provide a global entry point in the UI (accessible across routes).
3. Create a primary assistant surface on the dashboard.

## OpenClaw Agent Concept (Reference)
URL: https://github.com/openclaw/openclaw/tree/main
We can model our first agent loop after OpenClaw's documented lifecycle:
intake -> context assembly -> model inference -> tool execution -> streaming replies -> persistence.

Key architectural pieces we can replicate:
- Entry point: accept a request, resolve a session, and return a run id immediately.
- Agent command: resolve model + defaults, load skills/context, and start the loop.
- Loop runner: serialize runs per session, enforce timeouts, and execute model + tools.
- Stream bridge: emit assistant/tool/lifecycle events as the run proceeds.
- Wait semantics: allow callers to await lifecycle end/error for a run id.

Why this helps us:
- Serialized per-session runs prevent tool/session races.
- Lifecycle + stream events make UI updates predictable and testable.
- Clear hook points allow future extensibility without refactoring core flow.

## Family Hub Agent Architecture (Mapped from OpenClaw)
Translate OpenClaw components into a minimal starter version for our app:

- Gateway RPC (`agent`) -> `createAgentRun()`
  - Accept input, resolve session, create `runId`, store metadata, return immediately.
- `agentCommand` -> `startAgentRun()`
  - Resolve model + defaults, build context, call the loop runner.
- `runEmbeddedPiAgent` -> `runAgentLoop()`
  - Execute LLM calls, tool calls, and enforce timeout.
- `subscribeEmbeddedPiSession` -> `streamAgentEvents()`
  - Stream assistant/tool/lifecycle events to the UI.

Proposed minimal modules:
- `src/server/ai/runs.ts` for run creation + status.
- `src/server/ai/loop.ts` for the loop runner.
- `src/server/ai/stream.ts` for event streaming.
- `src/server/ai/tools.ts` for tool registry and execution.
- `src/server/ai/context.ts` for prompt/context assembly.

## Proposed Agent Design (Based on OpenClaw Learnings)
Goal: a gateway-style agent loop with session safety, streaming UX, and clear extension points.

### Runtime Flow
1. UI submits a message to `createAgentRun()`.
2. `createAgentRun()` stores metadata and returns `runId` immediately.
3. `startAgentRun()` builds context and calls `runAgentLoop()`.
4. `runAgentLoop()` executes model + tools, enforcing timeouts.
5. `streamAgentEvents()` emits lifecycle + assistant/tool events to the UI.
6. UI renders streaming output and final response on lifecycle end/error.

### Session Model
- One active run per session (serialize by `sessionKey`).
- Session transcript stored for replay and context assembly.
- Run metadata tracks status: `queued | running | completed | error | timeout`.

### Streaming Model
- `assistant` stream for text deltas.
- `tool` stream for tool start/update/end events.
- `lifecycle` stream for `start`, `end`, `error`.

### Extension Points (Future)
- `before_agent_start`: inject extra context or overrides.
- `before_tool_call` / `after_tool_call`: inspect tool inputs/outputs.
- `agent_end`: post-process final response and analytics.

### UI Surfaces
- Global assistant launcher.
- Dashboard chat panel with streaming updates and run status.

## Current Implementation (Status)
We have implemented a minimal backend loop and a test UI shell using TanStack AI.

### Backend (Agent Runtime)
Directory: `src/server/ai/`
- `runs.ts`: `createAgentRun()` entry point (server function).
- `loop.ts`: TanStack AI orchestrator (`chat` + OpenAI adapter).
- `context.ts`: system prompt builder.
- `tools/`: tool registry and implementations.
  - `tools/index.ts`: aggregates tools for the loop.
  - `tools/current-time.ts`: `current_time` tool.
  - `tools/list-tasks.ts`: `list_tasks` tool.
  - `tools/add-task.ts`: `add_task` tool.
- `types.ts`: shared run types.

### UI (Test Shell)
- `src/routes/_authed/-components/agent/agent-test-card.tsx`: input + run button.
- Rendered on the dashboard via `src/routes/_authed/index.tsx`.

### Notes
- Orchestration uses TanStack AI + `@tanstack/ai-openai`.
- Tools are defined with `toolDefinition().server()` and executed by the SDK.
- Model comes from `OPENAI_MODEL` (default fallback in `loop.ts`).

## Open Questions
- What user inputs should be captured (freeform, structured, or both)?
- How should responses be presented (chat thread, cards, or mixed)?
