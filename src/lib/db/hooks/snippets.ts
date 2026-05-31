import { useLiveQuery } from 'dexie-react-hooks'
import db from '../db'
import type { Snippet } from '@/types'

export function useSnippets(novelId: string | undefined) {
  return useLiveQuery(
    () => (novelId ? db.snippets.where('novelId').equals(novelId).toArray() : []),
    [novelId],
  )
}

export function useSnippet(id: string | undefined) {
  return useLiveQuery(() => (id ? db.snippets.get(id) : undefined), [id])
}

export function useCreateSnippet() {
  return async (data: Omit<Snippet, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    const id = crypto.randomUUID()
    const now = Date.now()
    await db.snippets.add({ id, ...data, createdAt: now, updatedAt: now })
    return id
  }
}

export function useUpdateSnippet() {
  return async (id: string, data: Partial<Snippet>): Promise<void> => {
    await db.snippets.update(id, { ...data, updatedAt: Date.now() })
  }
}

export function useDeleteSnippet() {
  return async (id: string): Promise<void> => {
    await db.snippets.delete(id)
  }
}
