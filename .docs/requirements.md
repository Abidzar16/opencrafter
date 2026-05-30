# Requirements: Novelcrafter Open-Source Alternative

> **Source:** Derived from https://www.novelcrafter.com/help/docs (traversed May 2026)
> **Purpose:** Spec-driven development reference — covers every documented feature of Novelcrafter to guide building a functionally equivalent open-source alternative.

---

## 1. Overview

A web-based novel-writing application that combines a structured manuscript editor, an AI-assisted brainstorming interface, a story-planning board, and a world-building database (Codex). The system supports multiple AI providers via user-supplied API keys, persists all data per-user, and enables optional collaboration on novels and series.

---

## 2. Application Shell

### 2.1 Layout

The app has a persistent three-region layout inside a novel context:

- **Sidebar** (left): Navigation icons for Codex, Snippets, Prompt Library, and Export. Shows a real-time sync/save indicator at the bottom.
- **Top Navigation Bar**: Mode switcher (Plan / Write / Chat / Review), view selector, keyword filter, and per-mode appearance settings.
- **Main Panel**: Primary workspace; content changes with the active mode.
- **Novel Navigation** (top-left corner): Return to novel library, access novel settings, collapse the sidebar.

On small screens the top bar collapses to a dropdown menu.

### 2.2 Action Menus

Every major entity — acts, chapters, scenes, codex entries, snippets, chat threads, codex progressions — has a contextual "kebab" (⋮) action menu exposing all secondary operations for that entity.

### 2.3 Pinning

Sidebar panels (Codex, Snippets, etc.) can be pinned to remain visible alongside the main editor.

### 2.4 Novel Library / Home Screen

- Grid of novel covers with title and metadata.
- Tag showing novels "shared with you".
- Support for novel series grouping.

---

## 3. Plan Module

### 3.1 Structure

Stories are organized as a three-level hierarchy:

```
Novel
└── Act (one or more)
    └── Chapter (one or more)
        └── Scene (one or more)
```

Each scene carries: title, summary (synopsis), beats, word count, POV character, labels, and codex entry associations.

### 3.2 Plan Views

Three switchable views share the same data:

| View | Description |
|------|-------------|
| **Grid** | Kanban-style scene cards grouped by act/chapter. Codex mention badges shown on cards. Default view. |
| **Matrix** | Spreadsheet-style: scenes as columns, configurable rows (codex entries, POV, labels, subplots, custom categories). Supports bulk POV assignment via single click. |
| **Outline** | Linear text-focused list of scene summaries. |

The plan interface includes a keyword search that matches text in scene summaries, scene contents, labels, and codex entry names/aliases.

### 3.3 Scene Cards — Appearance

Card dimensions (height/width) are customizable per-user. The information visible on each card (e.g., word count, POV, label chips, codex tags) is configurable.

### 3.4 Create from Outline

A text-to-plan importer at the bottom of the Plan view:

- Accepts a structured text format: `#` for acts, `##` for chapters, plain text for scene summaries.
- Appends generated acts/chapters/scenes to the existing novel.
- Built-in preview step before committing.
- Ships with preset templates: 3 Act Structure, Save the Cat, Hero's Journey, Freytag's Pyramid, Dan Harmon's Story Circle, Fichtean Curve, Derek Murphy's 24 Chapters, Story Clock.
- Accepts any custom template formatted to the same spec.

### 3.5 Matrix View — Detail

Selectable row types via a "Show" menu:

- **Codex Entries** (default): shows all entry appearances per scene.
- **POV**: click a cell to switch POV for that scene.
- **Labels**: click a cell to add/remove a label.
- **Custom Category**: filter to a specific codex category group.
- **Subplots**: track subplot presence across scenes.
- **Custom**: manually add entries for a focused view.

### 3.6 Plan Actions Menu

Per act/chapter/scene context actions include (non-exhaustive): rename, duplicate, move, archive, delete, set POV, add subtitle, AI-summarize scene, AI-detect characters, export scene, add codex progression.

---

## 4. Codex Module (Story Bible)

### 4.1 Purpose

