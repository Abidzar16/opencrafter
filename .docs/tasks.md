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

- [x] Grid view layout: acts as column groups, chapters as sub-groups, scenes as cards
- [x] Scene card component (title, summary excerpt, POV badge, word count, label chips)
- [x] Scene card dimension configurator (height + width sliders, persisted per-user in localStorage)
- [x] Configurable card field visibility (toggle which fields show on cards: word count, POV, labels, codex tags)
- [x] Codex mention badges on cards (placeholder until Codex module; count only, populated in Phase 3)
- [x] Keyword search bar in top nav filtering scene cards (searches title, summary, beats, labels)

### 1.3 Outline View

- [x] Outline view: linear flat list grouped by act → chapter → scene
- [x] Scene summary inline edit in outline view
- [x] Beat list display per scene in outline (expandable)
- [x] Collapse/expand act and chapter sections

### 1.4 Scene Details Panel

- [x] Scene detail side panel (opens on scene card click or from action menu)
- [x] Fields: title, subtitle, summary (textarea), beats list editor, POV character (dropdown, character codex entries only — wired up in Phase 3), word count (read-only, computed), chapter reference
- [x] Beat list editor: add beat, edit beat text inline, reorder beats (drag handle), delete beat
- [x] Label system: label CRUD per novel (name + color picker); assign/remove labels on scenes; label chips on cards
- [x] "Add subtitle" action for scenes and chapters

### 1.5 Scene & Plan Actions

- [x] Scene action menu: rename, duplicate, move, archive, delete, set POV, add subtitle, export scene (basic text), add codex progression (wired in Phase 3)
  - "AI summarize" and "AI detect characters" stubbed out (no-op) until Phase 4
- [x] Chapter action menu: rename, add subtitle, duplicate, move, archive, delete
- [x] Act action menu: rename, duplicate, archive, delete

### 1.6 Create from Outline

- [x] "Create from Outline" panel at bottom of Plan view (collapsible)
- [x] Text parser: `#` → act, `##` → chapter, plain paragraphs → scene summaries
- [x] Preview step (show parsed structure before committing)
- [x] Append to existing novel (does not replace existing acts/chapters)
- [x] Preset template picker (8 templates: 3 Act Structure, Save the Cat, Hero's Journey, Freytag's Pyramid, Dan Harmon's Story Circle, Fichtean Curve, Derek Murphy's 24 Chapters, Story Clock)
  - Each template ships as a pre-filled text in the import format
- [x] Custom template support (user can type or paste any `#`/`##` formatted text)

---

## Phase 2 — Write Module

> Depends on Phase 1 (scene structure must exist). Tiptap extensions are the highest-risk items — start Beat and Section nodes early.

### 2.1 Tiptap Editor Core `[BLOCKER]`

- [x] Install Tiptap v3 + StarterKit + required extensions
- [x] `src/components/editor/Editor.tsx` — core Tiptap wrapper; takes `sceneId` prop; loads content from Dexie on mount
- [x] Content persistence: on every editor `update` event, debounce 800ms → save Tiptap JSON to `scene_content` table
- [x] Word count plugin: live word count tracked via CharacterCount extension, synced back to `scenes.wordCount` field on save
- [x] Chapter switcher (top of editor): dropdown listing all chapters in the novel; switches active scene/chapter view
- [x] Scene divider: rendered between scenes within the same chapter; style configurable (line, asterisks, blank space, custom string)
- [x] Multi-scene view: load and render all scenes of the active chapter sequentially, each separated by the scene divider

### 2.2 Custom Tiptap Extensions `[BLOCKER]`

- [x] **`Beat` node extension** (`src/components/editor/extensions/beat-node.tsx`)
  - Block node (not inline)
  - Visual style: distinct background/border, label "Beat"
  - Content: plain text (beat instruction)
  - Stored in Tiptap JSON; rendered as NodeView in React
  - Slash menu trigger: `/beat`
- [x] **`Section` node extension** (`src/components/editor/extensions/section-node.tsx`)
  - Block node wrapping other content
  - Properties: color (user-selectable from a palette), label (optional text)
  - Renders as a colored left-border block or background tint
  - Visible as colored segment on story timeline
  - Slash menu trigger: `/section`
