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

export function useDuplicateAct() {
  return async (id: string): Promise<string> => {
    const act = await db.acts.get(id)
    if (!act) throw new Error('Act not found')

    const maxOrder = await db.acts.where('novelId').equals(act.novelId).count()
    const newActId = crypto.randomUUID()

    const chapters = await db.chapters.where('actId').equals(id).sortBy('order')

    await db.transaction('rw', [db.acts, db.chapters, db.scenes, db.scene_content], async () => {
      await db.acts.add({ ...act, id: newActId, title: `Copy of ${act.title}`, order: maxOrder })

      for (const chapter of chapters) {
        const newChapterId = crypto.randomUUID()
        const scenes = await db.scenes.where('chapterId').equals(chapter.id).sortBy('order')

        await db.chapters.add({ ...chapter, id: newChapterId, actId: newActId })

        for (const scene of scenes) {
          const newSceneId = crypto.randomUUID()
          const content = await db.scene_content.get(scene.id)
          await db.scenes.add({ ...scene, id: newSceneId, chapterId: newChapterId })
          await db.scene_content.add({ id: newSceneId, content: content?.content ?? {} })
        }
      }
    })

    return newActId
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

export function useDuplicateChapter() {
  return async (id: string): Promise<string> => {
    const chapter = await db.chapters.get(id)
    if (!chapter) throw new Error('Chapter not found')

    const siblings = await db.chapters.where('actId').equals(chapter.actId).sortBy('order')
    const newChapterId = crypto.randomUUID()
    const scenes = await db.scenes.where('chapterId').equals(id).sortBy('order')

    await db.transaction('rw', [db.chapters, db.scenes, db.scene_content], async () => {
      await db.chapters.add({
        ...chapter,
        id: newChapterId,
        title: `Copy of ${chapter.title}`,
        order: siblings.length,
      })

      for (const scene of scenes) {
        const newSceneId = crypto.randomUUID()
        const content = await db.scene_content.get(scene.id)
        await db.scenes.add({ ...scene, id: newSceneId, chapterId: newChapterId })
        await db.scene_content.add({ id: newSceneId, content: content?.content ?? {} })
      }
    })

    return newChapterId
  }
}

export function useMoveChapter() {
  return async (chapterId: string, targetActId: string): Promise<void> => {
    const chapter = await db.chapters.get(chapterId)
    if (!chapter) return
    const siblings = await db.chapters.where('actId').equals(targetActId).sortBy('order')
    await db.chapters.update(chapterId, { actId: targetActId, order: siblings.length })
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

export function useDuplicateScene() {
  return async (id: string): Promise<string> => {
    const scene = await db.scenes.get(id)
    if (!scene) throw new Error('Scene not found')

    const siblings = await db.scenes.where('chapterId').equals(scene.chapterId).sortBy('order')
    const newSceneId = crypto.randomUUID()
    const content = await db.scene_content.get(id)

    await db.transaction('rw', [db.scenes, db.scene_content], async () => {
      await db.scenes.add({
        ...scene,
        id: newSceneId,
        title: `Copy of ${scene.title}`,
        order: siblings.length,
        wordCount: 0,
      })
      await db.scene_content.add({ id: newSceneId, content: content?.content ?? {} })
    })

    return newSceneId
  }
}

export function useMoveScene() {
  return async (sceneId: string, targetChapterId: string): Promise<void> => {
    const scene = await db.scenes.get(sceneId)
    if (!scene) return
    const targetChapter = await db.chapters.get(targetChapterId)
    if (!targetChapter) return
    const siblings = await db.scenes.where('chapterId').equals(targetChapterId).sortBy('order')
    await db.scenes.update(sceneId, {
      chapterId: targetChapterId,
      order: siblings.length,
    })
  }
}

// Archived queries

export function useArchivedActs(novelId: string | undefined) {
  return useLiveQuery(
    () => (novelId ? db.acts.where('novelId').equals(novelId).filter(a => a.archived).toArray() : []),
    [novelId],
  )
}

export function useArchivedChapters(novelId: string | undefined) {
  return useLiveQuery(
    () =>
      novelId ? db.chapters.where('novelId').equals(novelId).filter(c => c.archived).toArray() : [],
    [novelId],
  )
}

export function useArchivedScenes(novelId: string | undefined) {
  return useLiveQuery(
    () =>
      novelId ? db.scenes.where('novelId').equals(novelId).filter(s => s.archived).toArray() : [],
    [novelId],
  )
}