A structured database of story world elements. Each entry can be fed to the AI as context when writing. Lives in the left sidebar, accessible from all modes.

### 4.2 Entry Types (System-defined, non-extensible)

| Type | Notes |
|------|-------|
| **Character** | Humans, animals, robots, etc. Only characters can be set as scene/novel POV. |
| **Location** | Any physical setting (room → galaxy). |
| **Object/Item** | Significant items that affect plot. |
| **Lore** | Magic systems, species, religions, custom world rules. |
| **Subplot** | Trackable plot threads; appear in matrix view. |
| **Other** | Catch-all: organizations, gangs, factions, genre meta. |

### 4.3 Entry Anatomy

Each codex entry has:

- **Name** + optional **Aliases** (nicknames, alternate spellings).
- **Description** — prose description sent to AI as context.
- **Notes** — private notes, not sent to AI by default.
- **Details** — structured key/value pairs (e.g., Age: 34, Role: Antagonist). Details can have their own progressions.
- **Relations** — typed links to other codex entries.
- **Tags** — custom searchable labels.
- **Cover image** (optional).
- **Tracking settings** (see §4.5).
- **Progressions/Additions** (see §4.6).
- **Mentions tracker** — count and heatmap of how often this entry appears across the manuscript.

### 4.4 Categories

User-defined groups that organize entries within a type. Categories can be collapsed/expanded. Entries can belong to a category (e.g., "Rebellion", "Royal Family"). Categories appear as filterable rows in the Matrix view.

### 4.5 Codex Tracking

The **Tracking** tab per entry controls:

**Name/alias detection in manuscript:**
- Toggle tracking on/off per entry.
- When on: entry name and aliases are underlined in the manuscript, plan, and snippets; appearance counts are shown; entry appears in the mention heatmap.
- Auto-pluralisation for English variants (simple plurals only; complex forms must be added as aliases).
- Case-sensitive matching toggle (default: case-insensitive).
- Exclusion list: comma-separated phrases that should not be counted as mentions.

**AI Context modes (4 options):**

| Mode | Behavior |
|------|----------|
| Always include | Entry always added to AI context. |
| Include when detected (default) | Added when its name/alias appears in the selected text, beats, or chat message. |
| Don't include when detected | Excluded from AI context even when detected; can still be included via manual assignment or relations. |
| Never include | Never sent to AI. Useful for private notes or spoilers. |

### 4.6 Codex Progressions / Additions

Time-anchored addendums to an entry. Used when a character's state changes mid-story (e.g., acquires a scar, gets married, changes job):

- Created inside the Write interface via the `/` slash menu → "Codex progressions".
- Attached to a specific scene (position in the manuscript).
- Only visible to AI when writing scenes **at or after** the progression's scene; earlier scenes see the baseline entry.
- Two modes: **addition** (appends to the base description) or **replacement** (overrides a detail).
- Can be linked to a specific **Codex Detail** field.
- Progressions appear as inline annotations inside the Write interface and are listed on the codex entry page.

### 4.7 Codex Relations

Bidirectional typed links between two codex entries (e.g., "Character A is the parent of Character B"). Referenced entries can be pulled into AI context via the relation.

### 4.8 Series Codex

A separate codex shared across all books in a series. Accessible via the series home screen. Shared independently from individual book access (sharing a series codex does not grant access to specific books).

### 4.9 Quick Create

In-manuscript shortcut to create a new codex entry without leaving the Write interface.

---

## 5. Write Module (Manuscript)

### 5.1 Editor

A distraction-free rich text editor. The active view shows one chapter at a time (selectable) or spans multiple chapters. Scenes within a chapter are separated by a configurable scene divider.

### 5.2 Write Interface Anatomy

- **Chapter selection** (top): switcher between chapters.
- **Format Menu**: font family, font size, paragraph spacing, paragraph width, text alignment, scene divider style.
- **Focus Mode**: hides all chrome for distraction-free writing.
- **Scene Details Panel** (right side): scene number, word count, POV, chapter summary. Access to: set POV, add subtitle, duplicate scene, export scene, AI summarize, AI detect characters, "chat with scene".
- **Story Timeline** (far right): vertical overview of the entire manuscript; each scene has a clickable marker; colored sections visible; current position highlighted.
- **Beats & Writing area**: interleaved scene beat instructions and prose content.

