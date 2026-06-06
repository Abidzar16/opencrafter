# Requirements: Novelcrafter Open-Source Alternative

> **Source:** Derived from https://www.novelcrafter.com/help/docs (traversed May 2026; re-verified June 2026) **and** https://www.novelcrafter.com/courses (traversed June 2026).
> **Purpose:** Spec-driven development reference — covers every documented feature of Novelcrafter to guide building a functionally equivalent open-source alternative.
> **Changelog:** Requirements marked `[NEW - courses]` were identified from course content and are absent from the help documentation.

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

### 3.7 Automatic Numeration Toggle `[NEW - courses]`

Each act and chapter has an **Automatic Numeration** toggle in its action menu. When disabled, the act/chapter is excluded from the sequential numbering of its siblings, allowing it to carry a custom name (e.g., "Prologue", "Epilogue", "Interlude") without disrupting the numbering of subsequent acts/chapters.

Workflow for a prologue:
1. Create a new Chapter or Act.
2. Move it to the first position.
3. In the action menu, toggle Automatic Numeration **off**.
4. Rename it "Prologue".

The same process applies to an epilogue (placed last). Chapters within a de-numbered act retain their own numeration unless also toggled off.

### 3.8 Scene-Level Codex Context Attachment `[NEW - courses]`

Each scene has a **+ Codex** button accessible beneath the scene summary in both the Plan interface and the Write interface. Clicking it opens a picker to attach specific Codex entries to that scene.

Attached entries are injected into the AI context for **every beat generation and text replacement prompt** within that scene, without needing to be mentioned in individual beats. This is distinct from automatic detection (§4.5): attached entries are always present for that scene, regardless of whether their name appears in the prose.

Use cases:
- Providing location details for every beat in a scene.
- Attaching research entries, magic system rules, or specialized lore relevant to a scene.
- Including background event summaries that the AI needs but that shouldn't appear in every beat instruction.

The attached Codex entries (and their related entries, via Codex Relations) appear in the prompt; confirm placement via Prompt Preview (§7.12).

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
| **Other** | Catch-all: organizations, gangs, factions, genre meta. Also used for research sources, word-tracking entries, past-book summaries, and any auxiliary content. |

### 4.3 Entry Anatomy

Each codex entry has:

- **Name** + optional **Aliases** (nicknames, alternate spellings). Aliases can be sorted alphabetically via the action menu.
- **Description** — prose description sent to AI as context.
- **Notes** — private notes, not sent to AI by default.
- **Details** — structured key/value pairs (e.g., Age: 34, Role: Antagonist). Detail types include: Text, Dropdown, and Codex Reference (clickable link for the writer; does **not** pull the linked entry into AI context — use Relations for that). Each detail can have its own AI context setting (see §4.10). Details can have their own progressions.
- **Relations** — typed links to other codex entries.
- **Tags** — custom searchable labels.
- **Cover image** (optional).
- **Color** — color-code the entry for visual distinction across Plan views and the sidebar (see §4.10).
- **Tracking settings** (see §4.5).
- **Progressions/Additions** (see §4.6).
- **Mentions tracker** — count and heatmap of how often this entry appears across the manuscript.

### 4.4 Categories

User-defined groups that organize entries within a type. Categories can be collapsed/expanded. Entries can belong to a category (e.g., "Rebellion", "Royal Family"). Categories appear as filterable rows in the Matrix view.

Codex category settings are accessed via the **⚙ icon → Custom Categories** in the Codex panel.

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
| Always include | Entry always added to AI context, regardless of detection. (Formerly called a *global entry*.) |
| Include when detected (default) | Added when its name/alias appears in the selected text, beats, or chat message. |
| Don't include when detected | Excluded from AI context even when detected; can still be included via manual assignment or relations. |
| Never include | Never sent to AI. Useful for private notes or spoilers. |

> **Tracking/AI-context interaction:** Disabling name/alias tracking for an entry also stops it being detected, so it will no longer be picked up by the "Include when detected" mode. To keep an entry available to the AI *without* manuscript highlighting, set its AI Context to **Always include** rather than turning tracking off.

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

When a scene has a Location Codex entry attached (§3.8), any entries linked to that location via Relations are also pulled into the AI context, automatically expanding contextual coverage.

### 4.8 Series Codex

A separate codex shared across all books in a series. Accessible via the series home screen. Shared independently from individual book access (sharing a series codex does not grant access to specific books).

### 4.9 Quick Create

In-manuscript shortcut to create a new codex entry without leaving the Write interface.

