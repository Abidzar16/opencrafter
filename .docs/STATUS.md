# Opencrafter — Status

**Last updated:** 2026-05-31
**Phase:** 1 — Plan Module (in progress)

---

## Right Now

Between tasks — last completed **1.6 Create from Outline**.

## Next Up

1. **2.1 Tiptap Editor Core** `[BLOCKER]` — install Tiptap, core editor wrapper, content persistence, word count, multi-scene view
2. **2.2 Custom Tiptap Extensions** `[BLOCKER]` — Beat node, Section node, SlashMenu, CodexHighlight shell
3. **2.3 Editor UI** — format menu bar, inline formatting, focus mode, scene details panel (Write side), story timeline
4. **2.4 Autosave Infrastructure** `[CROSS-CUTTING]` — `useDebouncedSave`, wire save-indicator
5. **2.5 Revision History — Write** `[CROSS-CUTTING]` — `useRevision` hook, snapshot pruning, version history modal

## Recently Completed

- **1.6 Create from Outline** — Collapsible panel with `#`/`##` text parser, preview step, append-to-novel flow, 8 preset templates (3 Act, Save the Cat, Hero's Journey, Freytag's Pyramid, Story Circle, Fichtean Curve, Derek Murphy 24ch, Story Clock), custom input.
- **1.5 Scene & Plan Actions** — Scene action menu (open details, subtitle, duplicate, move, archive, export, delete); chapter action menu (add/edit subtitle via dialog); act menus complete.
- **1.4 Scene Details Panel** — Right-side Sheet with title, subtitle, summary, beat editor (DnD reorder), POV dropdown (from codex character entries), label selector, info section.
- **1.3 Outline View** — Flat collapsible list (act → chapter → scene), inline summary textarea-edit, expandable read-only beat list, "open details" button.
- **1.2 Grid View** — Horizontal kanban: acts as column groups, chapters as columns, scene cards with configurable width/height/field visibility (persisted in localStorage), keyword search (title+summary+beats).
- **1.1 Story Structure CRUD** — PlanBoard with Act/Chapter/Scene create, inline rename (double-click), duplicate (deep copy), archive, restore, permanent delete, move, drag-and-drop reorder.

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
- Plan module view state (`planView`, `planSearch`) lives in Zustand UIStore. Card config (width/height/field visibility) stored in localStorage under `opencrafter:plan-card-config`.
- Scene Detail Panel uses `useEditorStore().activeSceneId` as the open/close signal. Setting `activeSceneId` to a scene ID opens the panel; setting it to `null` closes it. Works because SceneDetailPanel is only rendered in the plan route.
- Create from Outline parser: `#` → act, `##` → chapter, plain paragraphs → scene summaries. Each paragraph line = one scene. Auto-creates Act 1 / Chapter 1 if no headers present.
- Label colors stored as CSS hex strings; preset palette of 10 colors. Labels are per-novel (novelId FK). Scenes store label IDs in `scene.labels[]`.
- POV dropdown in Scene Detail Panel uses `useCodexEntriesByType(novelId, CodexType.Character)` — shows "Add character entries in the Codex" hint when empty.