### 5.3 Sections

Inline content markers created via the `/` slash menu. Sections can be colored and are visible on the story timeline. Use cases: alternative text drafts, notes, content markers, "kitbashing" (collecting AI-generated prose for later use).

### 5.4 Formatting

Supported inline formatting: bold, italic, underline, strikethrough. Paragraph styles: heading levels, blockquote. Paragraph and line spacing controls. Alignment (left, center, right, justify).

### 5.5 Subplots

Subplots are tracked as Codex entries of type "Subplot" and can be visualized in the Matrix view.

### 5.6 AI Prose Generation

Triggered via the `/` slash menu → "Scene beat":

1. User types a beat instruction (natural language description of what should happen).
2. User selects context inputs (codex entries, prior text, scene summary, etc.).
3. User picks a prompt and model, then submits.
4. AI streams prose into a preview area.
5. Four post-generation actions:
   - **Apply** — insert prose at cursor position.
   - **Retry** — regenerate (discards previous result).
   - **Discard** — reject generation.
   - **Section** — add to a Section block and apply.

The default prompt can be overridden per-generation via a dropdown. Model parameters can be adjusted per-generation.

### 5.7 Text Replacement Prompts

Select existing prose → choose a text replacement prompt (e.g., "expand", "shorten", "increase tension", "change POV"). The selected text is replaced with the AI-generated result (with the same 4 post-generation options).

### 5.8 Codex Highlights in Manuscript

When tracking is enabled for a codex entry, its name and aliases are underlined in the manuscript text. Hovering shows entry details inline.

---

## 6. Chat Module (Workshop)

### 6.1 Purpose

An AI chat interface for brainstorming, character interrogation, plot development, and prose analysis. Supports multiple named threads per novel.

### 6.2 Thread Management

- Create, rename, pin, archive, delete threads.
- Split a thread to the left or right of the interface (side-by-side with the manuscript or plan).
- Export/copy conversation history.

### 6.3 Message Bar

Before sending each message the user can configure:

- **Context selection**: attach any combination of:
  - Full novel text and/or outline (optionally filtered by POV character)
  - Specific acts, chapters, scenes
  - Snippets
  - Individual codex entries, or filtered by type/detail/category/tag
- **Prompt**: swap to any Workshop Chat prompt from the library.
- **Model**: change AI model and parameters.
- **Prompt Inputs**: show/hide dynamic input fields defined in the active prompt.

### 6.4 Extract Feature

On any chat message, click "Extract" to parse the AI's response and push content into:

1. **Codex Entries** — create new entries or overwrite existing ones. Parses structured format `Name (aliases) [tags]: Description`.
2. **Chapters** — appends acts/chapters to the Plan view.
3. **Scene Beats** — outputs formatted beats for pasting into the Write interface.

Extract is also available from Snippets (for users without the full context plan).

---

## 7. Prompt System

### 7.1 Prompt Library

Central management interface for all AI prompts and related configurations. Left panel: list of all prompts, presets, model collections, personas, defaults. Right panel: selected item's detail editor.

### 7.2 Prompt Types

| Type | Where Used |
|------|-----------|
| **Scene Beat Completion** | Write interface `/` menu — generates prose from a beat instruction. |
| **Scene Summarization** | Plan and Write action menus — summarizes scene content (~80 words). |
| **Text Replacement** | Write interface — rewrites selected prose. |
| **Workshop Chat** | Chat module — powers AI conversation threads. |

### 7.3 Prompt Anatomy

Each prompt has tabs:

- **General**: name, type, associated models, description (shown in UI for user guidance).
- **Instructions**: the system prompt / template text with variable placeholders.
- **Context**: which context blocks are injected (scene, codex, prior text, etc.) and in what order.
- **Inputs**: user-facing input fields (see §7.6).
- **Model Settings**: temperature, max tokens, and other generation parameters that override the model default.

