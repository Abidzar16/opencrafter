# Opencrafter — Status

**Last updated:** 2026-06-06
**Phase:** 8 — Polish (8.4 & 8.5 complete)

---

## Right Now

Between tasks — last completed **8.5 Responsive Layout**.

## Next Up

1. **8.6 Accessibility** — Keyboard nav audit, ARIA labels, color contrast, keyboard shortcuts.
2. **7.3 remaining** — Per-scene export from scene action menu; revision history for prompt instructions.
3. **Cross-Cutting Testing** — Unit + component tests (codex-detector, template-engine, context-builder, stream, library, plan grid, codex editor, chat).

## Recently Completed

- **8.5 Responsive Layout** — `NovelShell`: icon strip hidden at `< 640px` (`max-sm:hidden`), hamburger button opens Sheet drawer with sidebar icons; mode switcher collapses to DropdownMenu at `< 640px`; side panels (Codex/Snippets) hidden below 900px (`max-[900px]:hidden`). Write page: `infoPanelOpen` defaults to `false` when `window.innerWidth < 900`; StoryTimeline wrapped in `max-[900px]:hidden`. Grid view: `flex-col` at mobile, `flex-row sm:` for horizontal scroll at sm+. Chat: ThreadSidebar hidden at `max-sm:hidden` with PanelLeft toggle in top bar; prompt/model pickers row uses `flex-wrap`.
- **8.4 Cover Images** — `src/lib/image-compress.ts`: canvas-based `compressImage()` using `createObjectURL` + `HTMLImageElement` + canvas `toDataURL` (WebP preferred, JPEG fallback); portrait default 800×1200 @ 80%, square default 400×400 @ 80%. `ImageUpload` component: removes raw FileReader path, calls `compressImage` async, shows spinner during compression, surfaces errors. `src/lib/hooks/use-storage-quota.ts`: checks `navigator.storage.estimate()` on mount, shows persistent sonner warning toast at ≥ 80% usage with "Export backup" action button, throttled via localStorage (7-day dismiss). Wired into `__root.tsx`.
- **8.3 PWA & Performance** — `vite-plugin-pwa` + Workbox service worker; SVG icon; PWA manifest; `index.html` theme-color; CodexSidebar TanStack Virtual (> 100 entries); gzip compression for large scene_content (> 50 KB); `useSceneContentDecoded` hook; Editor + StoryTimeline use decoded hook.
- **8.2 Series Support** — `/series/$seriesId` route; DB v2 `seriesId` index on `codex_entries`; series codex in `buildAIContext`.

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
- Chat module: `src/components/chat/` — ChatView, ThreadSidebar, MessageList, MessageBubble, MessageBar, ContextSelector, ExtractModal. `src/lib/ai/chat-context.ts` — `buildChatContext()` + `resolveChatSystemPrompt()`. `chatSelectedPromptId`, `chatSelectedConfigId`, `chatSplitView` added to UIStore. `useUpdateChatMessage` added to chat DB hooks.
- Chat streaming: accumulated text tracked via `accumulatedRef` (not state) — avoids closure staleness. AI message saved to DB in `onDone` callback after stream completes.
- react-markdown v10 + remark-gfm v4 installed for AI message markdown rendering.
- `pnpm build` fails due to pre-existing `tsconfig.app.json` `ignoreDeprecations: "6.0"` flag issue (not related to Phase 6 work). `pnpm typecheck` (`tsc --noEmit`) passes clean.
- PWA: `vite-plugin-pwa` v1.3 with Workbox. SVG icon at `public/icon.svg`. Manifest injected by plugin (not a static file). `index.html` has theme-color meta `#09090b`.
- Compression: `src/lib/db/compression.ts` uses browser `CompressionStream`/`DecompressionStream` APIs. Threshold: 50 KB. `_compressed?: Uint8Array` field on `SceneContent` type. Use `useSceneContentDecoded` (not `useSceneContent`) in rendering components; raw hook is for direct DB access only.
- Image compression: `src/lib/image-compress.ts` uses canvas API. Portrait (novel covers) → max 800×1200 @ 80% quality. Square (codex avatars) → max 400×400 @ 80% quality. WebP preferred; falls back to JPEG. `ImageUpload` component handles compression async with loading spinner.
- Storage quota: `useStorageQuotaWarning` hook in `src/lib/hooks/use-storage-quota.ts`. Fires once on mount via `navigator.storage.estimate()`. Warn threshold 80%. Dismiss throttled 7 days via `opencrafter:storage-warn-dismissed` localStorage key.
- Responsive: `max-sm:hidden` on icon sidebar (hamburger Sheet replaces it at mobile). `max-[900px]:hidden` on Codex/Snippets panels. Mode switcher uses DropdownMenu at `< 640px`. Write page panels default closed at `window.innerWidth < 900`. Grid view stacks vertically at mobile (`flex-col sm:flex-row`). Chat ThreadSidebar collapsible via PanelLeft toggle; hidden `max-sm:` with hamburger fallback in NovelShell sheet.
