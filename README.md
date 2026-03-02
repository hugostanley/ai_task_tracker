# LLM-Powered Chat Task Tracker

A conversational task management API where users create, complete, and annotate tasks through natural language. Built with Express, the Vercel AI SDK, OpenAI gpt-4o-mini, and PostgreSQL.

## Setup & Run

**Prerequisites:** Node.js 18+, pnpm, PostgreSQL

```bash
pnpm install
```

Create a `.env` file:

```
OPENAI_API_KEY=sk-...
DATABASE_URL=postgresql://user:password@localhost:5432/task_tracker
PORT=3000   # optional, defaults to 3000
```

Run migrations and start:

```bash
pnpm db:generate && pnpm db:migrate
pnpm dev
```

Server starts on `http://localhost:3000`.

## Architecture

```
Client (curl / frontend)
  │
  ▼
Express Router ── POST /chat · GET /tasks · POST /reset
  │
  ▼
Chat Service
  ├─ checkIdempotency()  → return cached response if duplicate
  ├─ storeMessage()      → persist user message with SHA-256 hash
  ├─ getRecentMessages() → last 20 messages for LLM context
  └─ streamText()        → Vercel AI SDK → OpenAI gpt-4o-mini
       │
       ▼  Tool calls (up to 5 steps)
  Task & Comment Services → PostgreSQL (Drizzle ORM)
```

**Components & boundaries:**

- **Routers** — HTTP only: parse request, call service, write response.
- **Services** — Business logic: chat orchestration (`chat.ts`), message persistence & idempotency (`messages.ts`), task CRUD (`tasks.ts`).
- **AI Tools** — Zod-validated function definitions the LLM can invoke. Each delegates to a service.
- **DB** — Three tables: `tasks`, `task_comments`, `messages`. Drizzle ORM with typed schema and migrations.

## How the LLM is Used

**Model:** OpenAI `gpt-4o-mini` via `streamText` from the Vercel AI SDK, with an agentic loop capped at 5 steps (`stopWhen: stepCountIs(5)`).

**Tools (4),** each with a Zod-validated schema:

| Tool | Parameters | Effect |
|------|-----------|--------|
| `getTasks` | _(none)_ | Returns all tasks with comments |
| `createTask` | `title`, `description?`, `status?` | Inserts a new task |
| `completeTask` | `id` | Sets status to "completed" |
| `addCommentToTask` | `taskId`, `comment` | Attaches a note to a task |

**System prompt** instructs the model to: execute all implied actions in one turn (e.g. create 3 tasks from one message), call `getTasks` before completing/commenting to resolve the right task, ask for clarification when ambiguous, and never call tools on off-topic messages or execute destructive bulk actions without confirmation.

**Context:** The current task list is injected into the system prompt. The last 20 messages are loaded from the DB as conversation history. This sliding window keeps prompt size bounded while giving enough context for back-references.

## Idempotency

Duplicate messages within a 5-minute window return the cached assistant response instead of re-running the LLM.

1. Every user message is hashed with **SHA-256** and stored in `messages.content_hash` (unique constraint).
2. On `POST /chat`, `checkIdempotency()` looks for an existing message with the same hash created within the last 5 minutes.
3. If found, it returns the corresponding assistant response immediately — no LLM call, no duplicate side effects.
4. If not found, the message is processed normally and both messages are stored for future dedup.

**Why it works:** Same content always produces the same hash, the DB unique constraint prevents duplicates, and the 5-minute window lets users legitimately repeat content later (e.g. "what are my tasks?" an hour apart) while catching rapid retries from network issues or double-clicks.

## Demo

Reset state, then run the three interactions:

```bash
# Reset
curl -X POST http://localhost:3000/reset

# 1. Create multiple tasks from one message
curl -N http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "I need to buy groceries, schedule a dentist appointment, and finish the quarterly report"}'

# Verify
curl http://localhost:3000/tasks

# 2. Complete a task with natural language
curl -N http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "I just got back from the dentist, mark that one done"}'

# 3. Attach a detail to a task
curl -N http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Add a note to the groceries task: remember to get oat milk and bananas"}'

# 4. Idempotency — send the same message twice, second returns cached response
curl -N http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What are my current tasks?"}'

curl -N http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What are my current tasks?"}'
```

## Key Tradeoffs & Next tasks

**Tradeoffs made:**

- **Sliding window (20 messages) vs. compaction** — Simple and predictable, but older context is silently dropped. Summarization would preserve more history at the cost of an extra LLM call.
- **Server-side content hash vs. client idempotency key** — Clients don't need to generate keys, but identical content is treated as duplicate even from different logical intents.
- **Single global conversation** — No session or user isolation. Simplifies implementation but doesn't scale to multiple users.

**Next tasks:**

- Message compaction/summarization for long conversations
- Client-provided `Idempotency-Key` header for more precise dedup
- Rate limiting, authentication, and session isolation
- Test coverage (unit + integration)