- [x] **`SlashMenu` extension** (`src/components/editor/extensions/slash-menu.tsx`)
  - Triggered by `/` at the start of a line
  - Uses `@tiptap/suggestion` plugin; renders with tippy.js + custom React list
  - Menu items: Insert Beat, Insert Section (Add Codex Progression + Quick Create — Phase 3)
  - Filter items as user types after `/`
- [x] **`CodexHighlight` mark extension** (`src/components/editor/extensions/codex-highlight.ts`) — shell only; full implementation in Phase 3
  - Mark that underlines text and stores `entryId` attribute
  - Hover card (Tooltip/Popover) shows entry name and description excerpt

### 2.3 Editor UI

- [x] Format menu bar: paragraph style selector, text alignment, scene divider style; inline formatting buttons
- [x] Inline formatting: bold, italic, underline, strikethrough (standard Tiptap StarterKit)
- [x] Paragraph styles: heading levels H1–H3, blockquote
- [x] Focus mode toggle: hide all chrome (sidebar, topbar, format bar, panels) — show only prose area; Esc or button to exit
- [x] Scene details panel (right side): scene number, live word count, POV character, chapter summary field, quick actions (version history, copy scene text, open in plan)
- [x] Story timeline (right-margin sidebar):
  - Vertical strip representing full manuscript
  - Each scene as a proportionally-sized clickable segment
  - Current scene highlighted
  - Click to jump to scene

### 2.4 Autosave Infrastructure `[CROSS-CUTTING]`

- [x] `useDebouncedSave(fn, delay)` hook — generic debounce + save status tracking (`src/lib/hooks/use-debounced-save.ts`)
- [x] Wire `save-indicator.tsx` (from Phase 0) to actual save status: saving/saved/error
- [x] Scene content and scene summary saves wired to this hook

### 2.5 Revision History — Write `[CROSS-CUTTING]`

- [x] `useRevision(entityType, entityId)` hook — saves snapshot to `revisions` table before overwrite (`src/lib/hooks/use-revision.ts`)
  - Prune old revisions: keep last 50 per entity (already in useCreateRevision)
- [x] Wire revision tracking to scene content saves (in Editor.tsx — snapshots current DB content before overwrite)
- [x] Wire revision tracking to scene summary saves (in SceneInfoPanel.tsx)
- [x] Open revision history modal from scene action menu ("Version history") — wired in scene-card.tsx and scene-row.tsx

---

## Phase 3 — Codex Module

> Depends on Phase 2 (editor must be up for highlights + progressions). Codex is also needed by Phase 4 for AI context.

### 3.1 Codex Entry Management

- [x] Codex sidebar panel (`src/components/codex/CodexSidebar.tsx`)
  - Groups entries by type (Character, Location, Object/Item, Lore, Subplot, Other)
  - Collapsible type sections
  - Search/filter bar (searches name, aliases, tags)
  - "New Entry" button (opens entry editor)
- [x] Codex entry editor (`src/components/codex/EntryEditor.tsx`)
  - Tabbed: General | Relations | Tracking | Progressions
  - General tab: name, aliases (chip input), description (Tiptap), notes (Tiptap), details (key/value), tags, cover image, category
- [x] Codex entry CRUD: create, edit, delete (with confirmation), duplicate
- [x] Tags: free-form, multi-value, used for search
- [x] Codex Details (key/value pairs): add, edit, reorder (up/down), delete
- [x] Codex entry cover image upload (same `image-upload.tsx` component)
- [x] Revision history for codex entry description (same `useRevision` hook)
- [x] Revision history for codex entry notes

### 3.2 Codex Detection Engine `[BLOCKER for 3.3]`

> This is a non-trivial NLP concern. Keep it separate from Tiptap so it can be tested in isolation.

- [x] `src/lib/codex-detector/index.ts` — regex alternation, sorted by length, case-insensitive by default, auto-plurals (s/es/ies), exclusion list, alias support
- [x] Unit tests (17 passing) — overlapping matches, aliases, exclusions, case, plurals, word boundaries
- [x] `useTrackedEntries(novelId)` hook — memoized, re-runs on entry changes

