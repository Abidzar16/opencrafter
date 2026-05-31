import { useLiveQuery } from 'dexie-react-hooks'
import db from '../db'
import type { Label } from '@/types'

export function useLabels(novelId: string | undefined) {
  return useLiveQuery(
    () => (novelId ? db.labels.where('novelId').equals(novelId).toArray() : []),
    [novelId],
  )
}

export function useCreateLabel() {
  return async (data: Omit<Label, 'id'>): Promise<string> => {
    const id = crypto.randomUUID()
    await db.labels.add({ id, ...data })
    return id
  }
}

export function useUpdateLabel() {
  return async (id: string, data: Partial<Label>): Promise<void> => {
    await db.labels.update(id, data)
  }
}

export function useDeleteLabel() {
  return async (id: string): Promise<void> => {
    await db.labels.delete(id)
  }
}