### 4.10 Entry Color Coding `[NEW - courses]`

Each Codex entry can be assigned a **color** via the entry's action menu (⋮). The color is reflected in:

- The entry's icon/chip in the sidebar.
- Codex badge chips on Plan scene cards (Grid view).
- Column headers in the Matrix view (when filtered by codex entries or labels).

Color coding is primarily a visual organization tool; it does not affect AI context behavior. Common use: color-code entries by type, faction, or importance; red for word-tracking entries (see §4.11).

---

## 5. Advanced Codex Usage Patterns `[NEW - courses]`

The following patterns are not independent features but are emergent workflows documented in Novelcrafter's course material. They extend base Codex functionality and should be supported by the underlying data model.

### 5.1 Prose Quality / Word Tracking

The Codex tracking system can be repurposed to flag overused words, AI-isms, or weak constructions in prose — entirely without AI involvement.

Setup:
1. Create a Codex entry of type **Other**.
2. Name it descriptively (e.g., "Weak Verbs", "AI-Isms").
3. Assign a distinctive color (e.g., red) for instant visual recognition.
4. Add the words/phrases to track as **Aliases**. Use "Sort aliases" to order alphabetically.
5. Set AI Context to **Never include** — this is a writing aid, not a worldbuilding entry.

When tracking is enabled, all matching words are underlined throughout the manuscript, plan, and snippets, surfacing them during writing and revision without a separate editing pass.

### 5.2 Character Voice Sheets

A pattern for preserving character voice for both human reference and AI context. Implemented as a custom **Text detail** on a Character Codex entry.

Setup:
1. In Codex Settings → Custom Details, create a new detail of type **Text** named "Voice Sheet".
2. On the character's entry, add this detail.
3. Fill in example dialogue that captures the character's speech patterns, vocabulary, tics, and emotional register. Examples should be authentic character moments, not narrative prose.

AI context behavior: the Voice Sheet detail is included per the entry's AI context setting. For context-window economy, add the Voice Sheet detail only for scenes where that character speaks significantly, or use Codex Progressions (§4.6) to introduce a Voice Sheet at the point in the story where the AI first needs it.

### 5.3 Dual-Nature / Split-Identity Character Modeling

Three strategies for characters with dual identities, secret identities, or split personalities. Choice depends on how distinct the identities are and how often AI confuses them.

**Option A — Single entry with sections**
- One Character entry, primary name + all identity aliases.
- Description uses headings to section each identity's traits, voice, and knowledge.
- Custom details separate per-identity attributes.
- Suitable when both identities are narratively connected and the duality is not a secret.

**Option B — Linked separate entries**
- Create one Character entry per identity.
- Each entry's description explicitly notes the relationship to the other identity and when it should/shouldn't be revealed.
- Link the two entries via **Relations**.
- Suitable for secret identities (superhero/civilian) or dramatically different personalities.

**Option C — Single entry with progressions**
- One primary Character entry covering both personas.
- Use Codex Progressions (§4.6) at scene-level transition points to update voice patterns, behavioral traits, physical appearance, and knowledge state.
- Use Addition mode to append; Replacement mode to override.
- Suitable when the transformation happens at specific, known story beats.

All three options benefit from **Voice Sheets** (§5.2) to keep dialogue distinct per identity.

### 5.4 Research Library

A pattern for genres requiring factual accuracy (non-fiction, historical fiction, hard sci-fi). Stores external sources as Codex entries with structured metadata, allowing targeted AI context injection.

**One-time setup:**
1. Create a custom Codex category (e.g., "Research" or "Historical Sources") via ⚙ → Custom Categories.
2. Create custom details for source metadata — suggested types:
   - **Source Type** (Dropdown: Book, Article, Website, etc.)
   - **Key Takeaways** (Text; AI Context: Always include)
   - **Direct Quotes** (Text; AI Context: Always include)
   - **Citation** (Text; AI Context: **Never include** — private reference only)

**Per source:**
1. Create a Codex entry of type **Other** (or the nearest contextually matching type).
2. Name with a consistent convention: `REF: "Title" (Year)`.
3. Tag it with the research category tag.
4. Add topical **Aliases** (e.g., "DNA analysis", "forensic evidence") so the entry is auto-detected when those terms appear in beats or chat.
5. Fill in details; keep Key Takeaways concise — this is what the AI receives.
6. Use the Notes tab for full source text or private annotations.

**Topic Hub pattern:** For multiple sources on one subject, create an additional "TOPIC: [Name]" entry of type Other and link all individual source entries via Relations. Referencing the hub pulls key takeaways from all linked sources.