### 3.3 Codex Highlights in Editor

- [x] `codex-detection-plugin.ts` — ProseMirror DecorationSet plugin; debounces via requestIdleCallback; dispatches meta-transaction so autosave is not triggered; maps decorations through doc changes
- [x] Hover card (`CodexHoverCard.tsx`) — portal-based, mouseover on `[data-entry-id]`, shows name/type/description excerpt, "Open entry" link
- [x] Mention count tracking — `onMentionCounts` callback updates `codex_entries.mentionCount` after each pass
- [ ] Mention heatmap on codex entry page (deferred — needs scene-level word counts per entry)

### 3.4 Tracking & AI Context Modes

- [x] Tracking tab in `EntryEditor`: toggle, case-sensitive toggle, exclusion list chips, AI context mode selector (4 options), NeverInclude warning badge
- [x] `buildAIContext(novelId, sceneId, selectedText, manualEntries)` → `src/lib/ai/context-builder.ts`
  - Hard-filters NeverInclude; AlwaysInclude; IncludeWhenDetected via detector; NotWhenDetected; manualEntryIds override
  - Progressions applied filtered by scene order ≤ current scene
  - `renderContextBlocks()` helper formats blocks for AI prompt injection

### 3.5 Codex Progressions

- [x] Progression creation from Write slash menu (`/codex progression` → ProgressionPicker dialog)
  - Dialog: entry picker, mode selector, optional detail field link, content textarea
  - Saved with current sceneId as anchor via `OPEN_PROGRESSION_PICKER_EVENT` custom DOM event
- [x] Progressions tab in EntryEditor: list with inline edit/delete per progression
- [x] Inline progression badge (`ProgressionBadge.tsx`) at scene header; tooltip lists all progressions at that scene
- [x] Scene ordering via `scenes.order` — progressions are position-aware
- [x] Wire progressions into `buildAIContext` (filtered by scene order)

### 3.6 Codex Relations

