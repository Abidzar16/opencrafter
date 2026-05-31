# tasks.md — Opencrafter

> **Derived from:** `requirements.md` + `plan.md`
> **Purpose:** Ordered, actionable task list for building the full application. Tasks are sequenced by dependency — each phase's output unlocks the next.

---

## How to read this file

- `[ ]` — not started
- `[x]` — done
- `[~]` — in progress
- **`[BLOCKER]`** — completing this task unblocks a large portion of subsequent work; prioritize if stuck
- **`[CROSS-CUTTING]`** — infrastructure used by many later features; design generically from the start
- Sub-bullets under a task are implementation notes, not separate tasks

---

## Phase 0 — Foundation

> Goal: A running app in Docker with routing, a database schema, and an empty novel library. Everything else builds on this.

### 0.1 Project Scaffolding `[BLOCKER]`

- [x] Initialize pnpm workspace: `pnpm create vite opencrafter --template react-ts`
- [x] Configure TypeScript (`tsconfig.json`): strict mode, path aliases (`@/` → `src/`)
- [x] Install and configure Tailwind CSS v4
- [x] Install and configure shadcn/ui (set up `components.json`, install base components: Button, Dialog, DropdownMenu, Popover, Tooltip, Sheet, Tabs, Badge, Input, Textarea, Select, Separator, ScrollArea)
- [x] Configure ESLint (flat config, `eslint-config-prettier`, `@typescript-eslint`)
- [x] Configure Prettier (`.prettierrc`)
- [x] Configure Vitest (`vitest.config.ts`, setup file, coverage)
- [x] Add Lucide React
- [x] Add `clsx` + `tailwind-merge` → export as `cn()` utility

### 0.2 Domain Types `[BLOCKER]`

> Define all TypeScript interfaces before implementing any feature. These live in `src/types/` and are the contract between the DB, stores, and components.

- [x] `src/types/novel.ts` — Novel, Series, NovelSettings
- [x] `src/types/structure.ts` — Act, Chapter, Scene (with full field set: title, summary, beats, povCharacterId, labels, wordCount, order, archived)
- [x] `src/types/codex.ts` — CodexEntry, CodexDetail, CodexRelation, CodexProgression, CodexType enum, AiContextMode enum, TrackingSettings
- [x] `src/types/prompt.ts` — Prompt, PromptType enum, PromptComponent, PromptPersona, PromptPreset, PromptInput, ModelConfig, ModelCollection
- [x] `src/types/ai.ts` — Provider enum, ApiKey, GenerationRequest, GenerationResult, StreamChunk
- [x] `src/types/chat.ts` — ChatThread, ChatMessage, ChatRole enum, ContextAttachment
- [x] `src/types/snippet.ts` — Snippet
- [x] `src/types/revision.ts` — Revision, RevisionEntityType enum
- [x] `src/types/label.ts` — Label
- [x] `src/types/index.ts` — re-export all types

### 0.3 Dexie Schema & Hooks `[BLOCKER]`

- [x] Install Dexie.js v4
- [x] `src/lib/db/schema.ts` — Dexie class definition with all tables and indexes matching plan §3
  - Tables: novels, series, acts, chapters, scenes, scene_content, codex_entries, codex_relations, codex_progressions, snippets, chat_threads, chat_messages, prompts, prompt_components, prompt_personas, prompt_presets, model_configs, api_keys, revisions, labels
  - Add compound indexes for common queries: `[novelId+order]` on acts/chapters/scenes, `[novelId+type]` on codex_entries
- [x] `src/lib/db/index.ts` — export singleton DB instance
- [x] Schema migration strategy: version 1 baseline, document how to add v2 migrations without breaking existing data
- [x] Dexie CRUD hooks for `novels` (`useNovels`, `useNovel`, `useCreateNovel`, `useUpdateNovel`, `useDeleteNovel`)
- [x] Dexie CRUD hooks for `acts`, `chapters`, `scenes` (same pattern)
- [x] Dexie CRUD hooks for `scene_content` (`useSceneContent`, `useSaveSceneContent`)
- [x] Dexie CRUD hooks for `codex_entries`, `codex_relations`, `codex_progressions`
- [x] Dexie CRUD hooks for `snippets`, `chat_threads`, `chat_messages`
- [x] Dexie CRUD hooks for `prompts`, `prompt_components`, `prompt_personas`, `prompt_presets`, `model_configs`, `api_keys`
- [x] Dexie CRUD hooks for `revisions`, `labels`
- [x] `useOrderedItems` utility hook — reusable drag-and-drop order persistence (updates `order` field on a list of items)

### 0.4 UI Infrastructure `[CROSS-CUTTING]`

- [x] Toast notification system (`src/components/ui/toast-provider.tsx` wrapping shadcn Sonner or custom)
  - Variants: success, error, info, warning
  - `useToast()` hook
- [x] Confirmation dialog component (`src/components/ui/confirm-dialog.tsx`)
  - Props: title, description, confirmLabel, onConfirm, destructive flag
  - Used for all delete/archive/overwrite actions
- [x] Kebab action menu component (`src/components/ui/action-menu.tsx`)
  - Generic: takes `actions[]` array with label, icon, onClick, destructive flag
  - All major entities use this pattern
