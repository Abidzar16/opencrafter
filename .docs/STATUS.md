# Opencrafter — Status

**Last updated:** 2026-05-30
**Phase:** 0 — Foundation (not started)

---

## Right Now

Between tasks — project not yet scaffolded. Ready to begin **0.1 Project Scaffolding**.

## Next Up

1. **0.1 Project Scaffolding** `[BLOCKER]` — `pnpm create vite`, TypeScript strict + path aliases, Tailwind v4, shadcn/ui base components, ESLint/Prettier, Vitest
2. **0.2 Domain Types** `[BLOCKER]` — all TypeScript interfaces in `src/types/`
3. **0.3 Dexie Schema & Hooks** `[BLOCKER]` — all tables + indexes + CRUD hooks
4. **0.4 UI Infrastructure** — Toast, ConfirmDialog, ActionMenu, EmptyState, ImageUpload, RevisionHistoryModal
5. **0.5 TanStack Router & App Shell** `[BLOCKER]` — routes, Zustand stores, novel shell layout

## Recently Completed

- Session 2026-05-30: Updated `CLAUDE.md` — replaced thin "Task tracking" line with a full Session Protocol (open/during/close behaviors). STATUS.md is now the enforced single source of truth across sessions.

---

## Context / Decisions

- Stack: React 18 · Vite · TypeScript 5 · Tailwind v4 · shadcn/ui · Dexie.js v4 · Zustand · TanStack Router v1
- No backend. IndexedDB only. AI calls go direct from browser → provider API.
- Anthropic needs nginx CORS proxy (opt-in: `ENABLE_ANTHROPIC_PROXY=true` in docker-compose)
- `tasks.md` is the canonical checklist with all sub-tasks; this file is the session bookmark.
- Session protocol: read STATUS.md on open, update it on every task completion and before close.