- [x] Relations tab in entry editor: add typed link to another entry
- [x] Relation type: free-text or choose from preset list ("parent of", "child of", "ally of", "enemy of", "married to", "member of", …)
- [x] Bidirectional: creating A→B relation auto-creates B→A backlink (shown on B's relations tab as "incoming")
- [ ] Referenced entry can be pulled into AI context via relation (manual checkbox in context selector) — deferred to Phase 6

### 3.7 Quick Create & Pinning

- [x] Quick Create: `/new codex entry` in slash menu opens a minimal creation modal (name + type + description) without leaving the editor; auto-wires to current scene's codex associations
- [x] Sidebar pinning: "Pin" button on Codex sidebar keeps it visible alongside the main editor (CSS split-panel layout)
- [x] Codex entry associations on scene: track which entries are associated with each scene (stored in `scenes.codexAssociations[]`); shown as badges on scene cards

---

## Phase 4 — AI Layer

> Depends on Phase 3 (context builder needs Codex). No UI AI features work until this phase is done.

### 4.1 Provider Infrastructure `[BLOCKER]`

- [x] `src/lib/ai/providers/types.ts` — `AIProvider` interface: `{ name, complete(request): AsyncIterable<StreamChunk>, supportsStreaming, supportsThinking }`
- [x] `src/lib/ai/stream.ts` — `ReadableStream` → `AsyncIterable<string>` via SSE parsing; handles `data: [DONE]` terminator; handles JSON chunk parsing for both OpenAI and Anthropic formats
- [x] `src/lib/ai/providers/openai.ts` — OpenAI provider: streaming chat completions; handles `gpt-*` and any OpenAI-compatible endpoint
- [x] `src/lib/ai/providers/anthropic.ts` — Anthropic provider: uses `/api/anthropic-proxy/` nginx route; handles `claude-*`; supports extended thinking parameter
- [x] `src/lib/ai/providers/groq.ts` — Groq (OpenAI-compatible, different base URL)
- [x] `src/lib/ai/providers/ollama.ts` — Ollama (`/api/chat` endpoint, user-configured base URL, no API key)
- [x] `src/lib/ai/providers/lmstudio.ts` — LM Studio (OpenAI-compatible, user-configured base URL)
- [x] `src/lib/ai/providers/openrouter.ts` — OpenRouter (OpenAI-compatible, `https://openrouter.ai/api/v1`)
- [x] `src/lib/ai/providers/generic.ts` — Generic OpenAI-compatible (any user-supplied base URL + key)
- [x] `src/lib/ai/index.ts` — provider registry: maps `Provider` enum value → provider instance; resolves API key from Dexie at call time

### 4.2 API Key Management

- [x] `api_keys` Dexie table hooks (already schemed in Phase 0; implement UI now)
- [x] Settings page → "AI Connections" tab
  - List of configured providers (show which are active vs unconfigured)
  - Add/edit/delete key per provider
  - For local providers (Ollama, LM Studio): endpoint URL field instead of key
  - "Test connection" button — makes a minimal API call (e.g., list models) and shows success/error
- [x] Key reference system: `model_configs` stores `apiKeyRef` (the `api_keys.id`), not the key itself; key is looked up at call time
- [x] Warn if a model config references a missing/deleted API key

### 4.3 Model Collections

- [x] Model collections CRUD (Settings page → "Model Collections" tab)
  - User custom collections (system read-only deferred to Phase 5 with built-in prompts)
- [x] Per-model config fields: provider, model ID, API key ref, temperature, top-p, max tokens
- [ ] Model collection assignment UI in prompt editor (Phase 5) and at generation time — deferred to Phase 5
- [x] Thinking/reasoning mode toggle per model config (when provider = Anthropic): toggle + budget tokens input

### 4.4 Streaming Prose Generation

- [x] Beat completion generation flow via slash menu "Generate from beat" → GenerationPanel sheet
- [x] `useGenerateStream(request, onChunk, onDone, onError)` hook — manages AbortController, `useAIStore.generationStatus`, cleanup
- [x] Abort/stop button visible during streaming
- [x] Text replacement flow via "Rewrite" button in EditorToolbar (visible when text is selected)
- [x] Apply / Apply as section / Retry / Discard action buttons in GenerationPanel
- [x] Error handling: surface API errors as toasts with actionable messages

### 4.5 "Never Include" Enforcement

- [x] `filterNeverIncludeEntries(entries)` — hard filter applied in `buildAIContext` before ANY provider call
- [x] Test coverage: 13 tests covering NeverInclude enforcement in `context-builder.test.ts`
- [x] `debugBuildAIContext()` utility — returns included blocks + excluded entries with reasons (used by Phase 5 Prompt Preview)

---

## Phase 5 — Prompt System

> Depends on Phase 4. The prompt system is what makes AI generation flexible and user-customizable.

### 5.1 Prompt Library UI

- [x] Prompt library page (Settings → "Prompt Library"): two-panel layout (left: list; right: detail editor)
- [x] Prompt list: grouped by type, searchable by name, filterable by type
- [x] Prompt CRUD: create (pick type first), edit, delete (with confirmation), duplicate
- [ ] Prompt grouping: assign prompts to named submenus (for cleaner dropdowns in generation UI)
- [x] Ship with a set of built-in default prompts for all 4 types (ready to use on first run):
  - Scene Beat Completion: "Continue the scene from the beat below…"
  - Scene Summarization: "Summarize the following scene in ~80 words…"
  - Text Replacement (x3): Expand, Shorten, Increase Tension
  - Workshop Chat: General brainstorming, Character interview, Plot troubleshooter

### 5.2 Prompt Editor (5 tabs)

- [x] **General tab**: name, type (locked after create), assigned model collections (multi-select), description (helper text shown to users in generation UI)
- [x] **Instructions tab**: system prompt textarea with placeholder variable syntax (e.g., `{{scene_summary}}`, `{{codex_context}}`); insert-component picker button
- [x] **Context tab**: checklist of context blocks to include (scene content, scene summary, beats, prior text, codex, snippets); drag to reorder; per-block toggle
- [x] **Inputs tab**: define dynamic user-facing input fields
  - Add/edit/delete fields
  - Field types: text, textarea, dropdown (with options list), toggle
  - Default value per field
  - `key` (used as `{{key}}` placeholder in instructions)
- [x] **Model Settings tab**: temperature, max tokens (override model collection defaults for this prompt)

### 5.3 Prompt Template Engine `[BLOCKER for generation]`

- [x] `src/lib/ai/template-engine.ts` — resolves a prompt at generation time:
  - Substitutes `{{variable}}` placeholders with: context blocks, prompt input values, codex context, scene data
  - Assembles final message array (`[{role: "system", content: ...}, {role: "user", content: ...}]`)
  - Respects context block ordering from prompt config
- [x] Integration with `buildAIContext` from Phase 3: codex context block is assembled and injected as a resolved placeholder

### 5.4 Prompt Components & Personas

- [x] Prompt components CRUD (Settings → "Prompt Library" → "Components" section)
  - System read-only components (e.g., "Writing Style Guide", "Show Don't Tell Rule")
  - User custom components
  - Each component: name + content (text)
- [x] Insert-component picker in prompt instructions tab (inserts `{{component:name}}` placeholder; resolved at generation time)
- [x] Prompt personas CRUD (Settings → "Prompt Library" → "Personas" section)
  - Fields: name, instructions text
  - Scope: account-level (default) or novel-level (overrides account)
- [x] Persona assignment: novel settings → "AI Persona" dropdown; applied prepended to all system prompts for that novel

### 5.5 Presets & Defaults

- [x] Prompt presets CRUD (saved combination of prompt + model collection + input defaults)
  - Create preset from current generation UI state ("Save as preset")
  - One-click apply in generation UI
- [x] Default prompts: Settings → "Defaults" tab
  - Account-level defaults for each prompt type (Scene Beat, Summarization, Text Replacement, Workshop Chat)
  - Novel-level overrides (in novel settings)
- [x] Prompt export: "Copy to clipboard" button exports prompt as JSON string
- [x] Prompt import: "Import from clipboard" in prompt library; parses JSON → creates new prompt

### 5.6 Prompt Preview

- [x] "Preview assembled prompt" button in generation UI and prompt editor
  - Opens modal showing full resolved prompt (system + user messages, context blocks expanded, variables substituted)
  - Clearly marks which codex entries are included/excluded and why (e.g., "filtered: Never include")

---

## Phase 6 — Chat Module

> Depends on Phase 4 (streaming) + Phase 5 (prompt system).

### 6.1 Thread Management

- [x] Chat thread sidebar (left panel in Chat mode): list of threads for current novel
- [x] Thread CRUD: create (auto-name "Thread 1", "Thread 2", …), rename (double-click), pin (stays at top), archive, delete
- [x] Archived threads: collapsed "Archived" section at bottom of list; restore or permanently delete
- [x] "New chat" shortcut button

### 6.2 Chat Interface

- [x] Message list component: renders user messages (plain text) and AI messages (markdown rendered)
  - Use `react-markdown` or similar for AI message rendering (code blocks, lists, bold/italic)
- [x] Streaming token display: show AI response character-by-character as it streams; cursor indicator
- [x] Stop generation button (visible during streaming)
- [x] Message timestamps (shown on hover)
- [x] Copy message button (copy raw text to clipboard)
- [x] Delete message button (remove from thread; with confirmation for AI message that has follow-ups)
- [x] Regenerate last AI message button

### 6.3 Context Selector & Message Bar

- [x] Context selector panel (above message input, expandable):
  - Novel text section: "Full novel text" toggle + POV character filter; or specific act/chapter/scene checkboxes
  - Snippets section: multi-select snippets
  - Codex section: filter by type / category / tag; multi-select individual entries
- [x] Context pills below input showing what's attached (click to remove)
- [x] Prompt picker: swap active Workshop Chat prompt (dropdown of all Workshop Chat type prompts)
- [x] Model picker: select model collection + individual model
- [ ] Prompt inputs panel: shows dynamic input fields from the active prompt (hide if no inputs)
- [x] Message submit (Enter or button); Shift+Enter for newline in input

### 6.4 Extract Feature

- [x] "Extract" button on AI messages
- [x] Extract modal with 3 targets:
  - **Codex Entries**: parse format `Name (aliases) [tags]: Description` from AI text; show parsed entries preview; checkbox to select which to create/overwrite; bulk create on confirm
  - **Plan Chapters**: parse `#`/`##` format (same as Create from Outline) → append to Plan; preview step
  - **Scene Beats**: outputs formatted beat text → copy to clipboard or paste into active Write editor
- [ ] "Extract" also available from Snippet content

### 6.5 Thread Export & Split View

- [x] Export thread: "Export conversation" action → download as `.md` or `.txt` file
- [x] Copy full conversation: copy all messages as formatted text to clipboard
- [x] Split view: split view toggle button in chat header; `chatSplitView` state in UIStore (CSS panel split when active)

---

## Phase 7 — Snippets & Import/Export

### 7.1 Snippets

- [x] Snippets sidebar panel (`src/components/snippets/SnippetsSidebar.tsx`)
  - List of snippets for current novel
  - Search by name and tags
  - "New snippet" button
- [x] Snippet editor: name (input), tags (chip input), content (Tiptap editor, same extensions as Write minus slash menu)
- [x] Snippet CRUD: create, edit, delete, duplicate
- [x] Tags: filter snippets by tag
- [x] Revision history for snippet content (wire `useRevision` hook, same as scene content)
- [x] Sidebar pinning (same behavior as Codex sidebar)
- [x] Snippets in Chat context selector: select snippets to attach as context (already scaffolded in Phase 6 context selector)

### 7.2 Import

- [x] Import UI: `src/components/import/ImportWizard.tsx` — file picker → parse → preview → confirm
  - Available from: novel creation dialog ("Import from file") + Plan view action menu ("Import / add content")
- [x] DOCX import (`mammoth`):
  - Parse heading structure: H1 → Act, H2 → Chapter, H3+ → Scene title, body → Scene content/summary
  - Map parsed structure to `acts`/`chapters`/`scenes` rows
  - Preview: show parsed tree before import
- [x] Markdown import (manual line parser):
  - Same heading → act/chapter/scene mapping as DOCX
  - Preserve paragraph text as scene content
- [x] Import mode options: "Create new novel" or "Append to existing novel"

### 7.3 Export

- [x] Export sidebar panel / Export button in sidebar navigation
- [x] Export configuration UI: select which acts/chapters to include, export format, front matter options
- [x] DOCX export (`docx` npm package):
  - Full manuscript in heading-structured Word document
- [x] Markdown export:
  - Full manuscript with `#`/`##`/`###` heading structure
  - Scene dividers as `---`
- [x] Scrivener export (`.scriv`):
  - Custom XML builder; output a valid `.scriv` folder structure in ZIP
  - Acts → Folders, Chapters → Sub-folders, Scenes → `.txt` files
  - Binder XML reflecting hierarchy
- [ ] Per-scene export from scene action menu (plain text or Markdown, single scene only)
- [ ] Revision history for custom prompt instructions (wire `useRevision` hook)

---

## Phase 8 — Polish

> These tasks improve the experience after all core features are working. Matrix view and Series are functionally significant; PWA and accessibility are non-negotiable before any public release.

### 8.1 Matrix View

- [x] Matrix view layout: scenes as columns, configurable rows — add as a third tab in Plan mode
- [x] Row type selector ("Show" menu): Codex Entries (default), POV, Labels, Subplots
- [x] Codex Entries rows: cell shows a dot/badge if the entry appears in that scene; click cell to toggle association
- [x] POV row: each cell shows POV character; click to change (inline dropdown)
- [x] Labels row: each cell shows label chip; click to toggle label
- [x] Subplots row: show subplot codex entries as rows; track presence across scenes
- [x] TanStack Virtual for large matrices (100+ scenes × 100+ entries)
- [x] Horizontal scroll with frozen first column (row label)

### 8.2 Series Support

- [x] Series home screen (`/series/$seriesId`): grid of novels in the series, series settings
- [x] Series codex (separate from individual novel codex): shared across all novels in series
  - Uses `codex_entries` with `novelId = '', seriesId = seriesId`; DB version 2 adds `seriesId` index
  - Series codex accessible from series home screen (CodexSidebar with virtual novelId)
  - Entries available as context in any novel belonging to the series
- [x] Series codex in `buildAIContext`: include series codex entries subject to same `aiContextMode` rules

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