### 7.4 Prompt Components

Reusable prompt fragments that can be inserted into any prompt's instruction template. Managed in the prompt library. System components are read-only; users can create custom components.

### 7.5 Prompt Personas

Cross-project AI personality/instruction sets. A persona defines the AI's "voice" and behavioral guidelines independently of any single prompt. Applied at the account or novel/series level.

### 7.6 Prompt Inputs

User-facing input fields embedded in a prompt. When a user runs the prompt, these fields appear for them to fill in before sending. Input types include text fields, dropdowns, toggles, etc. Can have default values. Used to make prompts reusable with variable parameters (e.g., "tone", "target word count", "character name").

### 7.7 Prompt Presets

Bundles of prompt + model + input default values. Allow a user to save a frequently used configuration and apply it with one click. A Preset differs from a Persona: a Persona sets who the AI is; a Preset sets how to run a specific prompt.

### 7.8 Default Prompts

Users can designate defaults at three scopes:
- **Account-level** defaults (used when no novel or series default is set).
- **Series-level** defaults.
- **Novel-level** defaults.

Separate defaults can be set for: scene beat completion, scene summarization, text replacement, workshop chat.

### 7.9 Sharing Prompts

Prompts can be copied to clipboard in a shareable format. Other users can paste this format to import the prompt into their library.

### 7.10 Prompt Organization

Prompts can be grouped into named submenus for easier navigation in context menus.

### 7.11 Prompt Preview

Before sending, the user can preview the fully assembled prompt that will be sent to the AI (with all context blocks resolved).

---

## 8. AI Model System

### 8.1 Supported Providers

The system connects to external AI providers via user-supplied API keys:

| Provider | Notes |
|----------|-------|
| OpenAI | GPT family |
| Anthropic (Claude) | Claude family |
| Groq | Fast inference |
| Ollama | Local models |
| LM Studio | Local models |
| OpenRouter | Multi-model gateway |
| Anyscale Endpoints | Hosted open-source models |
| OpenAI API-Compatible | Any third-party endpoint matching the OpenAI API spec |

### 8.2 Model Collections

Named groups of AI models. A collection can contain one or more model configurations. Assigned to a prompt to give the user quick-select options at generation time. System collections are read-only; users can create custom collections.

### 8.3 Model Configuration per Entry

Per model in a collection: provider, model ID, API key reference, temperature, top-p, max tokens, stop sequences, presence/frequency penalties.

### 8.4 Thinking / Reasoning Mode

For models that support extended reasoning (e.g., Claude 3.5 Sonnet with extended thinking): toggle and configure reasoning budget tokens.

### 8.5 NSFW Model Handling

NSFW-capable model connections can be configured separately and are gated behind a setting. The UI does not expose NSFW options unless this setting is enabled.

---

## 9. Snippets

### 9.1 Purpose

Reusable text fragments — e.g., style guides, writing notes, recurring descriptions, research notes. Accessible from the sidebar in all modes.

### 9.2 Anatomy

Each snippet has: name, content (rich text), tags. Snippets can be included as context in Chat messages and can be referenced in prompt templates.

### 9.3 Revision History

Snippet content is versioned (see §11.1).

---

## 10. Import & Export

### 10.1 Import

| Format | Notes |
|--------|-------|
| Word (.docx) | Imports acts, chapters, scenes (via heading structure) |
| Markdown (.md) | Same structural mapping as Word |
| Apple Pages | Same structural mapping |

Import is available both during novel creation and from within the Plan interface.

### 10.2 Export

| Target | Notes |
|--------|-------|
| Standard novel export | Full manuscript as a single document; configurable format |
| Scrivener (.scriv) | Exports acts/chapters/scenes into a Scrivener project structure |
| Atticus | Exports into Atticus-compatible format |

---

## 11. Organization & Content Management

### 11.1 Revision History (Versioning)

Auto-versioned content types:
- Scene content
- Scene summary
- Codex entry description
- Codex entry notes
- Snippet content
- Custom prompt instructions

Users can open a version history modal, browse past versions, preview any version, and restore a selected version.