- [x] Empty state component (`src/components/ui/empty-state.tsx`)
  - Props: icon, title, description, optional call-to-action
- [x] Loading spinner + skeleton components
- [x] Cover image upload component (`src/components/ui/image-upload.tsx`)
  - Reads file → converts to base64/Blob → stores in Dexie
  - Used for novels and codex entries
- [x] Revision history modal (`src/components/ui/revision-history-modal.tsx`) `[CROSS-CUTTING]`
  - Props: entityType, entityId
  - Lists past versions with timestamps, preview pane, restore button
  - Reads from `revisions` table via `useLiveQuery`

### 0.5 TanStack Router & App Shell `[BLOCKER]`

- [x] Install TanStack Router v1, configure file-based routing
- [x] Root route (`src/routes/__root.tsx`): provides DB context, Zustand context, toast provider
- [x] Routes:
  - `/` — Novel library
  - `/novel/$novelId` — Novel shell (layout with sidebar + topbar)
  - `/novel/$novelId/plan` — Plan module
  - `/novel/$novelId/write` — Write module
  - `/novel/$novelId/chat` — Chat module
  - `/novel/$novelId/review` — Review placeholder
  - `/settings` — Global settings (API keys, model collections, prompt library)
  - `*` — 404 page
- [x] Zustand stores (`src/stores/`):
  - `useUIStore` — sidebar visibility, active panel, modal states, focus mode
  - `useEditorStore` — active novel/act/chapter/scene, cursor position
  - `useAIStore` — generation status, active stream, abort controller
- [x] Three-region layout component (`src/components/layout/novel-shell.tsx`)
  - Left sidebar (icons: Codex, Snippets, Prompt Library, Export)
  - Top navigation bar (mode switcher: Plan / Write / Chat / Review; view selector; keyword filter)
  - Main panel
  - Sidebar collapse/expand behavior
- [x] Mode switcher component (Plan/Write/Chat/Review tabs in top bar)
- [x] Novel navigation header (top-left: back to library, novel settings button, collapse sidebar)
- [x] Autosave indicator component (`src/components/layout/save-indicator.tsx`)
  - States: idle/saving/saved/error with visual feedback
  - Subscribe to `useUIStore.saveStatus`

### 0.6 Novel Library

- [x] Novel library page (`/`) with responsive cover grid
- [x] Create novel dialog (title, optional cover image, optional series assignment)
- [x] Novel card component (cover image, title, last-edited timestamp, "shared" badge placeholder)
- [x] Novel settings modal (title, description, cover image, persona assignment, default prompts)
- [x] Delete novel with confirmation (permanent; warn about data loss)
- [x] Archive novel; archived novels tab in library
- [x] Series grouping: series header row in library grid, novels grouped under their series
- [x] Series CRUD (basic: create, rename, delete series; full series home screen deferred to Phase 8)

### 0.7 Data Backup & Docker

- [x] **Export all data as JSON** — one-click backup of entire IndexedDB to a `.json` file
  - Iterate all Dexie tables, serialize to JSON, trigger browser download
  - This is a safety feature: IndexedDB wipe = total loss
- [x] **Import from JSON backup** — restore all tables from a backup file (with clear warning: overwrites all current data)
- [x] `Dockerfile` (multi-stage: Node 22 builder → nginx:alpine serve)
- [x] `nginx.conf` — SPA routing (all paths → `index.html`), optional Anthropic CORS proxy block
- [x] `docker-compose.yml` — `ENABLE_ANTHROPIC_PROXY` env var gates the proxy
- [x] `nginx.conf` Anthropic proxy block: `location /api/anthropic-proxy/ { proxy_pass https://api.anthropic.com/; }` (only added when env var is true)
- [x] `.github/workflows/ci.yml` — lint, typecheck, Vitest on push/PR

---

## Phase 1 — Plan Module

> Depends on Phase 0. Goal: a usable story structure board before any writing or AI features exist.

### 1.1 Story Structure CRUD

- [x] Act creation (inline "Add Act" button at end of list)
- [x] Chapter creation (inline inside act, "Add Chapter")
- [x] Scene creation (inline inside chapter, "Add Scene")
- [x] Inline rename for acts, chapters, scenes (click title to edit in-place)
- [x] Duplicate act (deep copy: act + all children)
- [x] Duplicate chapter (deep copy: chapter + all scenes)
- [x] Duplicate scene (copy scene metadata + content)
- [x] Archive act / chapter / scene (hidden from main view, restorable)
- [x] Archived items view (toggle to show archived; restore or permanently delete from there)
- [x] Permanently delete act / chapter / scene (with confirmation dialog)
- [x] Move scene between chapters (drag-and-drop and/or action menu → "Move to chapter…" picker)
- [x] Move chapter between acts
- [x] Drag-and-drop scene reorder within chapter (`@dnd-kit/core`)
- [x] Drag-and-drop chapter reorder within act
- [x] Drag-and-drop act reorder

### 1.2 Grid View (Kanban)

- [ ] Grid view layout: acts as column groups, chapters as sub-groups, scenes as cards
- [ ] Scene card component (title, summary excerpt, POV badge, word count, label chips)
- [ ] Scene card dimension configurator (height + width sliders, persisted per-user in localStorage)
- [ ] Configurable card field visibility (toggle which fields show on cards: word count, POV, labels, codex tags)
- [ ] Codex mention badges on cards (placeholder until Codex module; count only, populated in Phase 3)
- [ ] Keyword search bar in top nav filtering scene cards (searches title, summary, beats, labels)

