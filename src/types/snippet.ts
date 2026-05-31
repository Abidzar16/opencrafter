export interface Snippet {
  id: string
  novelId: string
  name: string
  content: Record<string, unknown>
  tags: string[]
  createdAt: number
  updatedAt: number
}