### 11.2 Archiving

- Acts, chapters, scenes: archivable individually; archived items hidden from main views but restorable.
- Novels/series: archivable from the library. Archived novels appear in a separate "archived" view.
- Chat threads: archivable.

### 11.3 Scene Labels

User-defined color-coded labels attached to scenes. Visible in Grid and Matrix views. Useful for tracking edit status, scene type, or any custom workflow state.

### 11.4 Cover Images

Novels and codex entries can have cover/avatar images uploaded.

### 11.5 Deleting

Permanent delete available for acts, chapters, scenes (with confirmation). Distinct from archiving.

---

## 12. Collaboration

### 12.1 Inviting Collaborators

From novel or series settings → Collaboration tab → invite by email address. Two roles:

| Role | Access |
|------|--------|
| **Viewer** | Read-only. Does not require a paid subscription. |
| **Editor** | Full edit access. Requires a "Scribe" subscription on the collaborator's account. |

### 12.2 Novel Collaboration

Grants collaborator access to the book and all its data.

### 12.3 Series Collaboration

Grants collaborator access to the **series codex only**. Does not grant access to individual books within the series.

### 12.4 Current Limitations

No real-time co-editing (changes are not reflected live). Collaboration is intended for asynchronous review/editing workflows, not simultaneous writing. Invited users receive no automated notification.

---

## 13. Non-Functional Requirements

### 13.1 Autosave

All content is autosaved continuously. A sync indicator in the sidebar confirms save status.

### 13.2 Responsive Layout

The interface must function on small screens (tablet/mobile). The top navigation collapses to a dropdown; the sidebar collapses to icon-only or is hidden behind a toggle.

### 13.3 AI Provider Flexibility

Users supply their own API keys for external AI providers. The system must not require a specific provider — any configured and enabled connection should work.

### 13.4 Data Privacy

Codex entries marked "Never include" must never be transmitted to any AI provider. This must be enforced server-side (or client-side if fully local), not merely by UI convention.

### 13.5 Extensibility

The prompt system (components, personas, presets, inputs) should allow advanced users to build highly customized AI workflows without modifying application code.

---

## 14. Out of Scope (Novelcrafter-specific commercial features)

The following exist in Novelcrafter but are out of scope for an open-source alternative unless specifically adopted:

- Hosted AI credits / usage billing.
- Paid subscription tiers gating features.
- In-app educational courses and Monthly Muse newsletter.
- Name generator tools.
- NSFW-specific model marketplace.

---

## 15. Glossary

| Term | Definition |
|------|-----------|
| **Act** | Top-level structural division of a novel. |
| **Beat** | A scene-level instruction describing what should happen; used as AI generation context. |
| **Chapter** | Second-level structural division, inside an act. |
| **Codex** | The story bible — database of all world-building entities. |
| **Codex Progression** | A time-anchored change to a codex entry, visible to AI only from that scene onward. |
| **Codex Detail** | A structured key/value attribute of a codex entry (e.g., Age, Role). |
| **Extract** | Feature to parse AI chat output and push structured data into Codex, Plan, or beats. |
| **Matrix** | Spreadsheet-style plan view mapping scenes against codex entries, POV, labels, etc. |
| **Model Collection** | A named group of AI model configurations assignable to a prompt. |
| **Persona** | Account-level AI behavioral instruction set applied across prompts. |
| **Preset** | Saved combination of prompt + model + input defaults for one-click reuse. |
| **Prompt Component** | Reusable prompt fragment insertable into any prompt template. |
| **Prompt Input** | Dynamic user-facing field within a prompt, filled at generation time. |
| **Scene** | The lowest structural unit in the hierarchy; contains beats and prose. |
| **Section** | A colored inline block inside a scene used for alternatives, notes, or kitbashing. |
| **Series Codex** | A codex shared across multiple books in a series. |
| **Snippet** | A named, reusable text fragment available as AI context or reference material. |
| **Tracking** | Automatic detection and highlighting of a codex entry's name/aliases in the manuscript. |
| **Workshop Chat** | The AI chat interface used for brainstorming, analysis, and planning. |
