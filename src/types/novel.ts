export type SceneDividerStyle = 'line' | 'asterisks' | 'blank' | 'custom'

export interface NovelSettings {
  defaultPersonaId?: string
  defaultBeatCompletionPromptId?: string
  defaultSummarizationPromptId?: string
  defaultTextReplacementPromptId?: string
  defaultChatPromptId?: string
  fontFamily?: string
  fontSize?: number
  paragraphSpacing?: number
  paragraphWidth?: number
  sceneDividerStyle?: SceneDividerStyle
  sceneDividerCustom?: string
}

export interface Novel {
  id: string
  title: string
  description?: string
  coverImage?: string
  seriesId?: string
  settings: NovelSettings
  archived: boolean
  createdAt: number
  updatedAt: number
}

export interface Series {
  id: string
  name: string
  coverImage?: string
  createdAt: number
  updatedAt: number
}
