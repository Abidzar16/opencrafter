# Opencrafter — Status

**Last updated:** 2026-05-31
**Phase:** 0 — Foundation (in progress)

---

## Right Now

Between tasks — last completed **0.2 Domain Types**.

## Next Up

1. **0.3 Dexie Schema & Hooks** `[BLOCKER]` — all tables + indexes + CRUD hooks
2. **0.4 UI Infrastructure** — Toast, ConfirmDialog, ActionMenu, EmptyState, ImageUpload, RevisionHistoryModal
3. **0.5 TanStack Router & App Shell** `[BLOCKER]` — routes, Zustand stores, novel shell layout
4. **0.6 Novel Library** — library page, create/delete/archive novel, series grouping
5. **0.7 Data Backup & Docker** — JSON export/import, Dockerfile, nginx, CI

## Recently Completed

- **0.1 Project Scaffolding** — Vite + React 18 + TypeScript 5 strict; Tailwind v4; shadcn/ui New York style; ESLint + Prettier; Vitest v4; Lucide React; `cn()` utility.
- **0.2 Domain Types** — All TypeScript interfaces in `src/types/`: Novel, Series, Act, Chapter, Scene, SceneContent, Beat, CodexEntry/Relation/Progression, Prompt, ModelConfig, Provider, ApiKey, ChatThread/Message, Snippet, Revision, Label. `index.ts` re-exports all. Typecheck passes clean.

---

## Context / Decisions

- Stack: React 18 · Vite 6 · TypeScript 5 strict · Tailwind v4 · shadcn/ui (New York, zinc base) · Dexie.js v4 · Zustand v5 · TanStack Router v1
- No backend. IndexedDB only. AI calls go direct from browser → provider API.
- Anthropic needs nginx CORS proxy (opt-in: `ENABLE_ANTHROPIC_PROXY=true` in docker-compose)
- `tasks.md` is the canonical checklist with all sub-tasks; this file is the session bookmark.
- Session protocol: read STATUS.md on open, update it on every task completion and before close.
- pnpm v11: esbuild build script approved via `pnpm-workspace.yaml` (`allowBuilds: esbuild: true`). shadcn/ui uses umbrella `radix-ui` package (not individual `@radix-ui/*` packages).
- Vitest is at v4 (latest), not v2 — update any docs referencing v2.
- `ai.ts` exports `AiChatMessage` (re-aliased from `ChatMessage`) in `index.ts` to avoid collision with `chat.ts`'s `ChatMessage`.
- Tiptap JSON content fields (`SceneContent.content`, `CodexEntry.description/notes`, `Snippet.content`) typed as `Record<string, unknown>` — compatible with Dexie structured-clone storage; no premature coupling to Tiptap's own types before it's installed.