### 5.5 Genre and Style Guide Entries

Using the Codex to give the AI standing guidance on genre conventions and prose style:

- **Genre entry** (type: Other, AI Context: Always include): Defines genre conventions to follow and clichés to avoid. Helps the AI stay genre-consistent across all prose generation.
- **Style Guide entry** (type: Other, AI Context: Always include): Defines the author's prose voice — sentence rhythm, vocabulary register, POV distance, tense, stylistic rules. Can be generated via a Chat prompt (see §7 prompt patterns), then stored here.

Both entries bypass detection-based inclusion by using Always include, ensuring they are present in every generation.

### 5.6 Series Continuity Entries

When writing a sequel, create one Codex entry of type **Other** per completed book in the series. Stores key facts the AI needs for continuity without importing entire manuscripts.

Suggested custom details (each as its own Text detail):
- Major Plot Points
- Character Development
- Relationship Developments
- Worldbuilding Revelations
- Unresolved Threads

Set to **Always include** at series start; switch to **Include when detected** or **Never include** for later books once events become background knowledge.

> **Data model note:** These are per-book, not part of the shared Series Codex (§4.8). They live in the individual book's Codex but act as a "continuity source of truth" for that book's writing context.

---

## 6. Write Module (Manuscript)

### 6.1 Editor

A distraction-free rich text editor. The active view shows one chapter at a time (selectable) or spans multiple chapters. Scenes within a chapter are separated by a configurable scene divider.

### 6.2 Write Interface Anatomy

- **Chapter selection** (top): switcher between chapters.
- **Format Menu**: font family, font size, paragraph spacing, paragraph width, text alignment, scene divider style.
- **Focus Mode**: hides all chrome for distraction-free writing.
- **Scene Details Panel** (right side): scene number, word count, POV, chapter summary. Access to: set POV, add subtitle, duplicate scene, export scene, AI summarize, AI detect characters, "chat with scene".
- **Story Timeline** (far right): vertical overview of the entire manuscript; each scene has a clickable marker; colored sections visible; current position highlighted.
- **Beats & Writing area**: interleaved scene beat instructions and prose content.

### 6.3 Sections

Inline content markers created via the `/` slash menu. Sections can be colored and are visible on the story timeline. Use cases: alternative text drafts, notes, content markers, "kitbashing" (collecting AI-generated prose for later use).

### 6.4 Formatting

Supported inline formatting: bold, italic, underline, strikethrough. Paragraph styles: heading levels, blockquote. Paragraph and line spacing controls. Alignment (left, center, right, justify).

### 6.5 Subplots

Subplots are tracked as Codex entries of type "Subplot" and can be visualized in the Matrix view.

### 6.6 AI Prose Generation

Triggered via the `/` slash menu, which exposes **two** prose-generation entry points:

- **Scene Beat** — user writes a beat instruction describing what should happen.
- **Continue Writing** — functionally identical to Scene Beat, but the instruction field is pre-populated with an instruction to continue the story. Used when the author wants the model to keep going without further guidance.

Both follow the same flow:

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

### 6.7 Text Replacement Prompts

Select existing prose → choose a text replacement prompt (e.g., "expand", "shorten", "increase tension", "change POV"). The selected text is replaced with the AI-generated result (with the same 4 post-generation options).

> System text replacement prompts are **destructive** — the original text is overwritten. Users who want to preserve the original must copy it first, or author a custom prompt that returns options rather than a replacement.

### 6.8 Codex Highlights in Manuscript

When tracking is enabled for a codex entry, its name and aliases are underlined in the manuscript text. Hovering shows entry details inline.

### 6.9 Square Bracket Instruction Convention `[NEW - courses]`

A prose-level convention for embedding AI meta-instructions directly inside beats and selected text, without needing a separate interface element.

**Syntax:** Wrap any instruction for the AI (not the story itself) in `[square brackets]`. These behave as "stage directions" — guidance on *how* to write the surrounding content, not what happens.

**Usage contexts:**

1. **Inside a scene beat:** Place `[instructions]` at the end of a beat or between action descriptions to direct pacing, tone, emotional register, or scene arc. Example:
   ```
   Bob clutches the phone, catastrophizing. [Slowly build tension — small
   actions to larger moments. Show Bob's irrationality but self-awareness.]
   ```

2. **Inside a text replacement selection:** Include `[expand to third-person past tense]` or similar inside the selected text before triggering a replacement prompt. The instruction guides the rewrite direction.

