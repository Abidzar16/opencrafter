export interface Beat {
  id: string
  text: string
  order: number
}

export interface Act {
  id: string
  novelId: string
  title: string
  order: number
  archived: boolean
}

export interface Chapter {
  id: string
  actId: string
  novelId: string
  title: string
  subtitle?: string
  summary?: string
  order: number
  archived: boolean
}

export interface Scene {
  id: string
  chapterId: string
  novelId: string
  title: string
  subtitle?: string
  summary?: string
  beats: Beat[]
  povCharacterId?: string
  labels: string[]
  codexAssociations: string[]
  wordCount: number
  order: number
  archived: boolean
}

export interface SceneContent {
  id: string
  content: Record<string, unknown>
  /** Gzip-compressed JSON; set for large documents (> 50 KB). content is {} when this is present. */
  _compressed?: Uint8Array
}
