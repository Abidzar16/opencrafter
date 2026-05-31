export enum PromptType {
  BeatCompletion = 'beat_completion',
  Summarization = 'summarization',
  TextReplacement = 'text_replacement',
  WorkshopChat = 'workshop_chat',
}

export type PromptInputType = 'text' | 'textarea' | 'dropdown' | 'toggle'

export interface PromptInputOption {
  label: string
  value: string
}

export interface PromptInput {
  id: string
  key: string
  label: string
  type: PromptInputType
  options?: PromptInputOption[]
  defaultValue?: string
  required: boolean
}

export interface ContextBlockConfig {
  blockType:
    | 'scene_content'
    | 'scene_summary'
    | 'beats'
    | 'prior_text'
    | 'codex'
    | 'snippets'
  enabled: boolean
  order: number
}

export interface PromptModelSettings {
  temperature?: number
  maxTokens?: number
}

export interface Prompt {
  id: string
  name: string
  type: PromptType
  description?: string
  instructions: string
  contextConfig: ContextBlockConfig[]
  inputs: PromptInput[]
  modelSettings: PromptModelSettings
  groupId?: string
  readOnly: boolean
  createdAt: number
  updatedAt: number
}

export interface PromptComponent {
  id: string
  name: string
  content: string
  readOnly: boolean
}

export type PersonaScope = 'account' | 'novel'

export interface PromptPersona {
  id: string
  name: string
  instructions: string
  scope: PersonaScope
  novelId?: string
}

export interface PromptPreset {
  id: string
  promptId: string
  name: string
  modelConfigId?: string
  inputDefaults: Record<string, string>
}

export interface ModelConfig {
  id: string
  name: string
  provider: string
  modelId: string
  apiKeyRef?: string
  temperature?: number
  topP?: number
  maxTokens?: number
  stopSequences?: string[]
  presencePenalty?: number
  frequencyPenalty?: number
  thinking?: boolean
  thinkingBudgetTokens?: number
}

export interface ModelCollection {
  id: string
  name: string
  modelConfigIds: string[]
  readOnly: boolean
}