3. **Inside a Codex entry:** Embed bracketed instructions inside prompt templates stored in Codex entries (see §5 patterns). The brackets signal to the AI that this is an instruction, not lore to be reproduced.

This convention requires no special parsing — it relies on the AI model's ability to distinguish bracketed meta-text from narrative content. It works across all prompt types.

---

## 7. Chat Module (Workshop)

### 7.1 Purpose

An AI chat interface for brainstorming, character interrogation, plot development, and prose analysis. Supports multiple named threads per novel.

### 7.2 Thread Management

- Create, rename, pin, archive, delete threads.
- Split a thread to the left or right of the interface (side-by-side with the manuscript or plan).
- Export/copy conversation history.

### 7.3 Message Bar

Before sending each message the user can configure:

- **Context selection**: attach any combination of:
  - Full novel text and/or outline (optionally filtered by POV character)
  - Specific acts, chapters, scenes
  - Snippets
  - Individual codex entries, or filtered by type/detail/category/tag
- **Prompt**: swap to any Workshop Chat prompt from the library.
- **Model**: change AI model and parameters.
- **Prompt Inputs**: show/hide dynamic input fields defined in the active prompt.

### 7.4 Extract Feature

On any chat message, click "Extract" to parse the AI's response and push content into:

1. **Codex Entries** — create new entries or overwrite existing ones. Parses structured format `Name (aliases) [tags]: Description`.
2. **Chapters** — appends acts/chapters to the Plan view.
3. **Scene Beats** — outputs formatted beats for pasting into the Write interface.

Extract is also available from Snippets (for users without the full context plan).

---

## 8. Prompt System

### 8.1 Prompt Library

Central management interface for all AI prompts and related configurations. Left panel: list of all prompts, presets, model collections, personas, defaults. Right panel: selected item's detail editor.

### 8.2 Prompt Types

| Type | Where Used |
|------|-----------|
| **Scene Beat Completion** | Write interface `/` menu — generates prose from a beat instruction. |
| **Scene Summarization** | Plan and Write action menus — summarizes scene content (~80 words). |
| **Text Replacement** | Write interface — rewrites selected prose. |
| **Workshop Chat** | Chat module — powers AI conversation threads. |

### 8.3 Prompt Anatomy

Each prompt has tabs:

- **General**: name, type, associated models, description (shown in UI for user guidance). Also contains the **Moderation** setting (see §8.12).
- **Instructions**: the system prompt / template text with variable placeholders.
- **Context**: which context blocks are injected (scene, codex, prior text, etc.) and in what order.
- **Inputs**: user-facing input fields (see §8.6).
- **Model Settings**: temperature, max tokens, and other generation parameters that override the model default.

### 8.4 Prompt Components

Reusable prompt fragments that can be inserted into any prompt's instruction template. Managed in the prompt library. System components are read-only; users can create custom components.

### 8.5 Prompt Personas

Cross-project AI personality/instruction sets. A persona defines the AI's "voice" and behavioral guidelines independently of any single prompt. Applied at the account or novel/series level.

### 8.6 Prompt Inputs

User-facing input fields embedded in a prompt. When a user runs the prompt, these fields appear for them to fill in before sending. Input types include text fields, dropdowns, toggles, etc. Can have default values. Used to make prompts reusable with variable parameters (e.g., "tone", "target word count", "character name").

### 8.7 Prompt Presets

Bundles of prompt + model + input default values. Allow a user to save a frequently used configuration and apply it with one click. A Preset differs from a Persona: a Persona sets who the AI is; a Preset sets how to run a specific prompt.

### 8.8 Default Prompts

Users can designate defaults at three scopes:
- **Account-level** defaults (used when no novel or series default is set).
- **Series-level** defaults.
- **Novel-level** defaults.

Separate defaults can be set for: scene beat completion, scene summarization, text replacement, workshop chat.

### 8.9 Sharing Prompts

Prompts can be copied to clipboard in a shareable format. Other users can paste this format to import the prompt into their library.

### 8.10 Cloning Prompts

Any existing prompt (including read-only system prompts) can be cloned to produce an editable copy as the starting point for a custom prompt, rather than authoring one from scratch.

### 8.11 Prompt Organization

Prompts can be grouped into named submenus for easier navigation in context menus.

### 8.12 Prompt Preview

Before sending, the user can preview the fully assembled prompt that will be sent to the AI (with all context blocks resolved). This is also useful for diagnosing which Codex entries are being included and troubleshooting unexpected AI behavior.

