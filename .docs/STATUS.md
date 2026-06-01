# Opencrafter — Status

**Last updated:** 2026-06-01
**Phase:** 5 — Prompt System (Phase 5 complete)

---

## Right Now

Between tasks — last completed **5.6 Prompt Preview**. Phase 5 complete.

## Next Up

1. **6.1 Thread Management** — Chat thread sidebar, CRUD (create, rename, pin, archive, delete), "New chat" shortcut.
2. **6.2 Chat Interface** — Message list (markdown AI messages), streaming token display, stop button, copy/delete/regenerate.
3. **6.3 Context Selector & Message Bar** — Novel text / snippets / codex context selector, prompt picker, model picker.
4. **6.4 Extract Feature** — Extract codex entries / plan chapters / scene beats from AI messages.
5. **6.5 Thread Export & Split View** — Export thread as .md/.txt, split view alongside Plan or Write.

## Recently Completed

- **5.6 Prompt Preview** — `PromptPreviewModal` (3-tab: Messages / Context Blocks / Codex); shows resolved system + user messages, assembled blocks with char counts, included/excluded codex entries with reasons. Triggered from GenerationPanel ("Preview" button).
- **5.5 Presets & Defaults** — Preset save/apply/delete in GenerationPanel; `DefaultsTab` in Settings (account-level defaults per prompt type + persona, stored in localStorage); novel-level overrides in NovelSettingsModal; prompt export (copy as JSON) + import (paste from clipboard) in PromptLibraryTab.
- **5.4 Components & Personas** — `ComponentsSection.tsx` (CRUD with inline preview of `{{component:Name}}` syntax); `PersonasSection.tsx` (CRUD with scope badge); persona assignment in NovelSettingsModal (with per-type prompt overrides).
- **5.3 Template Engine** — `src/lib/ai/template-engine.ts`: `resolvePrompt()` assembles all enabled context blocks in order, resolves `{{component:name}}` then `{{variable}}` placeholders, prepends persona, returns `{messages, contextBlocks, resolvedSystem}`. Integrated into GenerationPanel replacing hardcoded prompts.
- **5.2 Prompt Editor** — `PromptEditor.tsx` with 5 tabs: General (name, type badge, model config multi-select, description), Instructions (textarea + insert-variable/component popover), Context (ordered toggle list with up/down), Inputs (CRUD with dialog, types: text/textarea/dropdown/toggle), Model Settings (temperature + max tokens overrides).
- **5.1 Prompt Library UI** — `PromptLibraryTab.tsx` two-panel layout; `PromptLibraryTab` sub-tabs (Prompts / Components / Personas); 8 built-in default prompts seeded via `seedDefaultPrompts()` in main.tsx; search + type filter; prompt CRUD + duplicate.

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
- Prompt system: `resolvePrompt()` in `template-engine.ts` is the single entry point for all AI generation. Resolves context blocks, `{{component:name}}`, `{{variable}}` in that order, then prepends persona. GenerationPanel now calls `resolvePrompt` instead of hardcoded prompts.
- Account-level defaults stored in localStorage under `opencrafter:account-defaults`. Novel-level overrides stored in `novel.settings.*PromptId` fields.
- Built-in prompts seeded via `seedDefaultPrompts()` at app startup (idempotent — checks for existing readOnly prompts first).