### 1.3 Outline View

- [ ] Outline view: linear flat list grouped by act → chapter → scene
- [ ] Scene summary inline edit in outline view
- [ ] Beat list display per scene in outline (expandable)
- [ ] Collapse/expand act and chapter sections

### 1.4 Scene Details Panel

- [ ] Scene detail side panel (opens on scene card click or from action menu)
- [ ] Fields: title, subtitle, summary (textarea), beats list editor, POV character (dropdown, character codex entries only — wired up in Phase 3), word count (read-only, computed), chapter reference
- [ ] Beat list editor: add beat, edit beat text inline, reorder beats (drag handle), delete beat
- [ ] Label system: label CRUD per novel (name + color picker); assign/remove labels on scenes; label chips on cards
- [ ] "Add subtitle" action for scenes and chapters

### 1.5 Scene & Plan Actions

- [ ] Scene action menu: rename, duplicate, move, archive, delete, set POV, add subtitle, export scene (basic text), add codex progression (wired in Phase 3)
  - "AI summarize" and "AI detect characters" stubbed out (no-op) until Phase 4
- [ ] Chapter action menu: rename, add subtitle, duplicate, move, archive, delete
- [ ] Act action menu: rename, duplicate, archive, delete

### 1.6 Create from Outline

- [ ] "Create from Outline" panel at bottom of Plan view (collapsible)
- [ ] Text parser: `#` → act, `##` → chapter, plain paragraphs → scene summaries
- [ ] Preview step (show parsed structure before committing)
- [ ] Append to existing novel (does not replace existing acts/chapters)
- [ ] Preset template picker (8 templates: 3 Act Structure, Save the Cat, Hero's Journey, Freytag's Pyramid, Dan Harmon's Story Circle, Fichtean Curve, Derek Murphy's 24 Chapters, Story Clock)
  - Each template ships as a pre-filled text in the import format
- [ ] Custom template support (user can type or paste any `#`/`##` formatted text)

---

## Phase 2 — Write Module

> Depends on Phase 1 (scene structure must exist). Tiptap extensions are the highest-risk items — start Beat and Section nodes early.

### 2.1 Tiptap Editor Core `[BLOCKER]`

- [ ] Install Tiptap v2 + StarterKit + required extensions
- [ ] `src/components/editor/Editor.tsx` — core Tiptap wrapper; takes `sceneId` prop; loads content from Dexie on mount
- [ ] Content persistence: on every editor `update` event, debounce 800ms → save Tiptap JSON to `scene_content` table
- [ ] Word count plugin: live word count tracked in `useEditorStore`, synced back to `scenes.wordCount` field on save
- [ ] Chapter switcher (top of editor): dropdown listing all chapters in the novel; switches active scene/chapter view
- [ ] Scene divider: rendered between scenes within the same chapter; style configurable (line, asterisks, blank space, custom string)
- [ ] Multi-scene view: load and render all scenes of the active chapter sequentially, each separated by the scene divider

### 2.2 Custom Tiptap Extensions `[BLOCKER]`

- [ ] **`Beat` node extension** (`src/components/editor/extensions/beat-node.ts`)
  - Block node (not inline)
  - Visual style: distinct background/border, label "Beat"
  - Content: plain text (beat instruction)
  - Stored in Tiptap JSON; rendered as NodeView in React
  - Slash menu trigger: `/beat`
- [ ] **`Section` node extension** (`src/components/editor/extensions/section-node.ts`)
  - Block node wrapping other content
  - Properties: color (user-selectable from a palette), label (optional text)
  - Renders as a colored left-border block or background tint
  - Visible as colored segment on story timeline
  - Slash menu trigger: `/section`
- [ ] **`SlashMenu` extension** (`src/components/editor/extensions/slash-menu.ts`)
  - Triggered by `/` at the start of a line
  - Uses `@tiptap/extension-mention` as the base; override rendering with shadcn Popover
  - Menu items: Insert Beat, Insert Section, Add Codex Progression (Phase 3), Quick Create Codex Entry (Phase 3)
  - Filter items as user types after `/`
- [ ] **`CodexHighlight` mark extension** (`src/components/editor/extensions/codex-highlight.ts`) — shell only; full implementation in Phase 3
  - Mark that underlines text and stores `entryId` attribute
  - Hover card (Tooltip/Popover) shows entry name and description excerpt

### 2.3 Editor UI

- [ ] Format menu bar: font family selector, font size, paragraph spacing, paragraph width (max-width of prose area), text alignment, scene divider style
- [ ] Inline formatting: bold, italic, underline, strikethrough (standard Tiptap StarterKit)
- [ ] Paragraph styles: heading levels H1–H3, blockquote
- [ ] Focus mode toggle: hide all chrome (sidebar, topbar, format bar, panels) — show only prose area; Esc or button to exit
- [ ] Scene details panel (right side): scene number, live word count, POV character (read-only, links to codex), chapter summary field, quick actions (set POV, add subtitle, duplicate scene, export scene, AI summarize stub, AI detect characters stub, "chat with scene" link)
- [ ] Story timeline (right-margin sidebar):
  - Vertical strip representing full manuscript
  - Each scene as a proportionally-sized clickable segment
  - Colored segments for Section nodes within scenes
  - Current scroll position highlighted
  - Click to jump to scene

