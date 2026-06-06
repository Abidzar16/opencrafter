export interface ExportScene {
  id: string
  title: string
  summary?: string
  content: string  // plain text extracted from Tiptap JSON
}

export interface ExportChapter {
  id: string
  title: string
  scenes: ExportScene[]
}

export interface ExportAct {
  id: string
  title: string
  chapters: ExportChapter[]
}

export interface ExportManuscript {
  novelTitle: string
  acts: ExportAct[]
}

export type ExportFormat = 'markdown' | 'docx' | 'scrivener' | 'txt'

export interface ExportConfig {
  format: ExportFormat
  includeFrontMatter: boolean
  selectedActIds: string[] | 'all'
}