### 8.13 NSFW Prompt Flag `[NEW - courses]`

Each prompt has a **Moderation** setting in its General tab. Options include a standard (moderated) mode and an **NSFW** mode.

When a prompt is marked NSFW:
- AI models known to apply content moderation (e.g., GPT, Anthropic Claude via standard API) are **filtered out** of the model selection menu for that prompt. Only NSFW-capable model connections are offered.
- NSFW Codex Details (see §9.2) are included in the AI context when this prompt is used. When a standard (non-NSFW) prompt is used, NSFW details are stripped from context regardless of entry settings.

This allows authors to maintain a single Codex with complete character notes (including sensitive content) and control which information reaches which AI model based on the writing task at hand.

---

## 9. AI Model System

### 9.1 Supported Providers

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

### 9.2 Model Collections

Named groups of AI models. A collection can contain one or more model configurations. Assigned to a prompt to give the user quick-select options at generation time. System collections are read-only; users can create custom collections.

### 9.3 Model Configuration per Entry

Per model in a collection: provider, model ID, API key reference, temperature, top-p, max tokens, stop sequences, presence/frequency penalties.

### 9.4 Thinking / Reasoning Mode

For models that support extended reasoning (e.g., Claude 3.5 Sonnet with extended thinking): toggle and configure reasoning budget tokens.

### 9.5 NSFW Model Handling

NSFW-capable model connections can be configured separately and are gated behind a setting. The UI does not expose NSFW options unless this setting is enabled.

When a prompt is marked NSFW (§8.13), the model picker for that prompt filters to only show NSFW-capable connections, preventing accidental use of moderated models with explicit content.

### 9.6 Per-Detail NSFW Context Flag `[NEW - courses]`

Individual Codex Details (within an entry) can be flagged as **NSFW** via the detail's AI settings tab. This setting has a separate option: "Only include in NSFW prompts".

Behavior:
- When using a **standard prompt**: NSFW-flagged details are stripped from the assembled context, even if the parent entry is included.
- When using an **NSFW prompt** (§8.13): NSFW-flagged details are included normally.

This allows a single Codex entry to serve double duty — general character information flows into all AI sessions, while sensitive details (explicit physical descriptions, graphic combat expertise, trauma history) are held back until a NSFW-capable prompt + model is in use.

A system-defined "Fighting Style" detail is pre-configured as NSFW and ready to add to any character entry.

---

## 10. Snippets

### 10.1 Purpose

Reusable text fragments — e.g., style guides, writing notes, recurring descriptions, research notes. Accessible from the sidebar in all modes.

### 10.2 Anatomy

Each snippet has: name, content (rich text), tags. Snippets can be included as context in Chat messages and can be referenced in prompt templates.

### 10.3 Revision History

Snippet content is versioned (see §12.1).

---

## 11. Import & Export

### 11.1 Import

| Format | Notes |
|--------|-------|
| Word (.docx) | Imports acts, chapters, scenes (via heading structure) |
| Markdown (.md) | Same structural mapping as Word |
| Apple Pages | Same structural mapping |

Import is available both during novel creation and from within the Plan interface.

### 11.2 Export

| Target | Notes |
|--------|-------|
| Standard novel export | Full manuscript as a single document; configurable format |
| Scrivener (.scriv) | Exports acts/chapters/scenes into a Scrivener project structure |
| Atticus | Exports into Atticus-compatible format |

---

## 12. Organization & Content Management

### 12.1 Revision History (Versioning)

Auto-versioned content types:
- Scene content
- Scene summary
- Codex entry description
- Codex entry notes
- Snippet content
- Custom prompt instructions

Users can open a version history modal, browse past versions, preview any version, and restore a selected version.

### 12.2 Archiving

- Acts, chapters, scenes: archivable individually; archived items hidden from main views but restorable.
- Novels/series: archivable from the library. Archived novels appear in a separate "archived" view.
- Chat threads: archivable.

### 12.3 Scene Labels

User-defined color-coded labels attached to scenes. Visible in Grid and Matrix views. Useful for tracking edit status, scene type, location presence, or any custom workflow state.

Scene labels and Codex entry colors are both surfaced in Matrix column headers, making combined visual tracking possible (e.g., POV row + location labels + codex entry columns).

### 12.4 Cover Images

Novels and codex entries can have cover/avatar images uploaded.

### 12.5 Deleting

Permanent delete available for acts, chapters, scenes (with confirmation). Distinct from archiving.

---

## 13. Collaboration