### 2.4 Autosave Infrastructure `[CROSS-CUTTING]`

- [ ] `useDebouncedSave(fn, delay)` hook — generic debounce + save status tracking
- [ ] Wire `save-indicator.tsx` (from Phase 0) to actual save status: saving/saved/error
- [ ] Save all editable text fields across the app using this hook (scene content, scene summary, codex entries, snippets, prompts, etc.)

### 2.5 Revision History — Write `[CROSS-CUTTING]`

- [ ] `useRevision(entityType, entityId)` hook — saves snapshot to `revisions` table before overwrite
  - Called by `useDebouncedSave` when content changes
  - Prune old revisions: keep last 50 per entity (configurable)
- [ ] Wire revision tracking to scene content saves
- [ ] Wire revision tracking to scene summary saves
- [ ] Open revision history modal from scene action menu ("Version history")

---

## Phase 3 — Codex Module

> Depends on Phase 2 (editor must be up for highlights + progressions). Codex is also needed by Phase 4 for AI context.

### 3.1 Codex Entry Management

- [ ] Codex sidebar panel (`src/components/codex/CodexSidebar.tsx`)
  - Groups entries by type (Character, Location, Object/Item, Lore, Subplot, Other)
  - Collapsible type sections
  - Collapsible user-defined categories within types
  - Search/filter bar (searches name, aliases, tags)
  - "New Entry" button (opens entry editor)
- [ ] Codex entry editor (`src/components/codex/EntryEditor.tsx`)
  - Tabbed: General | Relations | Tracking | Progressions
  - General tab: name, aliases (comma-separated chip input), description (Tiptap editor), notes (Tiptap editor), details (key/value list), tags (chip input), cover image upload, category assignment
  - Character entries only: show "POV-eligible" badge (no extra fields, just the type constraint)
- [ ] Codex entry CRUD: create, edit, delete (with confirmation), duplicate
- [ ] Categories: create/rename/delete per type group; assign entries to categories
- [ ] Tags: free-form, multi-value, used for search and matrix filtering
- [ ] Codex Details (key/value pairs): add, edit, reorder, delete detail rows; details can have their own progressions (wired in §3.5)
- [ ] Codex entry cover image upload (same `image-upload.tsx` component)
- [ ] Revision history for codex entry description (same `useRevision` hook)
- [ ] Revision history for codex entry notes

### 3.2 Codex Detection Engine `[BLOCKER for 3.3]`

> This is a non-trivial NLP concern. Keep it separate from Tiptap so it can be tested in isolation.

- [ ] `src/lib/codex-detector/index.ts` — given a string of text and a list of `{entryId, name, aliases, trackingSettings}`, return all match positions `{start, end, entryId}`
  - Multi-pattern: match all tracked entry names and aliases in a single pass (Aho-Corasick or simple sorted regex alternation)
  - Case-insensitive by default; respect `caseSensitive` toggle per entry
  - Auto-pluralisation: for each name/alias, also match the simple English plural (append `s` / `es` / `ies` rules)
  - Exclusion list: filter out matches that overlap with excluded phrases per entry
  - Handle aliases: entry "Jon" with alias "Jonathan" — both match
- [ ] Unit tests for the detection engine (edge cases: overlapping matches, aliases, exclusions, case, plurals)
- [ ] `useTrackedEntries(novelId)` hook — returns all codex entries with tracking enabled for a given novel; memoized, re-runs only when entries change

### 3.3 Codex Highlights in Editor

- [ ] Wire `CodexHighlight` mark extension (shell from Phase 2) to the detection engine
  - On `editor.on('update')`: debounce 1000ms → run detector over current doc text → compute diff vs existing marks → apply add/remove mark transactions (use ProseMirror decorations, not content mutations, to avoid revision triggers)
  - Clear all CodexHighlight marks when tracking is disabled for an entry
- [ ] Hover card for highlighted text: Popover on hover shows entry name, type badge, description excerpt (first 120 chars), "Open entry" link
- [ ] Mention count tracking: after each detection pass, count mentions per entry → update `codex_entries.mentionCount` (debounced, not blocking)
- [ ] Mention heatmap on codex entry page: horizontal bar chart showing mention count per scene; click scene to navigate

### 3.4 Tracking & AI Context Modes

