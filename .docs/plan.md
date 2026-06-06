# plan.md — Opencrafter

> **Scope:** Offline-first, single-user, React SPA served from Docker (nginx). No backend API, no server database. All data lives in the browser via IndexedDB. Collaboration dropped from scope.
>
> **Status:** All phases 0–8 complete as of 2026-06-06.

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────┐
│  Docker container (nginx)                        │
│  ┌───────────────────────────────────────────┐   │
│  │  React SPA (static build)                 │   │
│  │                                           │   │
│  │  ┌─────────────┐   ┌────────────────────┐ │   │
│  │  │  Zustand    │   │  Dexie.js          │ │   │
│  │  │  (UI state) │◄──│  (IndexedDB ORM)   │ │   │
│  │  └─────────────┘   └────────────────────┘ │   │
│  │         │                   │              │   │
│  │  ┌──────▼──────────────────▼────────────┐ │   │
│  │  │  Tiptap editor  │  AI fetch layer    │ │   │
│  │  │  (ProseMirror)  │  (user API keys)   │ │   │
│  │  └─────────────────┴────────────────────┘ │   │
│  └───────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
         │ port 80/443
         ▼
    User browser
```

**Key constraints:**
- AI calls go **directly from the browser** to AI provider APIs (OpenAI, Anthropic, etc.) using user-supplied keys. No proxy server needed.
- All persistence is IndexedDB via Dexie.js. Data never leaves the device unless the user exports or calls an AI API.
- "Offline-first" is inherent: there is no network dependency for the app to function. AI features degrade gracefully when offline.

---

## 2. Tech Stack

### 2.1 Core

| Concern | Choice | Rationale |
|---|---|---|
| Language | **TypeScript 5** (strict, `@/` → `src/`) | Type safety across the complex domain model (Codex, Prompts, etc.) |
| Framework | **React 18** | Widest library coverage; Tiptap, Dexie, shadcn all have first-class React support |
| Build tool | **Vite 6** | Fast HMR, excellent PWA plugin, native ESM |
| Package manager | **pnpm** | Fast, strict, monorepo-ready |

### 2.2 UI

| Concern | Choice | Rationale |
|---|---|---|
| Component library | **shadcn/ui** (New York style, zinc base, umbrella `radix-ui` package) | Unstyled primitives (Radix) + Tailwind; fully owned, no vendor lock-in |
| Styling | **Tailwind CSS v4** | Co-located styles, no stylesheet overhead |
| Icons | **Lucide React** | Consistent, tree-shakable |
| Drag & drop | **@dnd-kit/core** + **@dnd-kit/sortable** + **@dnd-kit/utilities** | Modern, accessible; needed for scene reordering in Grid/Matrix views |
| Kanban / Grid | Custom on `@dnd-kit` | Novelcrafter's grid is domain-specific enough that a generic kanban lib won't fit |

### 2.3 Rich Text Editor

**Choice: Tiptap v3 (ProseMirror)**

Installed at v3.24.0 (latest). Tiptap is the right call because:
- Native React integration
- Custom marks for codex highlighting (underline + hover tooltip)
- Node views for Beat blocks and Section blocks (colored inline containers)
- Streaming AI output inserts cleanly via `editor.chain().insertContent(chunk)`
- Active development, MIT license

Custom Tiptap extensions (all implemented in `src/components/editor/extensions/`):
- `CodexHighlight` mark — underlines detected codex entry names, attaches hover card. Implemented as ProseMirror `DecorationSet` plugin (`codex-detection-plugin.ts`); uses `requestIdleCallback` (setTimeout fallback) with 50 ms lead time; dispatches meta-transaction with key `CODEX_DETECTION_META`.
- `Beat` node — inline beat instruction block (distinct from prose)
- `Section` node — colored wrapper block for alternatives/kitbashing
- `SlashMenu` — `/` trigger built on `@tiptap/suggestion` + tippy.js popup; items: Beat, Section, Codex Progression

### 2.4 Local Persistence

**Choice: Dexie.js v4 (IndexedDB)**

- Clean TypeScript API over IndexedDB
- Reactive queries via `useLiveQuery` hook (auto re-renders on DB change)
- Transaction support for atomic multi-table writes (e.g., create scene + revision history entry atomically)
- Schema versioning for migrations as the data model evolves
- No size limits beyond browser storage quotas (~1GB+ on modern browsers)

Dexie replaces a backend ORM. Every feature that would normally hit a REST API hits Dexie instead.

Large `scene_content` records are transparently compressed using the browser `CompressionStream`/`DecompressionStream` APIs (threshold: 50 KB). Components use `useSceneContentDecoded` — not the raw hook — to get decompressed content. DB singleton lives in `src/lib/db/db.ts` to prevent circular imports.

### 2.5 State Management

**Choice: Zustand v5**

- Lightweight, no boilerplate
- Three stores: `ui-store` (panel visibility, active scene, plan view, chat state), `editor-store` (active scene ID used by SceneInfoPanel), `ai-store` (generation status)
- Dexie `useLiveQuery` owns all persisted data — Zustand never duplicates it
- This separation is critical: Zustand is ephemeral (cleared on reload), Dexie is durable
- Account-level prompt defaults stored in localStorage (`opencrafter:account-defaults`); plan card config stored in localStorage (`opencrafter:plan-card-config`)

### 2.6 Routing

**Choice: TanStack Router v1**

- File-based routing; route files live in `src/routes/` (not `src/app/`). Vite plugin + `pnpm exec tsr generate` produces `src/routeTree.gen.ts`.
- Full TypeScript type safety on route params (`$novelId`, `$seriesId`)
- Route paths use exact string literals (no template literals) for type safety
- Nested layouts: `__root.tsx` → `novel.$novelId.tsx` (shell) → mode routes

### 2.7 AI Integration

All AI calls are standard `fetch` from the browser to provider APIs. No backend proxy.

```
AI Layer (src/lib/ai/)
├── providers/
│   ├── types.ts             # Shared provider interfaces
│   ├── openai.ts            # OpenAI & compatible endpoints
│   ├── anthropic.ts         # Anthropic (via opt-in nginx CORS proxy)
│   ├── groq.ts              # Groq (OpenAI-compatible)
│   ├── ollama.ts            # Local Ollama (http://localhost:11434)
│   ├── lmstudio.ts          # Local LM Studio
│   ├── openrouter.ts        # OpenRouter multi-model gateway
│   └── generic.ts           # Generic OpenAI-compatible endpoint
├── context-builder.ts       # buildAIContext() — assembles codex/scene context for prompts
├── chat-context.ts          # buildChatContext() + resolveChatSystemPrompt()
├── default-prompts.ts       # seedDefaultPrompts() — idempotent built-in prompt seeding at startup
├── template-engine.ts       # resolvePrompt() — resolves {{component:name}}, {{variable}}, persona
├── stream.ts                # ReadableStream → async iterator (SSE parsing)
└── index.ts                 # Provider registry, key lookup from Dexie
```

API keys are stored in Dexie (IndexedDB), never in localStorage (slightly more secure, same origin). For Ollama/LM Studio, no key needed — just an endpoint URL.

**Streaming:** `ReadableStream` with `TextDecoder` → SSE parsing → Tiptap `insertContent` chunk by chunk. Chat streaming uses an `accumulatedRef` (not state) to avoid closure staleness; AI message written to DB in `onDone` callback.

**CORS caveat for Anthropic:** Anthropic's API does not allow direct browser calls (no CORS header). The nginx config includes an optional CORS proxy for `api.anthropic.com`, disabled by default. Users enable it via an env var in `docker-compose.yml`:

```yaml
environment:
  - ENABLE_ANTHROPIC_PROXY=true
