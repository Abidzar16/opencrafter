import { useLiveQuery } from 'dexie-react-hooks'
import db from '../db'
import type { Novel, Series } from '@/types'

export function useNovels() {
  return useLiveQuery(() => db.novels.orderBy('updatedAt').reverse().toArray(), [])
}

export function useNovel(id: string | undefined) {
  return useLiveQuery(() => (id ? db.novels.get(id) : undefined), [id])
}

export function useNovelsInSeries(seriesId: string | undefined) {
  return useLiveQuery(
    () => (seriesId ? db.novels.where('seriesId').equals(seriesId).toArray() : []),
    [seriesId],
  )
}

export function useCreateNovel() {
  return async (
    data: Omit<Novel, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<string> => {
    const id = crypto.randomUUID()
    const now = Date.now()
    await db.novels.add({ id, ...data, createdAt: now, updatedAt: now })
    return id
  }
}

export function useUpdateNovel() {
  return async (id: string, data: Partial<Novel>): Promise<void> => {
    await db.novels.update(id, { ...data, updatedAt: Date.now() })
  }
}

export function useDeleteNovel() {
  return async (id: string): Promise<void> => {
    await db.transaction('rw', [
      db.novels, db.acts, db.chapters, db.scenes, db.scene_content,
      db.codex_entries, db.codex_relations, db.codex_progressions,
      db.snippets, db.chat_threads, db.chat_messages, db.labels,
    ], async () => {
      const acts = await db.acts.where('novelId').equals(id).toArray()
      const actIds = acts.map(a => a.id)
      const chapters = await db.chapters.where('novelId').equals(id).toArray()
      const chapterIds = chapters.map(c => c.id)
      const scenes = await db.scenes.where('novelId').equals(id).toArray()
      const sceneIds = scenes.map(s => s.id)

      await db.scene_content.bulkDelete(sceneIds)
      await db.scenes.where('novelId').equals(id).delete()
      await db.chapters.where('novelId').equals(id).delete()
      await db.acts.where('novelId').equals(id).delete()

      const codexEntries = await db.codex_entries.where('novelId').equals(id).toArray()
      const entryIds = codexEntries.map(e => e.id)
      await db.codex_progressions.where('novelId').equals(id).delete()
      await db.codex_relations.where('fromId').anyOf(entryIds).delete()
      await db.codex_relations.where('toId').anyOf(entryIds).delete()
      await db.codex_entries.where('novelId').equals(id).delete()

      await db.snippets.where('novelId').equals(id).delete()

      const threads = await db.chat_threads.where('novelId').equals(id).toArray()
      const threadIds = threads.map(t => t.id)
      await db.chat_messages.where('threadId').anyOf(threadIds).delete()
      await db.chat_threads.where('novelId').equals(id).delete()

      await db.labels.where('novelId').equals(id).delete()
      await db.novels.delete(id)

      void actIds; void chapterIds; // used implicitly via scenes
    })
  }
}

// Series

export function useSeries() {
  return useLiveQuery(() => db.series.toArray(), [])
}

export function useOneSeries(id: string | undefined) {
  return useLiveQuery(() => (id ? db.series.get(id) : undefined), [id])
}

export function useCreateSeries() {
  return async (data: Omit<Series, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    const id = crypto.randomUUID()
    const now = Date.now()
    await db.series.add({ id, ...data, createdAt: now, updatedAt: now })
    return id
  }
}

export function useUpdateSeries() {
  return async (id: string, data: Partial<Series>): Promise<void> => {
    await db.series.update(id, { ...data, updatedAt: Date.now() })
  }
}

export function useDeleteSeries() {
  return async (id: string): Promise<void> => {
    // unlink novels from this series, then delete
    await db.novels.where('seriesId').equals(id).modify({ seriesId: undefined })
    await db.series.delete(id)
  }
}