- [ ] Tracking tab in codex entry editor:
  - Toggle tracking on/off
  - Case-sensitive toggle
  - Exclusion list input (comma-separated phrases)
  - AI context mode selector (4 options: Always include / Include when detected / Don't include when detected / Never include)
  - "Never include" mode: add warning badge on entry ("This entry is never sent to AI")
- [ ] `buildAIContext(novelId, sceneId, selectedText, manualEntries)` function (`src/lib/ai/context-builder.ts`) `[CROSS-CUTTING]`
  - Inputs: novelId, current sceneId, selected text or beat, manually attached entries
  - Logic:
    1. Fetch all codex entries for the novel
    2. Filter out `Never include` entries (hard gate — these never reach any AI call)
    3. Include `Always include` entries
    4. Run detector on selected text/beat → include entries where name is detected (`Include when detected`)
    5. Include manually-attached entries (from chat context selector, etc.)
    6. Apply codex progressions: for each included entry, filter progressions to only those at or before `sceneId` position; merge into entry description
    7. Return ordered context block array

### 3.5 Codex Progressions

- [ ] Progression creation from Write slash menu (`/codex progression` → picker)
  - Picker lists all codex entries; select entry → choose mode (addition / replacement) → enter content → optionally link to a detail field
  - Progression is saved with current `sceneId` as its anchor
- [ ] Progression list on codex entry "Progressions" tab: shows all progressions ordered by scene position; inline edit/delete
- [ ] Inline progression annotations in Write interface (small badge at the scene where progression is anchored; tooltip shows what changed)
- [ ] Scene ordering: `scenes.order` field is used to determine "at or before" — progressions are position-aware, not time-aware
- [ ] Wire progressions into `buildAIContext` (see §3.4)

### 3.6 Codex Relations

- [ ] Relations tab in entry editor: add typed link to another entry
- [ ] Relation type: free-text or choose from preset list ("parent of", "child of", "ally of", "enemy of", "married to", "member of", …)
- [ ] Bidirectional: creating A→B relation auto-creates B→A backlink (shown on B's relations tab as "incoming")
- [ ] Referenced entry can be pulled into AI context via relation (manual checkbox in context selector)

### 3.7 Quick Create & Pinning

- [ ] Quick Create: `/new codex entry` in slash menu opens a minimal creation modal (name + type + description) without leaving the editor; auto-wires to current scene's codex associations
- [ ] Sidebar pinning: "Pin" button on Codex sidebar keeps it visible alongside the main editor (CSS split-panel layout)
- [ ] Codex entry associations on scene: track which entries are associated with each scene (stored in `scenes.codexAssociations[]`); shown as badges on scene cards

---

## Phase 4 — AI Layer

> Depends on Phase 3 (context builder needs Codex). No UI AI features work until this phase is done.

### 4.1 Provider Infrastructure `[BLOCKER]`

- [ ] `src/lib/ai/providers/types.ts` — `AIProvider` interface: `{ name, complete(request): AsyncIterable<StreamChunk>, supportsStreaming, supportsThinking }`
- [ ] `src/lib/ai/stream.ts` — `ReadableStream` → `AsyncIterable<string>` via SSE parsing; handles `data: [DONE]` terminator; handles JSON chunk parsing for both OpenAI and Anthropic formats
- [ ] `src/lib/ai/providers/openai.ts` — OpenAI provider: streaming chat completions; handles `gpt-*` and any OpenAI-compatible endpoint
- [ ] `src/lib/ai/providers/anthropic.ts` — Anthropic provider: uses `/api/anthropic-proxy/` nginx route; handles `claude-*`; supports extended thinking parameter
- [ ] `src/lib/ai/providers/groq.ts` — Groq (OpenAI-compatible, different base URL)
- [ ] `src/lib/ai/providers/ollama.ts` — Ollama (`/api/chat` endpoint, user-configured base URL, no API key)
- [ ] `src/lib/ai/providers/lmstudio.ts` — LM Studio (OpenAI-compatible, user-configured base URL)
- [ ] `src/lib/ai/providers/openrouter.ts` — OpenRouter (OpenAI-compatible, `https://openrouter.ai/api/v1`)
- [ ] `src/lib/ai/providers/generic.ts` — Generic OpenAI-compatible (any user-supplied base URL + key)
- [ ] `src/lib/ai/index.ts` — provider registry: maps `Provider` enum value → provider instance; resolves API key from Dexie at call time

### 4.2 API Key Management

- [ ] `api_keys` Dexie table hooks (already schemed in Phase 0; implement UI now)
- [ ] Settings page → "AI Connections" tab
  - List of configured providers (show which are active vs unconfigured)
  - Add/edit/delete key per provider
  - For local providers (Ollama, LM Studio): endpoint URL field instead of key
  - "Test connection" button — makes a minimal API call (e.g., list models) and shows success/error
- [ ] Key reference system: `model_configs` stores `apiKeyRef` (the `api_keys.id`), not the key itself; key is looked up at call time
- [ ] Warn if a model config references a missing/deleted API key

### 4.3 Model Collections

- [ ] Model collections CRUD (Settings page → "Model Collections" tab)
  - System read-only collections (e.g., "OpenAI GPT-4o", "Claude Sonnet")
  - User custom collections
- [ ] Per-model config fields: provider, model ID, API key ref, temperature, top-p, max tokens, stop sequences, presence penalty, frequency penalty
- [ ] Model collection assignment UI in prompt editor (Phase 5) and at generation time
- [ ] Thinking/reasoning mode toggle per model config (when provider = Anthropic): toggle + budget tokens input

### 4.4 Streaming Prose Generation

- [ ] Beat completion generation flow:
  1. User selects a beat node in the editor
  2. Slash menu → "Generate prose from beat"
  3. Context panel opens (shows assembled context, allows manual adjustments)
  4. Prompt + model selector
  5. "Generate" → streams tokens into a preview area below the beat node
  6. Four action buttons: **Apply** (insert prose at cursor), **Retry** (discard + re-run), **Discard**, **Section** (wrap in Section node + apply)
- [ ] `useGenerateStream(request, onChunk, onDone, onError)` hook — manages AbortController, `useAIStore.generationStatus`, cleanup
- [ ] Abort/stop button visible during streaming
- [ ] Text replacement flow:
  1. User selects prose text in editor
  2. Toolbar or slash menu → text replacement prompt picker
  3. Same streaming preview + 4 actions as above (replaces the selected text on Apply)
- [ ] Error handling: surface API errors (auth failure, rate limit, network error) as toasts with actionable messages

### 4.5 "Never Include" Enforcement

- [ ] `filterNeverIncludeEntries(entries)` — hard filter applied in `buildAIContext` before ANY provider call
- [ ] Add test coverage: confirm that `Never include` entries never appear in the assembled context object
- [ ] Add a debug/preview utility (used by Prompt Preview in Phase 5) that shows the full assembled context with filtered entries clearly marked as excluded

---

## Phase 5 — Prompt System

> Depends on Phase 4. The prompt system is what makes AI generation flexible and user-customizable.

### 5.1 Prompt Library UI

- [ ] Prompt library page (Settings → "Prompt Library"): two-panel layout (left: list; right: detail editor)
- [ ] Prompt list: grouped by type, searchable by name, filterable by type
- [ ] Prompt CRUD: create (pick type first), edit, delete (with confirmation), duplicate
- [ ] Prompt grouping: assign prompts to named submenus (for cleaner dropdowns in generation UI)
- [ ] Ship with a set of built-in default prompts for all 4 types (ready to use on first run):
  - Scene Beat Completion: "Continue the scene from the beat below…"
  - Scene Summarization: "Summarize the following scene in ~80 words…"
  - Text Replacement (x3): Expand, Shorten, Increase Tension
  - Workshop Chat: General brainstorming, Character interview, Plot troubleshooter

### 5.2 Prompt Editor (5 tabs)

- [ ] **General tab**: name, type (locked after create), assigned model collections (multi-select), description (helper text shown to users in generation UI)
- [ ] **Instructions tab**: system prompt textarea with placeholder variable syntax (e.g., `{{scene_summary}}`, `{{codex_context}}`); insert-component picker button
- [ ] **Context tab**: checklist of context blocks to include (scene content, scene summary, beats, prior text, codex, snippets); drag to reorder; per-block toggle
- [ ] **Inputs tab**: define dynamic user-facing input fields
  - Add/edit/delete fields
  - Field types: text, textarea, dropdown (with options list), toggle
  - Default value per field
  - `key` (used as `{{key}}` placeholder in instructions)
- [ ] **Model Settings tab**: temperature, max tokens (override model collection defaults for this prompt)

### 5.3 Prompt Template Engine `[BLOCKER for generation]`

- [ ] `src/lib/ai/template-engine.ts` — resolves a prompt at generation time:
  - Substitutes `{{variable}}` placeholders with: context blocks, prompt input values, codex context, scene data
  - Assembles final message array (`[{role: "system", content: ...}, {role: "user", content: ...}]`)
  - Respects context block ordering from prompt config
- [ ] Integration with `buildAIContext` from Phase 3: codex context block is assembled and injected as a resolved placeholder

### 5.4 Prompt Components & Personas

- [ ] Prompt components CRUD (Settings → "Prompt Library" → "Components" section)
  - System read-only components (e.g., "Writing Style Guide", "Show Don't Tell Rule")
  - User custom components
  - Each component: name + content (text)
- [ ] Insert-component picker in prompt instructions tab (inserts `{{component:name}}` placeholder; resolved at generation time)
- [ ] Prompt personas CRUD (Settings → "Prompt Library" → "Personas" section)
  - Fields: name, instructions text
  - Scope: account-level (default) or novel-level (overrides account)
- [ ] Persona assignment: novel settings → "AI Persona" dropdown; applied prepended to all system prompts for that novel

### 5.5 Presets & Defaults

- [ ] Prompt presets CRUD (saved combination of prompt + model collection + input defaults)
  - Create preset from current generation UI state ("Save as preset")
  - One-click apply in generation UI
- [ ] Default prompts: Settings → "Defaults" tab
  - Account-level defaults for each prompt type (Scene Beat, Summarization, Text Replacement, Workshop Chat)
  - Novel-level overrides (in novel settings)
- [ ] Prompt export: "Copy to clipboard" button exports prompt as JSON string
- [ ] Prompt import: "Import from clipboard" in prompt library; parses JSON → creates new prompt

### 5.6 Prompt Preview

- [ ] "Preview assembled prompt" button in generation UI and prompt editor
  - Opens modal showing full resolved prompt (system + user messages, context blocks expanded, variables substituted)
  - Clearly marks which codex entries are included/excluded and why (e.g., "filtered: Never include")

---

## Phase 6 — Chat Module

> Depends on Phase 4 (streaming) + Phase 5 (prompt system).

### 6.1 Thread Management

- [ ] Chat thread sidebar (left panel in Chat mode): list of threads for current novel
- [ ] Thread CRUD: create (auto-name "Thread 1", "Thread 2", …), rename (double-click), pin (stays at top), archive, delete
- [ ] Archived threads: collapsed "Archived" section at bottom of list; restore or permanently delete
- [ ] "New chat" shortcut button

### 6.2 Chat Interface

- [ ] Message list component: renders user messages (plain text) and AI messages (markdown rendered)
  - Use `react-markdown` or similar for AI message rendering (code blocks, lists, bold/italic)
- [ ] Streaming token display: show AI response character-by-character as it streams; cursor indicator
- [ ] Stop generation button (visible during streaming)
- [ ] Message timestamps (shown on hover)
- [ ] Copy message button (copy raw text to clipboard)
- [ ] Delete message button (remove from thread; with confirmation for AI message that has follow-ups)
- [ ] Regenerate last AI message button

### 6.3 Context Selector & Message Bar

- [ ] Context selector panel (above message input, expandable):
  - Novel text section: "Full novel text" toggle + POV character filter; or specific act/chapter/scene checkboxes
  - Snippets section: multi-select snippets
  - Codex section: filter by type / category / tag; multi-select individual entries
- [ ] Context pills below input showing what's attached (click to remove)
- [ ] Prompt picker: swap active Workshop Chat prompt (dropdown of all Workshop Chat type prompts)
- [ ] Model picker: select model collection + individual model
- [ ] Prompt inputs panel: shows dynamic input fields from the active prompt (hide if no inputs)
- [ ] Message submit (Enter or button); Shift+Enter for newline in input

### 6.4 Extract Feature

- [ ] "Extract" button on AI messages
- [ ] Extract modal with 3 targets:
  - **Codex Entries**: parse format `Name (aliases) [tags]: Description` from AI text; show parsed entries preview; checkbox to select which to create/overwrite; bulk create on confirm
  - **Plan Chapters**: parse `#`/`##` format (same as Create from Outline) → append to Plan; preview step
  - **Scene Beats**: outputs formatted beat text → copy to clipboard or paste into active Write editor
- [ ] "Extract" also available from Snippet content

### 6.5 Thread Export & Split View

- [ ] Export thread: "Export conversation" action → download as `.md` or `.txt` file
- [ ] Copy full conversation: copy all messages as formatted text to clipboard
- [ ] Split view: "Split left" / "Split right" actions on thread → chat panel opens as a side panel alongside the Plan or Write view (CSS panel split; same Zustand-controlled visibility)

---

## Phase 7 — Snippets & Import/Export

### 7.1 Snippets

- [ ] Snippets sidebar panel (`src/components/snippets/SnippetsSidebar.tsx`)
  - List of snippets for current novel
  - Search by name and tags
  - "New snippet" button
- [ ] Snippet editor: name (input), tags (chip input), content (Tiptap editor, same extensions as Write minus slash menu)
- [ ] Snippet CRUD: create, edit, delete, duplicate
- [ ] Tags: filter snippets by tag
- [ ] Revision history for snippet content (wire `useRevision` hook, same as scene content)
- [ ] Sidebar pinning (same behavior as Codex sidebar)
- [ ] Snippets in Chat context selector: select snippets to attach as context (already scaffolded in Phase 6 context selector)

### 7.2 Import

- [ ] Import UI: `src/components/import/ImportWizard.tsx` — file picker → parse → preview → confirm
  - Available from: novel creation dialog ("Import from file") + Plan view action menu ("Import / add content")
- [ ] DOCX import (`mammoth`):
  - Parse heading structure: H1 → Act, H2 → Chapter, H3+ → Scene title, body → Scene content/summary
  - Map parsed structure to `acts`/`chapters`/`scenes` rows
  - Preview: show parsed tree before import
- [ ] Markdown import (`unified` + `remark`):
  - Same heading → act/chapter/scene mapping as DOCX
  - Preserve paragraph text as scene content
- [ ] Import mode options: "Create new novel" or "Append to existing novel"

### 7.3 Export

- [ ] Export sidebar panel / Export button in sidebar navigation
- [ ] Export configuration UI: select which acts/chapters to include, export format, front matter options
- [ ] DOCX export (`docx` npm package):
  - Full manuscript in heading-structured Word document
  - Respect font/spacing settings from novel settings
- [ ] Markdown export (`unified` + `remark`):
  - Full manuscript with `#`/`##`/`###` heading structure
  - Scene dividers as `---`
- [ ] Scrivener export (`.scriv`):
  - Custom XML builder; output a valid `.scriv` folder structure
  - Acts → Folders, Chapters → Sub-folders, Scenes → `.rtf` or `.txt` files
  - Binder XML reflecting hierarchy
- [ ] Per-scene export from scene action menu (plain text or Markdown, single scene only)
- [ ] Revision history for custom prompt instructions (wire `useRevision` hook)

---

## Phase 8 — Polish

> These tasks improve the experience after all core features are working. Matrix view and Series are functionally significant; PWA and accessibility are non-negotiable before any public release.

### 8.1 Matrix View

- [ ] Matrix view layout: scenes as columns, configurable rows — add as a third tab in Plan mode
- [ ] Row type selector ("Show" menu): Codex Entries (default), POV, Labels, Custom Category, Subplots, Custom (manual)
- [ ] Codex Entries rows: cell shows a dot/badge if the entry appears in that scene; click cell to toggle association
- [ ] POV row: each cell shows POV character; click to change (inline dropdown)
- [ ] Labels row: each cell shows label chip; click to toggle label
- [ ] Subplots row: show subplot codex entries as rows; track presence across scenes
- [ ] TanStack Virtual for large matrices (100+ scenes × 100+ entries)
- [ ] Horizontal scroll with frozen first column (row label)

### 8.2 Series Support

- [ ] Series home screen (`/series/$seriesId`): grid of novels in the series, series settings
- [ ] Series codex (separate from individual novel codex): shared across all novels in series
  - Separate DB table `series_codex_entries` (or `codex_entries` with `novelId = null, seriesId = ?`)
  - Series codex accessible from series home screen
  - Entries available as context in any novel belonging to the series
- [ ] Series codex in `buildAIContext`: include series codex entries subject to same `aiContextMode` rules

### 8.3 PWA & Performance

- [ ] PWA manifest (`manifest.json`): name, icons, theme color, display: standalone
- [ ] Vite PWA plugin (`vite-plugin-pwa`) with Workbox service worker
  - Cache strategy: CacheFirst for static assets, NetworkFirst for HTML
  - Full offline after first load (all JS/CSS/assets cached)
- [ ] Performance profiling: create a test novel with 150 scenes and 200 codex entries; measure:
  - Codex highlight detection pass duration (target: < 200ms)
  - Grid view render time (target: < 100ms first render)
  - Dexie query time for full novel load
- [ ] Codex highlight debouncing: use `requestIdleCallback` (with `setTimeout` fallback) rather than fixed debounce to avoid blocking typing
- [ ] Virtual list for codex sidebar when entry count > 100 (TanStack Virtual)
- [ ] Tiptap JSON compression consideration: if scene_content is large, gzip before Dexie storage

### 8.4 Cover Images

- [ ] Novel cover image: file → compress to max 800×1200px + quality 80% (using canvas API) → base64 → Dexie
- [ ] Codex entry avatar/cover image: compress to max 400×400px → base64 → Dexie
- [ ] Storage quota warning: check `navigator.storage.estimate()` on startup; warn at 80% usage with link to Export All Data

### 8.5 Responsive Layout (Tablet/Mobile)

- [ ] Sidebar: collapse to icon-only at `< 900px`; hide entirely (hamburger toggle) at `< 640px`
- [ ] Top nav: collapse mode switcher + view selector to a dropdown menu at `< 640px`
- [ ] Grid view: reduce to 1-column at `< 640px`
- [ ] Editor: hide story timeline and scene details panel by default at `< 900px`; toggle via buttons
- [ ] Chat: stack context selector below message input at `< 640px`

### 8.6 Accessibility

- [ ] Keyboard navigation audit: every interactive element reachable via Tab; focus indicators visible
- [ ] ARIA labels: all icon-only buttons have `aria-label`; all form fields have associated labels
- [ ] Screen reader test on novel library, plan grid, and editor
- [ ] Color contrast: all text meets WCAG AA (4.5:1 for normal text, 3:1 for large text)
- [ ] Add primary keyboard shortcuts (document in settings / help):
  - `Ctrl+S` — manual save trigger
  - `Ctrl+/` — toggle focus mode (Write)
  - `Ctrl+K` — open command palette (optional, stretch goal)
  - `Ctrl+Z` / `Ctrl+Shift+Z` — undo/redo (Tiptap built-in)

---

## Cross-Cutting: Testing (woven throughout)

> Write tests as features are implemented, not after.

- [ ] Unit tests: `src/lib/codex-detector/` — full coverage of match, alias, plural, exclusion, case-sensitivity edge cases
- [ ] Unit tests: `src/lib/ai/template-engine.ts` — variable substitution, context block ordering, missing variable handling
- [ ] Unit tests: `src/lib/ai/context-builder.ts` — `Never include` enforcement is covered by at least 3 test cases
- [ ] Unit tests: `src/lib/ai/stream.ts` — SSE parsing for OpenAI and Anthropic stream formats
- [ ] Component tests: Novel library (create, rename, delete novel)
- [ ] Component tests: Plan Grid view (add scene, reorder, archive)
- [ ] Component tests: Codex entry editor (all tabs)
- [ ] Component tests: Chat thread (send message, streaming display, extract)
- [ ] Integration test: full generation flow with a mock provider (beat → stream → apply to editor)
- [ ] E2E (Playwright, optional but valuable): create novel → add scenes → generate prose → save → reload → content persists

---

## Parking Lot (Deferred / Stretch)

> These are valid features that should not block any phase but can be picked up when bandwidth allows.

- [ ] Review mode (placeholder route exists; content TBD — could be a grammar/style check powered by AI)
- [ ] Apple Pages import (low priority; `mammoth` only handles DOCX)
- [ ] PDF export (`@react-pdf/renderer`)
- [ ] Atticus export (requires format research)
- [ ] Name generator (out of scope per requirements §14 but easy to add as a local utility)
- [ ] Command palette (`Ctrl+K`) — fuzzy search over scenes, codex entries, prompts, actions
- [ ] Novel word count goal + progress bar (target word count on novel settings; progress ring on library card)
- [ ] Dark/light/system theme toggle (Tailwind + `next-themes` or CSS custom properties)
- [ ] NSFW model connection gating (settings toggle that reveals NSFW provider configs; no UI impact unless enabled)
- [ ] Series Codex sharing (requires multi-user; fully out of scope for single-user build)
