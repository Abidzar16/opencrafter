import { useLiveQuery } from 'dexie-react-hooks'
import db from '../db'
import type { Act, Chapter, Scene } from '@/types'

// Acts

export function useActs(novelId: string | undefined) {
  return useLiveQuery(
    () =>
      novelId
        ? db.acts.where('[novelId+order]').between([novelId, -Infinity], [novelId, Infinity]).toArray()
        : [],
    [novelId],
  )
}

export function useAct(id: string | undefined) {
  return useLiveQuery(() => (id ? db.acts.get(id) : undefined), [id])
}

export function useCreateAct() {
  return async (data: Omit<Act, 'id'>): Promise<string> => {
    const id = crypto.randomUUID()
    await db.acts.add({ id, ...data })
    return id
  }
}

export function useUpdateAct() {
  return async (id: string, data: Partial<Act>): Promise<void> => {
    await db.acts.update(id, data)
  }
}

export function useDeleteAct() {
  return async (id: string): Promise<void> => {
    const act = await db.acts.get(id)
    if (!act) return
    const chapters = await db.chapters.where('actId').equals(id).toArray()
    const chapterIds = chapters.map(c => c.id)
    const scenes = await db.scenes.where('chapterId').anyOf(chapterIds).toArray()
    const sceneIds = scenes.map(s => s.id)

    await db.transaction('rw', [db.acts, db.chapters, db.scenes, db.scene_content], async () => {
      await db.scene_content.bulkDelete(sceneIds)
      await db.scenes.where('chapterId').anyOf(chapterIds).delete()
      await db.chapters.where('actId').equals(id).delete()
      await db.acts.delete(id)
    })
  }
}

// Chapters

export function useChapters(novelId: string | undefined) {
  return useLiveQuery(
    () =>
      novelId
        ? db.chapters.where('[novelId+order]').between([novelId, -Infinity], [novelId, Infinity]).toArray()
        : [],
    [novelId],
  )
}

export function useChaptersByAct(actId: string | undefined) {
  return useLiveQuery(
    () => (actId ? db.chapters.where('actId').equals(actId).sortBy('order') : []),
    [actId],
  )
}

export function useChapter(id: string | undefined) {
  return useLiveQuery(() => (id ? db.chapters.get(id) : undefined), [id])
}

export function useCreateChapter() {
  return async (data: Omit<Chapter, 'id'>): Promise<string> => {
    const id = crypto.randomUUID()
    await db.chapters.add({ id, ...data })
    return id
  }
}

export function useUpdateChapter() {
  return async (id: string, data: Partial<Chapter>): Promise<void> => {
    await db.chapters.update(id, data)
  }
}

export function useDeleteChapter() {
  return async (id: string): Promise<void> => {
    const scenes = await db.scenes.where('chapterId').equals(id).toArray()
    const sceneIds = scenes.map(s => s.id)

    await db.transaction('rw', [db.chapters, db.scenes, db.scene_content], async () => {
      await db.scene_content.bulkDelete(sceneIds)
      await db.scenes.where('chapterId').equals(id).delete()
      await db.chapters.delete(id)
    })
  }
}

// Scenes

export function useScenes(novelId: string | undefined) {
  return useLiveQuery(
    () =>
      novelId
        ? db.scenes.where('[novelId+order]').between([novelId, -Infinity], [novelId, Infinity]).toArray()
        : [],
    [novelId],
  )
}

export function useScenesByChapter(chapterId: string | undefined) {
  return useLiveQuery(
    () => (chapterId ? db.scenes.where('chapterId').equals(chapterId).sortBy('order') : []),
    [chapterId],
  )
}

export function useScene(id: string | undefined) {
  return useLiveQuery(() => (id ? db.scenes.get(id) : undefined), [id])
}

export function useCreateScene() {
  return async (data: Omit<Scene, 'id'>): Promise<string> => {
    const id = crypto.randomUUID()
    await db.scenes.add({ id, ...data })
    await db.scene_content.add({ id, content: {} })
    return id
  }
}

export function useUpdateScene() {
  return async (id: string, data: Partial<Scene>): Promise<void> => {
    await db.scenes.update(id, data)
  }
}

export function useDeleteScene() {
  return async (id: string): Promise<void> => {
    await db.transaction('rw', [db.scenes, db.scene_content], async () => {
      await db.scene_content.delete(id)
      await db.scenes.delete(id)
    })
  }
}
