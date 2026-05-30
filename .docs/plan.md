# plan.md — Opencrafter

> **Scope:** Offline-first, single-user, React SPA served from Docker (nginx). No backend API, no server database. All data lives in the browser via IndexedDB. Collaboration dropped from scope.

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
| Language | **TypeScript 5** | Type safety across the complex domain model (Codex, Prompts, etc.) |
| Framework | **React 18** | Widest library coverage; Tiptap, Dexie, shadcn all have first-class React support |
| Build tool | **Vite** | Fast HMR, excellent PWA plugin, native ESM |
| Package manager | **pnpm** | Fast, strict, monorepo-ready |

### 2.2 UI

| Concern | Choice | Rationale |
|---|---|---|
| Component library | **shadcn/ui** | Unstyled primitives (Radix) + Tailwind; fully owned, no vendor lock-in |
| Styling | **Tailwind CSS v4** | Co-located styles, no stylesheet overhead |
| Icons | **Lucide React** | Consistent, tree-shakable |
| Drag & drop | **@dnd-kit/core** | Modern, accessible; needed for scene reordering in Grid/Matrix views |
| Kanban / Grid | Custom on `@dnd-kit` | Novelcrafter's grid is domain-specific enough that a generic kanban lib won't fit |

### 2.3 Rich Text Editor

**Choice: Tiptap v2 (ProseMirror)**

This is the highest-risk dependency in the project. Tiptap is the right call because:
- Native React integration
- Built-in slash command extension (`tiptap-extension-slash-command` or custom `Commands` extension)
- Custom marks for codex highlighting (underline + hover tooltip)
- Node views for Beat blocks and Section blocks (colored inline containers)
- Streaming AI output inserts cleanly via `editor.chain().insertContent(chunk)`
- Active development, MIT license

Custom Tiptap extensions needed:
- `CodexHighlight` mark — underlines detected codex entry names, attaches hover card
- `Beat` node — inline beat instruction block (distinct from prose)
- `Section` node — colored wrapper block for alternatives/kitbashing
- `SlashMenu` — `/` trigger for beat insertion, section creation, codex progression

### 2.4 Local Persistence

**Choice: Dexie.js v4 (IndexedDB)**

- Clean TypeScript API over IndexedDB
- Reactive queries via `useLiveQuery` hook (auto re-renders on DB change)
- Transaction support for atomic multi-table writes (e.g., create scene + revision history entry atomically)
- Schema versioning for migrations as the data model evolves
- No size limits beyond browser storage quotas (~1GB+ on modern browsers)

Dexie replaces a backend ORM. Every feature that would normally hit a REST API hits Dexie instead.

### 2.5 State Management

**Choice: Zustand**

- Lightweight, no boilerplate
- Used for **UI state only**: active scene, sidebar panel visibility, modal state, editor focus, current AI generation status
- Dexie `useLiveQuery` owns all persisted data — Zustand never duplicates it
- This separation is critical: Zustand is ephemeral (cleared on reload), Dexie is durable

### 2.6 Routing

**Choice: TanStack Router v1**

- File-based routing with full TypeScript type safety on route params
- Better than React Router for this app because novel ID / scene ID are in the URL and must be type-safe
- Supports nested layouts (novel shell → mode shell → content)

### 2.7 AI Integration

All AI calls are standard `fetch` from the browser to provider APIs. No backend proxy.

```
AI Layer (src/lib/ai/)
├── providers/
│   ├── openai.ts        # OpenAI & compatible endpoints
│   ├── anthropic.ts     # Anthropic (direct API)
│   ├── groq.ts          # Groq (OpenAI-compatible)
│   ├── ollama.ts        # Local Ollama (http://localhost:11434)
│   └── lmstudio.ts      # Local LM Studio
├── stream.ts            # ReadableStream → async iterator
└── index.ts             # Provider registry, key lookup from Dexie
```

API keys are stored in Dexie (IndexedDB), never in localStorage (slightly more secure, same origin). For Ollama/LM Studio, no key needed — just an endpoint URL.

**Streaming:** `ReadableStream` with `TextDecoder` → SSE parsing → Tiptap `insertContent` chunk by chunk.

**CORS caveat for Anthropic:** Anthropic's API does not allow direct browser calls (no CORS header). The nginx config includes an optional CORS proxy for `api.anthropic.com`, disabled by default. Users enable it via an env var in `docker-compose.yml`:

```yaml
environment:
  - ENABLE_ANTHROPIC_PROXY=true
```

