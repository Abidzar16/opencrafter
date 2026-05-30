# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Opencrafter is an offline-first, single-user React SPA — an open-source Novelcrafter alternative. No backend. All persistence is IndexedDB via Dexie.js. AI calls go directly from the browser to provider APIs using user-supplied keys. The app is served from Docker (nginx static build).

Planning docs live in `.docs/`: `plan.md` (architecture decisions), `requirements.md` (full feature spec), `tasks.md` (ordered checklist), `STATUS.md` (current bookmark).

## Commands

```bash
# Dev
pnpm dev

# Build
pnpm build

# Type check
pnpm typecheck

# Lint
pnpm lint

# Tests
pnpm test              # watch mode
pnpm test --run        # single run
pnpm test src/lib/db   # single file/directory

# Docker
docker compose up --build
```

> The project is not yet scaffolded (Phase 0 not started). Commands above reflect the planned setup.

## Stack

| Concern | Choice |
|---|---|
| Language | TypeScript 5 (strict, `@/` path alias → `src/`) |
| Framework | React 18 + Vite |
| Package manager | pnpm |
| UI | shadcn/ui (Radix primitives) + Tailwind CSS v4 |
| Icons | Lucide React |
| Routing | TanStack Router v1 (file-based, type-safe params) |
| Persistence | Dexie.js v4 (IndexedDB ORM) |
| UI state | Zustand (ephemeral only — never duplicate Dexie data) |
| Editor | Tiptap v2 (ProseMirror) |
| Drag & drop | @dnd-kit/core |
| Testing | Vitest + @testing-library/react |

## Architecture

```
src/
├── app/                    # TanStack Router file-based routes
│   ├── index.tsx           # Novel library (root)
│   └── novel/$novelId/     # plan.tsx, write.tsx, chat.tsx, review.tsx
├── components/
│   ├── editor/             # Tiptap + custom extensions
│   ├── plan/               # Grid, Matrix, Outline views
│   ├── codex/              # Codex sidebar + entry editor
│   ├── chat/               # Workshop chat
│   ├── prompts/            # Prompt library UI
│   └── ui/                 # shadcn/ui re-exports + shared primitives
├── lib/
│   ├── db/                 # Dexie schema (schema.ts) + all CRUD hooks
│   ├── ai/                 # Provider adapters (openai, anthropic, groq, ollama, lmstudio) + stream util
│   ├── export/             # DOCX, Markdown, Scrivener exporters
│   ├── import/             # DOCX, Markdown importers
│   └── codex-detector/     # Name/alias matching for Tiptap highlight marks
├── stores/                 # Zustand (UI state only: active scene, panel visibility, modal state)
├── types/                  # All TypeScript interfaces (novel, structure, codex, prompt, ai, chat, snippet, revision, label)
└── main.tsx
```

## State management rule

**Zustand owns UI state. Dexie owns all persisted data.** Never store data that should survive a page reload in Zustand. Use Dexie's `useLiveQuery` for reactive data — components re-render automatically on DB changes.

## Data model

Tables (Dexie): `novels`, `series`, `acts`, `chapters`, `scenes`, `scene_content`, `codex_entries`, `codex_relations`, `codex_progressions`, `snippets`, `chat_threads`, `chat_messages`, `prompts`, `prompt_components`, `prompt_personas`, `prompt_presets`, `model_configs`, `api_keys`, `revisions`, `labels`.

Key compound indexes: `[novelId+order]` on acts/chapters/scenes; `[novelId+type]` on codex_entries.

Story hierarchy: Novel → Act → Chapter → Scene. `scene_content` is a separate table (id = sceneId) to avoid loading Tiptap JSON when querying scene metadata.

## Custom Tiptap extensions

Four extensions needed (none built yet):
- `CodexHighlight` mark — underlines codex entry names, attaches hover card. Implemented as ProseMirror decorations (not content mutations); debounced on idle to handle large documents.
- `Beat` node — inline beat instruction block distinct from prose.
- `Section` node — colored wrapper block for alternatives/kitbashing.
- `SlashMenu` — `/` trigger built on `@tiptap/extension-mention` as base.

## AI layer

API keys stored in Dexie (not localStorage). Streaming uses `ReadableStream` → `TextDecoder` → SSE parsing → Tiptap `insertContent` chunk by chunk.

**Anthropic CORS:** Anthropic's API blocks direct browser calls. The nginx config includes an opt-in CORS proxy enabled via `ENABLE_ANTHROPIC_PROXY=true` in `docker-compose.yml`. OpenRouter is a zero-config alternative for users who don't want the proxy.

## Session Protocol

### Opening a session
Read `.docs/STATUS.md` **before anything else** — every session, without exception. Use "Right Now" and "Next Up" to orient, then open with a one-sentence summary of where we are and what the immediate next task is. Do not wait for the user to re-explain context.

### During a session
- When **starting** a task: mark it `[~]` in `.docs/tasks.md`.
- When **completing** a task: mark it `[x]` in `.docs/tasks.md`, then immediately update `.docs/STATUS.md`:
  - Move finished task to "Recently Completed" (one line, include the task ID e.g. `0.1`).
  - Promote the next task to "Right Now".
  - Trim "Next Up" to the next 3–5 unstarted tasks.
  - Update "Last updated" to today's date.

### Closing a session
Before the conversation ends (when the user signals wrap-up, or after the last task of a session), write a final STATUS.md update so the next session can start cold:

| Field | What to write |
|---|---|
| **Last updated** | Today's date |
| **Phase** | Current phase name + number |
| **Right Now** | Exact task in progress (`[~]`) **or** "between tasks — last completed X.Y" if we ended cleanly |
| **Next Up** | Next 3–5 ordered tasks from `tasks.md`, not yet started |
| **Recently Completed** | 2–4 bullet points of what was done this session (task ID + one-line description) |
| **Context / Decisions** | Any non-obvious decisions made during the session that aren't captured in code or commit messages |

The rule: STATUS.md is the single source of truth for "where are we?" between sessions. It must always be accurate enough that a cold-start read answers "What will we be working on now?" without needing to re-read the whole task list.