```

Users who don't need Claude models see no impact. OpenRouter is a zero-config alternative.

### 2.8 Export / Import

| Format | Library |
|---|---|
| DOCX export | `docx` (npm) |
| DOCX import | `mammoth` |
| Markdown import/export | `unified` + `remark` |
| Scrivener export | Custom XML builder (no library; `.scriv` is a known format) |
| PDF export | `@react-pdf/renderer` (deferred — optional, lower priority) |
| JSON backup | Custom — iterates all Dexie tables; lives in `src/lib/backup/` |

### 2.9 Testing

| Layer | Tool |
|---|---|
| Unit / logic | **Vitest v4** (latest) |
| Component | **@testing-library/react** + `userEvent` |
| E2E (optional) | **Playwright** (not implemented) |

Test setup (`src/test/setup.ts`) mocks `ResizeObserver` and `scrollIntoView` for JSDOM/Radix UI compatibility. Use `userEvent.setup()` + `await user.click()` for Radix Tabs — `fireEvent` alone doesn't flush the RAF that drives Radix Presence.

### 2.10 Docker

```dockerfile
# Build stage
FROM node:22-alpine AS builder
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile && pnpm build

# Serve stage
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY nginx-entrypoint.sh /docker-entrypoint.d/40-opencrafter.sh
EXPOSE 80
```

`nginx.conf` handles SPA routing (all paths → `index.html`) and optionally acts as a CORS proxy for Anthropic. `nginx-entrypoint.sh` conditionally enables the proxy block based on `ENABLE_ANTHROPIC_PROXY`.

### 2.11 PWA

`vite-plugin-pwa` v1.3 with Workbox generates a service worker for full offline support after first load. SVG icon at `public/icon.svg`. Manifest injected by plugin (not a static file). `index.html` carries `theme-color: #09090b`.

