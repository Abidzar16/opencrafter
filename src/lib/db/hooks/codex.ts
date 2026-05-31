import { useLiveQuery } from 'dexie-react-hooks'
import db from '../db'
import type { CodexEntry, CodexRelation, CodexProgression, CodexType } from '@/types'

// Codex Entries

export function useCodexEntries(novelId: string | undefined) {
  return useLiveQuery(
    () => (novelId ? db.codex_entries.where('novelId').equals(novelId).toArray() : []),
    [novelId],
  )
}

export function useCodexEntriesByType(novelId: string | undefined, type: CodexType | undefined) {
  return useLiveQuery(
    () =>
      novelId && type
        ? db.codex_entries.where('[novelId+type]').equals([novelId, type]).toArray()
        : [],
    [novelId, type],
  )
}

export function useCodexEntry(id: string | undefined) {
  return useLiveQuery(() => (id ? db.codex_entries.get(id) : undefined), [id])
}

export function useCreateCodexEntry() {
  return async (data: Omit<CodexEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    const id = crypto.randomUUID()
    const now = Date.now()
    await db.codex_entries.add({ id, ...data, createdAt: now, updatedAt: now })
    return id
  }
}

export function useUpdateCodexEntry() {
  return async (id: string, data: Partial<CodexEntry>): Promise<void> => {
    await db.codex_entries.update(id, { ...data, updatedAt: Date.now() })
  }
}

export function useDeleteCodexEntry() {
  return async (id: string): Promise<void> => {
    await db.transaction('rw', [db.codex_entries, db.codex_relations, db.codex_progressions], async () => {
      await db.codex_relations.where('fromId').equals(id).delete()
      await db.codex_relations.where('toId').equals(id).delete()
      await db.codex_progressions.where('entryId').equals(id).delete()
      await db.codex_entries.delete(id)
    })
  }
}

// Codex Relations

export function useCodexRelations(entryId: string | undefined) {
  return useLiveQuery(
    () =>
      entryId
        ? Promise.all([
            db.codex_relations.where('fromId').equals(entryId).toArray(),
            db.codex_relations.where('toId').equals(entryId).toArray(),
          ]).then(([outbound, inbound]) => ({ outbound, inbound }))
        : { outbound: [], inbound: [] },
    [entryId],
  )
}

export function useCreateCodexRelation() {
  return async (data: Omit<CodexRelation, 'id'>): Promise<string> => {
    const id = crypto.randomUUID()
    await db.codex_relations.add({ id, ...data })
    return id
  }
}

export function useDeleteCodexRelation() {
  return async (id: string): Promise<void> => {
    await db.codex_relations.delete(id)
  }
}

// Codex Progressions

export function useCodexProgressions(entryId: string | undefined) {
  return useLiveQuery(
    () => (entryId ? db.codex_progressions.where('entryId').equals(entryId).toArray() : []),
    [entryId],
  )
}

export function useCodexProgressionsByNovel(novelId: string | undefined) {
  return useLiveQuery(
    () => (novelId ? db.codex_progressions.where('novelId').equals(novelId).toArray() : []),
    [novelId],
  )
}

export function useCreateCodexProgression() {
  return async (data: Omit<CodexProgression, 'id'>): Promise<string> => {
    const id = crypto.randomUUID()
    await db.codex_progressions.add({ id, ...data })
    return id
  }
}

export function useUpdateCodexProgression() {
  return async (id: string, data: Partial<CodexProgression>): Promise<void> => {
    await db.codex_progressions.update(id, data)
  }
}

export function useDeleteCodexProgression() {
  return async (id: string): Promise<void> => {
    await db.codex_progressions.delete(id)
  }
}