Users who don't need Claude models see no impact. As an alternative, OpenRouter can be used as a gateway without any proxy.

### 2.8 Export / Import

| Format | Library |
|---|---|
| DOCX export | `docx` (npm) |
| DOCX import | `mammoth` |
| Markdown import/export | `unified` + `remark` |
| Scrivener export | Custom XML builder (no library; `.scriv` is a known format) |
| PDF export | `@react-pdf/renderer` (optional, lower priority) |

### 2.9 Testing

| Layer | Tool |
|---|---|
| Unit / logic | **Vitest** |
| Component | **@testing-library/react** |
| E2E (optional) | **Playwright** |

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
EXPOSE 80
```

`nginx.conf` must handle SPA routing (all paths → `index.html`) and optionally act as a CORS proxy for Anthropic.

---

## 3. Data Model (Dexie Schema)

```typescript
// Core tables (Dexie schema)
novels:          id, title, coverImage, seriesId, createdAt, updatedAt, settings
acts:            id, novelId, title, order, archived
chapters:        id, actId, novelId, title, order, summary, archived
scenes:          id, chapterId, novelId, title, summary, beats, povCharacterId,
                 labels, wordCount, order, archived
scene_content:   id (= sceneId), content (Tiptap JSON)

codex_entries:   id, novelId, type, name, aliases, description, notes,
                 details (JSON), tags, coverImage, trackingSettings, aiContextMode
codex_relations: id, fromId, toId, relationType
codex_progressions: id, entryId, sceneId, novelId, mode, content, detailKey

snippets:        id, novelId, name, content (Tiptap JSON), tags
chat_threads:    id, novelId, name, pinned, archived
chat_messages:   id, threadId, role, content, contextSnapshot, createdAt

prompts:         id, name, type, instructions, contextConfig, inputs (JSON),
                 modelSettings, groupId
prompt_components: id, name, content
prompt_personas: id, name, instructions, scope
prompt_presets:  id, promptId, name, modelConfig, inputDefaults
model_configs:   id, name, provider, modelId, apiKeyRef, temperature, ...
api_keys:        id, provider, key (stored as-is; user responsibility)