---

## 3. Data Model (Dexie Schema)

```typescript
// Core tables (Dexie schema)
novels:          id, title, coverImage, seriesId, createdAt, updatedAt, settings
acts:            id, novelId, title, order, archived
chapters:        id, actId, novelId, title, order, summary, archived
scenes:          id, chapterId, novelId, title, summary, beats, povCharacterId,
                 labels, wordCount, order, archived
scene_content:   id (= sceneId), content (Tiptap JSON as Record<string, unknown>),
                 _compressed? (Uint8Array — set when content exceeds 50 KB)

codex_entries:   id, novelId, type, name, aliases, description, notes,
                 details (JSON), tags, coverImage, color, trackingSettings, aiContextMode
codex_relations: id, fromId, toId, relationType
codex_progressions: id, entryId, sceneId, novelId, mode, content, detailKey

snippets:        id, novelId, name, content (Tiptap JSON as Record<string, unknown>), tags
chat_threads:    id, novelId, name, pinned, archived
chat_messages:   id, threadId, role, content, contextSnapshot, createdAt

prompts:         id, name, type, instructions, contextConfig, inputs (JSON),
                 modelSettings, groupId, readOnly
prompt_components: id, name, content
prompt_personas: id, name, instructions, scope
prompt_presets:  id, promptId, name, modelConfig, inputDefaults
model_configs:   id, name, provider, modelId, apiKeyRef, temperature, ...
api_keys:        id, provider, key (stored as-is; user responsibility)

revisions:       id, entityType, entityId, content, createdAt
labels:          id, novelId, name, color
series:          id, name, coverImage
```

Key compound indexes: `[novelId+order]` on acts/chapters/scenes; `[novelId+type]` on codex_entries.

Codex `type` is an enum: `character | location | object | lore | subplot | other`.

Tiptap JSON content fields (`scene_content.content`, `codex_entries.description/notes`, `snippets.content`) are typed as `Record<string, unknown>` — compatible with Dexie's structured-clone storage.

---

## 4. Project Structure

```
src/
├── routes/                  # TanStack Router file-based routes (generated: routeTree.gen.ts)
│   ├── __root.tsx           # App shell with toast provider
│   ├── $.tsx                # 404 catch-all
│   ├── index.tsx            # Novel library (root)
│   ├── novel.$novelId.tsx   # Novel shell layout (NovelShell)
│   ├── novel.$novelId.index.tsx
│   ├── novel.$novelId.plan.tsx
│   ├── novel.$novelId.write.tsx
│   ├── novel.$novelId.chat.tsx
│   ├── novel.$novelId.review.tsx
│   ├── series.$seriesId.tsx
│   └── settings.tsx
├── components/
│   ├── editor/              # Tiptap v3 + custom extensions
│   │   └── extensions/      # beat-node, section-node, slash-menu, codex-highlight, codex-detection-plugin
│   ├── plan/                # PlanBoard, GridView, MatrixView, OutlineView, SceneDetailPanel
│   ├── codex/               # CodexSidebar, EntryEditor, ProgressionPicker, QuickCreateCodexDialog
│   ├── chat/                # ChatView, ThreadSidebar, MessageList, MessageBar, ContextSelector, ExtractModal
│   ├── settings/            # PromptEditor, PromptLibraryTab, AIConnectionsTab, ModelCollectionsTab, DefaultsTab
│   ├── export/              # ExportPanel
│   ├── import/              # ImportWizard
│   ├── library/             # NovelLibrary, NovelCard, CreateNovelDialog, SeriesSection
│   ├── layout/              # NovelShell, SaveIndicator
│   ├── series/              # SeriesHome
│   ├── snippets/            # SnippetsSidebar, SnippetEditor
│   └── ui/                  # shadcn/ui re-exports + shared primitives (ActionMenu, ConfirmDialog, RevisionHistoryModal, etc.)
├── lib/
│   ├── db/                  # schema.ts (Dexie class) + hooks/ (CRUD for every table)
│   ├── ai/                  # Provider adapters + stream + template-engine + context-builder + chat-context
│   ├── backup/              # export.ts (full JSON backup) + import.ts (restore from JSON)
│   ├── export/              # build-manuscript.ts, docx-exporter.ts, markdown-exporter.ts, scrivener-exporter.ts, tiptap-to-text.ts
│   ├── import/              # parse-structure.ts (DOCX/MD heading structure → acts/chapters/scenes)
│   ├── codex-detector/      # Name/alias regex matching; returns match positions for Tiptap decorations
│   ├── hooks/               # useDebouncedSave, useRevision, useGenerateStream, useStorageQuotaWarning
│   └── image-compress.ts    # Canvas-based compression: portrait (800×1200 @ 80%) + square (400×400 @ 80%), WebP preferred
├── stores/                  # Zustand: ui-store.ts, editor-store.ts, ai-store.ts
├── types/                   # TypeScript interfaces: novel, structure, codex, prompt, ai, chat, snippet, revision, label
└── main.tsx
```

