# Opencrafter — Status

**Last updated:** 2026-05-31
**Phase:** 0 — Foundation (complete)

---

## Right Now

Between tasks — last completed **0.7 Data Backup & Docker**. Phase 0 is fully done.

## Next Up

1. **1.1 Story Structure CRUD** — Act/Chapter/Scene create, inline rename, duplicate, archive, delete, move, reorder
2. **1.2 Grid View (Kanban)** — Kanban layout, scene cards, card configurator, keyword search
3. **1.3 Outline View** — Linear list, inline scene summary edit, beat list, collapse/expand
4. **1.4 Scene Details Panel** — Detail side panel, beat list editor, label system
5. **1.5 Scene & Plan Actions** — Action menus for scene/chapter/act

## Recently Completed

- **0.3 Dexie Schema & Hooks** — `src/lib/db/schema.ts` with all 20 tables + compound indexes; singleton `db.ts`; CRUD hooks split into hooks/novels.ts, hooks/structure.ts, hooks/scene-content.ts, hooks/codex.ts, hooks/snippets.ts, hooks/chat.ts, hooks/prompts.ts, hooks/revisions.ts, hooks/labels.ts, hooks/ordered-items.ts.
- **0.4 UI Infrastructure** — ToastProvider (Sonner), ConfirmDialog, ActionMenu, EmptyState, Spinner, ImageUpload (base64), RevisionHistoryModal; shadcn/ui components installed (Button, Dialog, DropdownMenu, Input, Textarea, Select, Badge, Separator, ScrollArea, Tooltip, Sheet, Tabs, Skeleton, Label).
- **0.5 TanStack Router & App Shell** — File-based routing in `src/routes/`; root layout with TooltipProvider + ToastProvider; all routes wired (/, /novel/$novelId, plan/write/chat/review, /settings, 404); three Zustand stores (useUIStore, useEditorStore, useAIStore); NovelShell three-region layout (icon sidebar + topbar mode switcher + main panel); SaveIndicator.
- **0.6 Novel Library** — Responsive cover-grid library page; CreateNovelDialog (title + cover + series); NovelCard (cover, title, timestamp, action menu); NovelSettingsModal; archive/unarchive/delete with ConfirmDialog; SeriesSection (collapse, rename, delete); series grouping in grid.
- **0.7 Data Backup & Docker** — `src/lib/backup/export.ts` + `import.ts` (full IndexedDB JSON dump/restore); Dockerfile (Node 22 builder → nginx:alpine); nginx.conf (SPA fallback, optional Anthropic proxy); docker-compose.yml (`ENABLE_ANTHROPIC_PROXY` gate); nginx-entrypoint.sh (env-driven proxy block); `.github/workflows/ci.yml` (lint + typecheck + test + build).

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
- Tiptap JSON content fields (`SceneContent.content`, `CodexEntry.description/notes`, `Snippet.content`) typed as `Record<string, unknown>` — compatible with Dexie structured-clone storage.
- shadcn CLI resolves `@/` path alias to a literal `@/` directory (bug); components must be manually moved to `src/components/ui/` after CLI runs — or run CLI then copy.
- TanStack Router routes live in `src/routes/` (not `src/app/` as originally planned). Vite plugin + `pnpm exec tsr generate` produces `src/routeTree.gen.ts`. Route paths must use exact string literals (no template literals) for type safety.
- DB singleton in `src/lib/db/db.ts` to avoid circular imports between `db/index.ts` and hooks.
- Backup lives in `src/lib/backup/` — export.ts iterates all Dexie tables to JSON; import.ts clears + bulkAdds within a transaction.