### 13.1 Inviting Collaborators

From novel or series settings → Collaboration tab → invite by email address. **Invited users must already have a Novelcrafter account** (the invite does not create one). Two roles:

| Role | Access |
|------|--------|
| **Viewer** | Read-only. Does not require a paid subscription. |
| **Editor** | Full edit access. Requires a "Scribe" subscription on the collaborator's account. |

### 13.2 Novel Collaboration

Grants collaborator access to the book and all its data.

### 13.3 Series Collaboration

Grants collaborator access to the **series codex only**. Does not grant access to individual books within the series.

### 13.4 Current Limitations

No real-time co-editing (changes are not reflected live). Collaboration is intended for asynchronous review/editing workflows, not simultaneous writing. Invited users receive no automated notification.

---

## 14. Non-Functional Requirements

### 14.1 Autosave

All content is autosaved continuously. A sync indicator in the sidebar confirms save status.

### 14.2 Responsive Layout

The interface must function on small screens (tablet/mobile). The top navigation collapses to a dropdown; the sidebar collapses to icon-only or is hidden behind a toggle.

### 14.3 AI Provider Flexibility

Users supply their own API keys for external AI providers. The system must not require a specific provider — any configured and enabled connection should work.

### 14.4 Data Privacy

Codex entries marked "Never include" must never be transmitted to any AI provider. NSFW-flagged details must not be included in non-NSFW prompt contexts. Both constraints must be enforced server-side (or client-side if fully local), not merely by UI convention.

### 14.5 Extensibility

The prompt system (components, personas, presets, inputs) should allow advanced users to build highly customized AI workflows without modifying application code.

---

## 15. Out of Scope (Novelcrafter-specific commercial features)

The following exist in Novelcrafter but are out of scope for an open-source alternative unless specifically adopted:

- Hosted AI credits / usage billing.
- Paid subscription tiers gating features.
- In-app educational courses and Monthly Muse newsletter.
- Name generator tools.
- NSFW-specific model marketplace.

---

## 16. Glossary

| Term | Definition |
|------|-----------|
| **Act** | Top-level structural division of a novel. |
| **Automatic Numeration** | Per act/chapter toggle that excludes it from sequential numbering, enabling unnumbered prologues, epilogues, or interludes. |
| **Beat** | A scene-level instruction describing what should happen; used as AI generation context. |
| **Chapter** | Second-level structural division, inside an act. |
| **Codex** | The story bible — database of all world-building entities. |
| **Codex Detail** | A structured key/value attribute of a codex entry (e.g., Age, Role, Voice Sheet). |
| **Codex Detail NSFW Flag** | A per-detail setting that restricts the detail's AI context inclusion to NSFW-flagged prompts only. |
| **Codex Progression** | A time-anchored change to a codex entry, visible to AI only from that scene onward. |
| **Extract** | Feature to parse AI chat output and push structured data into Codex, Plan, or beats. |
| **Matrix** | Spreadsheet-style plan view mapping scenes against codex entries, POV, labels, etc. |
| **Model Collection** | A named group of AI model configurations assignable to a prompt. |
| **Persona** | Account-level AI behavioral instruction set applied across prompts. |
| **Preset** | Saved combination of prompt + model + input defaults for one-click reuse. |
| **Prompt Component** | Reusable prompt fragment insertable into any prompt template. |
| **Prompt Input** | Dynamic user-facing field within a prompt, filled at generation time. |
| **Prompt NSFW Flag** | A per-prompt moderation setting that filters model selection to NSFW-capable connections and enables NSFW Codex details. |
| **Scene** | The lowest structural unit in the hierarchy; contains beats and prose. |
| **Scene Codex Context** | Codex entries manually attached to a scene via the + Codex button; injected into AI context for all beats in that scene. |
| **Section** | A colored inline block inside a scene used for alternatives, notes, or kitbashing. |
| **Series Codex** | A codex shared across multiple books in a series. |
| **Snippet** | A named, reusable text fragment available as AI context or reference material. |
| **Square Bracket Convention** | Embedding `[instructions]` in beats or prose to signal AI meta-directives without them being treated as story content. |
| **Topic Hub** | A Codex entry of type Other that links multiple research source entries via Relations, aggregating their context. |
| **Tracking** | Automatic detection and highlighting of a codex entry's name/aliases in the manuscript. |
| **Voice Sheet** | A custom Codex detail containing example dialogue to guide AI characterization. |
| **Workshop Chat** | The AI chat interface used for brainstorming, analysis, and planning. |