---

## 5. Phased Implementation Plan

Collaboration is dropped. NSFW gating, billing, and courses are out of scope (per requirements §14).

### Phase 0 — Foundation ✓
- [x] Vite + React + TypeScript + Tailwind + shadcn/ui scaffold
- [x] TanStack Router: library route + novel shell routes
- [x] Dexie schema v1: novels, acts, chapters, scenes, scene_content
- [x] Novel library (grid of covers, create/delete novel)
- [x] **One-click "Export all data as JSON" backup** (IndexedDB wipe = total data loss; this is a safety feature)
- [x] Docker build + nginx config with opt-in Anthropic CORS proxy (`ENABLE_ANTHROPIC_PROXY` env var)
- [x] CI: lint + typecheck + Vitest

### Phase 1 — Plan Module ✓
- [x] Act/Chapter/Scene CRUD with drag-and-drop reorder (dnd-kit)
- [x] Grid view (kanban-style scene cards)
- [x] Outline view (linear list)
- [x] Scene detail panel (title, summary, beats, POV, labels)
- [x] Label system (color-coded, per-novel)
- [x] Archive/restore acts, chapters, scenes
- [x] Create from Outline importer (text → acts/chapters/scenes)
- [x] Preset story structure templates

### Phase 2 — Write Module ✓
- [x] Tiptap editor with scene content persistence
- [x] Beat node extension + Section node extension
- [x] Scene dividers, chapter switcher
- [x] Format controls (font, spacing, width, alignment)
- [x] Focus mode
- [x] Scene details panel (right side — SceneInfoPanel)
- [x] Story timeline (right margin overview, proportional word-count segments)
- [x] Slash menu (`/` commands via `@tiptap/suggestion` + tippy.js)
- [x] Revision history (scene content + summary; pruned to last 50 per entity)

### Phase 3 — Codex Module ✓
- [x] Codex entry CRUD (all 6 types)
- [x] Categories, tags, aliases, relations
- [x] Codex Details (key/value pairs)
- [x] Tracking toggle + AI context modes (4 modes)
- [x] `CodexHighlight` Tiptap mark (ProseMirror `DecorationSet` plugin + hover card)
- [x] Codex Progressions (scene-anchored overrides; addition + replacement modes)
- [x] Quick Create from Write interface
- [ ] Mentions heatmap / count — **deferred** (tracking count present in sidebar; full heatmap visualization out of scope for now)

### Phase 4 — AI Layer ✓
- [x] Provider registry (OpenAI, Anthropic via proxy, Groq, Ollama, LM Studio, OpenRouter, generic OpenAI-compatible)
- [x] API key management UI
- [x] Model Collections
- [x] Streaming prose generation (beat → prose, into Tiptap)
- [x] Text replacement prompts (select text → rewrite)
- [x] "Never include" codex enforcement (enforced in `buildAIContext` before any fetch)
- [ ] Thinking/reasoning mode toggle — **deferred** (provider types support it; UI toggle not implemented)

