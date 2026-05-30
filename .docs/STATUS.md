# Opencrafter — Status

**Last updated:** 2026-05-30
**Phase:** 0 — Foundation (in progress)

---

## Right Now

Task **0.2 Domain Types** — defining all TypeScript interfaces in `src/types/`.

## Next Up

1. **0.2 Domain Types** `[BLOCKER]` — all TypeScript interfaces in `src/types/`
2. **0.3 Dexie Schema & Hooks** `[BLOCKER]` — all tables + indexes + CRUD hooks
3. **0.4 UI Infrastructure** — Toast, ConfirmDialog, ActionMenu, EmptyState, ImageUpload, RevisionHistoryModal
4. **0.5 TanStack Router & App Shell** `[BLOCKER]` — routes, Zustand stores, novel shell layout
5. **0.6 Novel Library** — library page, create/delete/archive novel, series grouping

## Recently Completed

- **0.1 Project Scaffolding** — Vite + React 18 + TypeScript 5 strict; Tailwind v4 (@tailwindcss/vite); shadcn/ui New York style (13 components); ESLint flat config + Prettier; Vitest v4 with jsdom; Lucide React; `cn()` utility. pnpm v11 with esbuild build approved via pnpm-workspace.yaml.

---

## Context / Decisions

- Stack: React 18 · Vite 6 · TypeScript 5 strict · Tailwind v4 · shadcn/ui (New York, zinc base) · Dexie.js v4 · Zustand v5 · TanStack Router v1
- No backend. IndexedDB only. AI calls go direct from browser → provider API.
- Anthropic needs nginx CORS proxy (opt-in: `ENABLE_ANTHROPIC_PROXY=true` in docker-compose)
- `tasks.md` is the canonical checklist with all sub-tasks; this file is the session bookmark.
- Session protocol: read STATUS.md on open, update it on every task completion and before close.
- pnpm v11: esbuild build script approved via `pnpm-workspace.yaml` (`allowBuilds: esbuild: true`). shadcn/ui uses umbrella `radix-ui` package (not individual `@radix-ui/*` packages).
- Vitest is at v4 (latest), not v2 — update any docs referencing v2.
