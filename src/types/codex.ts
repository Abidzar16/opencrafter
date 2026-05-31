export enum CodexType {
  Character = 'character',
  Location = 'location',
  Object = 'object',
  Lore = 'lore',
  Subplot = 'subplot',
  Other = 'other',
}

export enum AiContextMode {
  AlwaysInclude = 'always_include',
  IncludeWhenDetected = 'include_when_detected',
  NotWhenDetected = 'not_when_detected',
  NeverInclude = 'never_include',
}

export interface TrackingSettings {
  enabled: boolean
  caseSensitive: boolean
  exclusions: string[]
}

export interface CodexDetail {
  id: string
  key: string
  value: string
  order: number
}

export interface CodexEntry {
  id: string
  novelId: string
  type: CodexType
  name: string
  aliases: string[]
  description: Record<string, unknown>
  notes: Record<string, unknown>
  details: CodexDetail[]
  tags: string[]
  coverImage?: string
  category?: string
  trackingSettings: TrackingSettings
  aiContextMode: AiContextMode
  mentionCount: number
  createdAt: number
  updatedAt: number
}

export interface CodexRelation {
  id: string
  fromId: string
  toId: string
  relationType: string
}

export type CodexProgressionMode = 'addition' | 'replacement'

export interface CodexProgression {
  id: string
  entryId: string
  sceneId: string
  novelId: string
  mode: CodexProgressionMode
  content: string
  detailKey?: string
}
