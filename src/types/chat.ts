export enum ChatRole {
  User = 'user',
  Assistant = 'assistant',
}

export type ContextAttachmentType =
  | 'full_novel'
  | 'act'
  | 'chapter'
  | 'scene'
  | 'codex_entry'
  | 'snippet'

export interface ContextAttachment {
  type: ContextAttachmentType
  id: string
  label: string
}

export interface ChatThread {
  id: string
  novelId: string
  name: string
  pinned: boolean
  archived: boolean
  createdAt: number
  updatedAt: number
}

export interface ChatMessage {
  id: string
  threadId: string
  role: ChatRole
  content: string
  contextSnapshot?: ContextAttachment[]
  createdAt: number
}
