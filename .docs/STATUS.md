# Opencrafter — Status

**Last updated:** 2026-05-31
**Phase:** 2 — Write Module (completed)

---

## Right Now

Between tasks — last completed **2.5 Revision History — Write**.

## Next Up

1. **3.1 Codex Entry Management** — Codex sidebar panel, entry editor (tabs: General, Relations, Tracking, Progressions), CRUD, categories, tags, cover image, revision history
2. **3.2 Codex Detection Engine `[BLOCKER]`** — Aho-Corasick / regex detection, alias + plural support, exclusion list, unit tests, `useTrackedEntries` hook
3. **3.3 Codex Highlights in Editor** — Wire `CodexHighlight` mark shell (from 2.2) to detection engine, hover card, mention count tracking
4. **3.4 Tracking & AI Context Modes** — Tracking tab in entry editor, `buildAIContext` function
5. **3.5 Codex Progressions** — Create from slash menu, progressions tab, scene position anchoring

## Recently Completed

- **2.5 Revision History** — `useRevision` hook snapshots content before overwrite; wired to scene content + scene summary saves; "Version history" added to scene-card and scene-row action menus.
- **2.4 Autosave Infrastructure** — `useDebouncedSave` hook with immediate 'saving' status, debounced DB write, 'saved'→'idle' transition; wired to save-indicator in topbar.
- **2.3 Editor UI** — `EditorToolbar` (format bar: heading selector, bold/italic/underline/strikethrough/blockquote, alignment, focus mode toggle); `SceneInfoPanel` (word count, summary edit, quick actions); `StoryTimeline` (proportional scene segments, click-to-scroll).
- **2.2 Custom Extensions** — `BeatNode` (amber block, NodeView, Enter exits); `SectionNode` (colored left-border wrapper, color picker palette); `SlashMenu` (`@tiptap/suggestion` + tippy.js popup, filters Beat/Section); `CodexHighlight` mark shell (stores `entryId`, underline style, Phase 3 hook).
- **2.1 Tiptap Editor Core** — `Editor.tsx` (Tiptap v3, debounced save + revision snapshot, word count sync); `MultiSceneView` (all chapter scenes stacked, configurable divider: line/asterisks/blank/custom); `ChapterSwitcher` dropdown; full Write page with focus mode (Esc to exit), chapter switcher bar, right info panel toggle, story timeline.
- **1.6 Create from Outline** — 8 preset templates, custom input, parser, preview step.

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
- Tiptap installed as v3 (latest, 3.24.0). Editor components live in `src/components/editor/`. Custom extensions in `src/components/editor/extensions/`.
- `useDebouncedSave` and `useRevision` live in `src/lib/hooks/` (not in `src/lib/db/hooks/`).
- Slash menu uses `@tiptap/suggestion` + tippy.js for the popup; items: Beat, Section (Codex items added in Phase 3).
- Revision tracking: `useRevision` snapshots the CURRENT stored DB content before the debounced save overwrites it. Prune to last 50 per entity is handled in `useCreateRevision`.
- `SceneInfoPanel` is the write-mode right panel (not the plan SceneDetailPanel). It includes scene word count, summary edit (with revision tracking), and "Version history" → opens RevisionHistoryModal for SceneContent revisions.
- Story timeline uses per-scene word counts from stored `scene_content` JSON to size segments proportionally.
