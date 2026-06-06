import Dexie, { type EntityTable } from 'dexie'
import type {
  Novel,
  Series,
  Act,
  Chapter,
  Scene,
  SceneContent,
  CodexEntry,
  CodexRelation,
  CodexProgression,
  Snippet,
  ChatThread,
  ChatMessage,
  Prompt,
  PromptComponent,
  PromptPersona,
  PromptPreset,
  ModelConfig,
  ApiKey,
  Revision,
  Label,
} from '@/types'

// Extend ModelConfig for storage (ModelCollection is not a separate table)
type StoredModelConfig = ModelConfig

export type StoredApiKey = ApiKey

export class OpenCrafterDB extends Dexie {
  novels!: EntityTable<Novel, 'id'>
  series!: EntityTable<Series, 'id'>
  acts!: EntityTable<Act, 'id'>
  chapters!: EntityTable<Chapter, 'id'>
  scenes!: EntityTable<Scene, 'id'>
  scene_content!: EntityTable<SceneContent, 'id'>
  codex_entries!: EntityTable<CodexEntry, 'id'>
  codex_relations!: EntityTable<CodexRelation, 'id'>
  codex_progressions!: EntityTable<CodexProgression, 'id'>
  snippets!: EntityTable<Snippet, 'id'>
  chat_threads!: EntityTable<ChatThread, 'id'>
  chat_messages!: EntityTable<ChatMessage, 'id'>
  prompts!: EntityTable<Prompt, 'id'>
  prompt_components!: EntityTable<PromptComponent, 'id'>
  prompt_personas!: EntityTable<PromptPersona, 'id'>
  prompt_presets!: EntityTable<PromptPreset, 'id'>
  model_configs!: EntityTable<StoredModelConfig, 'id'>
  api_keys!: EntityTable<StoredApiKey, 'id'>
  revisions!: EntityTable<Revision, 'id'>
  labels!: EntityTable<Label, 'id'>

  constructor() {
    super('opencrafter')

    // Version 1 — baseline schema
    this.version(1).stores({
      novels: 'id, seriesId, archived, updatedAt',
      series: 'id',
      acts: 'id, novelId, [novelId+order]',
      chapters: 'id, actId, novelId, [novelId+order]',
      scenes: 'id, chapterId, novelId, [novelId+order]',
      scene_content: 'id',
      codex_entries: 'id, novelId, type, [novelId+type]',
      codex_relations: 'id, fromId, toId',
      codex_progressions: 'id, entryId, novelId, sceneId',
      snippets: 'id, novelId',
      chat_threads: 'id, novelId',
      chat_messages: 'id, threadId',
      prompts: 'id, type',
      prompt_components: 'id',
      prompt_personas: 'id',
      prompt_presets: 'id, promptId',
      model_configs: 'id',
      api_keys: 'id, provider',
      revisions: 'id, entityType, entityId',
      labels: 'id, novelId',
    })

    // Version 2 — add seriesId index to codex_entries for series-level codex support
    this.version(2).stores({
      codex_entries: 'id, novelId, seriesId, type, [novelId+type]',
    })
  }
}