### Phase 5 — Prompt System ✓
- [x] Prompt library UI (all 4 prompt types)
- [x] Prompt Components (reusable fragments)
- [x] Prompt Personas
- [x] Prompt Presets
- [x] Prompt Inputs (dynamic fields: text, textarea, dropdown, toggle)
- [x] Default prompts (account-level + novel-level overrides)
- [x] Prompt preview (fully resolved via `resolvePrompt()` before sending)
- [x] Prompt grouping (`groupId` field; submenus in picker dropdowns)
- [x] Built-in prompts seeded at startup (`seedDefaultPrompts()`, idempotent)
- [ ] Prompt import/export (clipboard format) — **deferred**

### Phase 6 — Chat Module ✓
- [x] Multi-thread chat per novel
- [x] Context selector (attach scenes, codex entries, snippets, full novel text)
- [x] Streaming chat responses (with markdown rendering via `react-markdown` + `remark-gfm`)
- [x] Extract feature (AI output → Codex entries / Plan acts-chapters / Beats)
- [x] Thread archive, pin
- [x] Prompt inputs panel in chat (dynamic fields from selected Workshop Chat prompt)
- [x] Extract from Snippet content

### Phase 7 — Snippets + Import/Export ✓
- [x] Snippets CRUD with revision history
- [x] DOCX import (mammoth → acts/chapters/scenes via heading structure)
- [x] Markdown import
- [x] Full novel DOCX export
- [x] Markdown export
- [x] Scrivener export

### Phase 8 — Polish ✓
- [x] Responsive layout (tablet/mobile — hamburger Sheet, `max-sm:hidden` on sidebar, collapsed mode switcher at <640 px, write panels default closed at <900 px)
- [x] Matrix view (implemented with codex-entry / POV / label rows; TanStack Virtual deferred for very large datasets)
- [x] Codex sidebar pinning
- [x] Cover image uploads (novels + codex entries; canvas compression, WebP preferred)
- [x] Series support (grouping novels; series home screen)
- [x] PWA manifest + service worker (`vite-plugin-pwa` v1.3 + Workbox)
- [x] Accessibility (shadcn/ui zinc tokens meet WCAG AA; ARIA labels on all interactive elements)
- [x] Performance (codex detection debounced via `requestIdleCallback`; TanStack Virtual for long lists)
- [x] Storage quota warning (fires once on mount at 80% threshold; dismissed 7 days via localStorage)
- [x] Content compression (CompressionStream for large scene_content records)

---

## 6. Key Risks & Mitigations

| Risk | Impact | Resolution |
|---|---|---|
| Tiptap codex highlight performance on large documents | High | **Resolved:** ProseMirror `DecorationSet` plugin (no content mutations); `requestIdleCallback` with 50 ms lead time; skips save on meta-transaction |
| IndexedDB storage limits on very large novels | Medium | **Resolved:** `CompressionStream`/`DecompressionStream` on records >50 KB; storage quota warning at 80%; full JSON backup available |
| Anthropic CORS block | Medium | **Resolved:** opt-in nginx CORS proxy (`ENABLE_ANTHROPIC_PROXY=true`); OpenRouter documented as zero-config fallback |
| Matrix view complexity (scene × codex grid) | Medium | **Resolved:** implemented with codex/POV/label rows; TanStack Virtual deferred (acceptable for typical novel sizes) |
| Slash menu UX in Tiptap | Low-Medium | **Resolved:** `@tiptap/suggestion` + tippy.js; three items (Beat, Section, Codex Progression) |

---

## 7. Decisions Deferred / Explicitly Out of Scope

- **Collaboration** — dropped. Architecture does not need to accommodate it.
- **Real-time sync** — not applicable (no backend).
- **Auth / user accounts** — not applicable (single user, local).
- **Paid tiers, billing, hosted AI credits** — out of scope per requirements §14.
- **Name generator, NSFW marketplace, in-app courses** — out of scope per requirements §15.
- **Series Codex sharing** — out of scope (requires multi-user).
- **Apple Pages import** — not implemented.
- **PDF export** (`@react-pdf/renderer`) — not implemented; optional/lower priority.
- **E2E tests** (Playwright) — not implemented.
- **Thinking/reasoning mode UI toggle** — provider types support it; UI not built.
- **Prompt import/export (clipboard format)** — not implemented.
- **Mentions heatmap visualization** — occurrence counts present; full heatmap chart not built.
- **Command palette** (`Ctrl+K`) — parking lot item.
- **Dark/light/system theme toggle** — parking lot item (app uses zinc dark by default).
- **Novel word count goal + progress bar** — parking lot item.
- **Review mode** — placeholder route exists; content TBD.