revisions:       id, entityType, entityId, content, createdAt
labels:          id, novelId, name, color
series:          id, name, coverImage
```

Codex `type` is an enum: `character | location | object | lore | subplot | other`.

---

## 4. Project Structure

```
src/
├── app/                    # TanStack Router file-based routes
│   ├── index.tsx           # Root: novel library
│   ├── novel/$novelId/
│   │   ├── plan.tsx
│   │   ├── write.tsx
│   │   ├── chat.tsx
│   │   └── review.tsx
│   └── settings.tsx
├── components/
│   ├── editor/             # Tiptap + custom extensions
│   ├── plan/               # Grid, Matrix, Outline views
│   ├── codex/              # Codex sidebar + entry editor
│   ├── chat/               # Workshop chat
│   ├── prompts/            # Prompt library UI
│   └── ui/                 # shadcn/ui re-exports
├── lib/
│   ├── db/                 # Dexie schema + all table hooks
│   ├── ai/                 # Provider adapters + stream util
│   ├── export/             # DOCX, Markdown, Scrivener exporters
│   ├── import/             # DOCX, Markdown importers
│   └── codex-detector/     # Name/alias matching in Tiptap content
├── stores/                 # Zustand stores (UI state only)
├── types/                  # Shared TypeScript interfaces
└── main.tsx
```

---

## 5. Phased Implementation Plan

Collaboration is dropped. NSFW gating, billing, and courses are out of scope (per requirements §14).

### Phase 0 — Foundation (Week 1–2)
- [ ] Vite + React + TypeScript + Tailwind + shadcn/ui scaffold
- [ ] TanStack Router: library route + novel shell routes
- [ ] Dexie schema v1: novels, acts, chapters, scenes, scene_content
- [ ] Novel library (grid of covers, create/delete novel)
- [ ] **One-click "Export all data as JSON" backup** (IndexedDB wipe = total data loss; this is a safety feature)
- [ ] Docker build + nginx config with opt-in Anthropic CORS proxy (`ENABLE_ANTHROPIC_PROXY` env var)
- [ ] CI: lint + typecheck + Vitest

### Phase 1 — Plan Module (Week 3–4)
- [ ] Act/Chapter/Scene CRUD with drag-and-drop reorder (dnd-kit)
- [ ] Grid view (kanban-style scene cards)
- [ ] Outline view (linear list)
- [ ] Scene detail panel (title, summary, beats, POV, labels)
- [ ] Label system (color-coded, per-novel)
- [ ] Archive/restore acts, chapters, scenes
- [ ] Create from Outline importer (text → acts/chapters/scenes)
- [ ] Preset story structure templates

### Phase 2 — Write Module (Week 5–7)
- [ ] Tiptap editor with scene content persistence
- [ ] Beat node extension + Section node extension
- [ ] Scene dividers, chapter switcher
- [ ] Format controls (font, spacing, width, alignment)
- [ ] Focus mode
- [ ] Scene details panel (right side)
- [ ] Story timeline (right margin overview)
- [ ] Slash menu (`/` commands)
- [ ] Revision history (scene content + summary)

### Phase 3 — Codex Module (Week 8–10)
- [ ] Codex entry CRUD (all 6 types)
- [ ] Categories, tags, aliases, relations
- [ ] Codex Details (key/value pairs)
- [ ] Tracking toggle + AI context modes
- [ ] `CodexHighlight` Tiptap mark (name detection + hover card)
- [ ] Codex Progressions (scene-anchored overrides)
- [ ] Mentions heatmap / count
- [ ] Quick Create from Write interface

### Phase 4 — AI Layer (Week 11–13)
- [ ] Provider registry (OpenAI, Anthropic via proxy, Groq, Ollama, LM Studio, OpenRouter, generic OpenAI-compatible)
- [ ] API key management UI
- [ ] Model Collections
- [ ] Streaming prose generation (beat → prose, into Tiptap)
- [ ] Text replacement prompts (select text → rewrite)
- [ ] Thinking/reasoning mode toggle
- [ ] "Never include" codex enforcement (client-side, before any fetch)

### Phase 5 — Prompt System (Week 14–15)
- [ ] Prompt library UI (all 4 prompt types)
- [ ] Prompt Components (reusable fragments)
- [ ] Prompt Personas
- [ ] Prompt Presets
- [ ] Prompt Inputs (dynamic fields)
- [ ] Default prompts (novel-level)
- [ ] Prompt preview (fully resolved, before sending)
- [ ] Prompt import/export (clipboard format)

### Phase 6 — Chat Module (Week 16–17)
- [ ] Multi-thread chat per novel
- [ ] Context selector (attach scenes, codex entries, snippets)
- [ ] Streaming chat responses
- [ ] Extract feature (AI output → Codex entries / Plan / Beats)
- [ ] Thread archive, pin, export

### Phase 7 — Snippets + Import/Export (Week 18–19)
- [ ] Snippets CRUD with revision history
- [ ] DOCX import (mammoth → acts/chapters/scenes)
- [ ] Markdown import
- [ ] Full novel DOCX export
- [ ] Markdown export
- [ ] Scrivener export

### Phase 8 — Polish (Week 20+)
- [ ] Responsive layout (tablet/mobile)
- [ ] Matrix view (full implementation)
- [ ] Codex sidebar pinning
- [ ] Cover image uploads
- [ ] Series support (grouping novels, shared series codex)
- [ ] PWA manifest + service worker (full offline after first load)
- [ ] Accessibility audit
- [ ] Performance profiling (large novels with 100+ scenes)

---

## 6. Key Risks & Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Tiptap codex highlight performance on large documents | High | Implement detection as a Tiptap plugin using ProseMirror decorations (not content mutations); debounce on idle |
| IndexedDB storage limits on very large novels | Medium | Compress Tiptap JSON; warn users at 80% of quota; export-to-file as backup |
| Anthropic CORS block | Medium | Bundle nginx CORS proxy in Docker image; document OpenRouter as fallback |
| Matrix view complexity (scene × codex grid) | Medium | Build after Codex is stable; use virtualized grid (TanStack Virtual) for large datasets |
| Slash menu UX in Tiptap | Low-Medium | Use `@tiptap/extension-mention` as base, override rendering |

---

## 7. Decisions Deferred / Explicitly Out of Scope

- **Collaboration** — dropped. Architecture does not need to accommodate it.
- **Real-time sync** — not applicable (no backend).
- **Auth / user accounts** — not applicable (single user, local).
- **Paid tiers, billing, hosted AI credits** — out of scope per requirements §14.
- **Name generator, NSFW marketplace, in-app courses** — out of scope.
- **Series Codex sharing** — out of scope (requires multi-user).
- **Apple Pages import** — low priority; defer unless trivially implementable.

