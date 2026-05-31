export enum RevisionEntityType {
  SceneContent = 'scene_content',
  SceneSummary = 'scene_summary',
  CodexDescription = 'codex_description',
  CodexNotes = 'codex_notes',
  SnippetContent = 'snippet_content',
  PromptInstructions = 'prompt_instructions',
}

export interface Revision {
  id: string
  entityType: RevisionEntityType
  entityId: string
  content: string
  createdAt: number
}
