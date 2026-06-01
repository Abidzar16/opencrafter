# Opencrafter — Status

**Last updated:** 2026-06-01
**Phase:** 3 — Codex Module (tasks 3.1–3.7 complete — Phase 3 done)

---

## Right Now

Between tasks — last completed **3.7 Quick Create & Pinning**. Phase 3 complete.

## Next Up

1. **4.1 Provider Infrastructure** — `AIProvider` interface, SSE stream util, OpenAI/Anthropic/Groq/Ollama/LMStudio/OpenRouter/Generic provider adapters, provider registry.
2. **4.2 API Key Management** — Settings page "AI Connections" tab, per-provider key CRUD, test connection button.
3. **4.3 Model Collections** — Model config CRUD, per-model fields (temp/top-p/max tokens), thinking mode toggle.
4. **4.4 Streaming Prose Generation** — Beat completion flow, `useGenerateStream` hook, text replacement flow.
5. **4.5 Never Include Enforcement** — `filterNeverIncludeEntries`, test coverage, debug preview utility.

## Recently Completed

- **3.7 Quick Create & Pinning** — `QuickCreateCodexDialog` (name/type/description, auto-associates to active scene); `/new codex entry` slash menu item dispatching `OPEN_QUICK_CREATE_CODEX_EVENT`; Pin button in CodexSidebar header (`codexPinned` in UIStore); NovelShell shows codex panel when pinned regardless of `activePanel`; `showCodexAssociations` field in `CardConfig`; `BookOpen` count badge on scene cards.
- **3.6 Codex Relations** — Relations tab (add typed link, free-text or preset types, inbound display via `toId` query). Fixed: removed duplicate backlink auto-creation; inbound section naturally shows incoming links via DB query without separate records. "Referenced entry in AI context" checkbox deferred to Phase 6.
- **3.5 Codex Progressions** — `ProgressionPicker` dialog from slash menu (`/codex progression`); `ProgressionBadge` inline annotations with tooltip; Progressions tab in EntryEditor (list + inline edit/delete); `useCodexProgressionsByScene` hook; wired into `buildAIContext`.
- **3.4 Tracking & AI Context** — Tracking tab in EntryEditor (enable toggle, case-sensitive, exclusion list chips, AI context mode, NeverInclude warning). `buildAIContext()` in `src/lib/ai/context-builder.ts` + `renderContextBlocks()` helper.
- **3.3 Codex Highlights** — `codex-detection-plugin.ts` (ProseMirror DecorationSet, requestIdleCallback debounce, meta-transaction so autosave skipped); `CodexHoverCard.tsx` (portal, mouseover listener, entry name/type/excerpt); mention count updates to DB.
- **3.2 Detection Engine** — `src/lib/codex-detector/index.ts` (regex alternation, word boundaries, auto-plurals, exclusion overlap, longest-match-wins); 17 unit tests passing; `useTrackedEntries` hook.
- **3.1 Codex Entry Management** — `CodexSidebar` (grouped by type, collapsible sections, search, new-entry button); `EntryEditor` (4-tab Sheet: General/Relations/Tracking/Progressions; alias+tag chips, Tiptap description/notes with revision history, key-value details, cover image, category); CRUD + duplicate; wired to NovelShell icon sidebar.

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
- Slash menu uses `@tiptap/suggestion` + tippy.js for the popup; items: Beat, Section, Codex Progression. Codex Progression dispatches `OPEN_PROGRESSION_PICKER_EVENT` DOM custom event; MultiSceneView listens and opens ProgressionPicker dialog.
- Revision tracking: `useRevision` snapshots the CURRENT stored DB content before the debounced save overwrites it. Prune to last 50 per entity is handled in `useCreateRevision`.
- `SceneInfoPanel` is the write-mode right panel (not the plan SceneDetailPanel). It includes scene word count, summary edit (with revision tracking), and "Version history" → opens RevisionHistoryModal for SceneContent revisions.
- Story timeline uses per-scene word counts from stored `scene_content` JSON to size segments proportionally.
- Codex detection plugin: ProseMirror DecorationSet plugin (`codex-detection-plugin.ts`). Uses `requestIdleCallback` (with setTimeout fallback) + 50ms leadtime. Dispatches meta-transaction with key `CODEX_DETECTION_META` — Editor.tsx uses `onTransaction` (not `onUpdate`) and skips save for these meta transactions.
- `ProseEditor.tsx` — lightweight Tiptap wrapper (StarterKit + Underline + Placeholder); used in EntryEditor for description/notes fields.
- `buildAIContext` lives in `src/lib/ai/context-builder.ts` — pure async function, imports `db` directly (not a hook).
- `RevisionEntityType.CodexDescription` for entry description revisions; `RevisionEntityType.CodexNotes` for notes revisions.
- Codex sidebar opens as a 288px panel between the icon strip and main content in NovelShell when `activePanel === 'codex'`.
