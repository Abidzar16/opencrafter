# Opencrafter — Status

**Last updated:** 2026-05-31
**Phase:** 1 — Plan Module (in progress)

---

## Right Now

Between tasks — last completed **1.1 Story Structure CRUD**.

## Next Up

1. **1.2 Grid View (Kanban)** — Kanban layout, scene cards, card configurator, keyword search
2. **1.3 Outline View** — Linear list, inline scene summary edit, beat list, collapse/expand
3. **1.4 Scene Details Panel** — Detail side panel, beat list editor, label system
4. **1.5 Scene & Plan Actions** — Action menus for scene/chapter/act
5. **1.6 Create from Outline** — Text parser, preview step, preset templates

## Recently Completed

- **1.1 Story Structure CRUD** — PlanBoard with Act/Chapter/Scene create, inline rename (double-click), duplicate (deep copy), archive, restore, permanent delete, move (scene→chapter, chapter→act pickers), and drag-and-drop reorder at all three levels using @dnd-kit/core.
- **0.7 Data Backup & Docker** — Full IndexedDB JSON backup/restore, Dockerfile, nginx.conf, docker-compose.yml with ANTHROPIC proxy gate, CI workflow.
- **0.6 Novel Library** — Cover grid, CreateNovelDialog, NovelCard, NovelSettingsModal, archive/delete, series grouping.
- **0.5 TanStack Router & App Shell** — File-based routes, NovelShell, Zustand stores, SaveIndicator.

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
- `@dnd-kit/core` + `@dnd-kit/sortable` + `@dnd-kit/utilities` installed for drag-and-drop.
- Plan module components live in `src/components/plan/`. Each level (act/chapter/scene) has its own DndContext for reordering within that level; cross-level moves (scene→chapter, chapter→act) use picker dialogs.
- `InlineEdit` triggers on double-click (not single-click) to avoid accidental edits.
- Archived items across all three levels are surfaced in `ArchivedPanel` at the bottom of PlanBoard — toggled by a collapsible row.
