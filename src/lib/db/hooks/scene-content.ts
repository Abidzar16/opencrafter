import { useLiveQuery } from 'dexie-react-hooks'
import db from '../db'
import type { SceneContent } from '@/types'

export function useSceneContent(sceneId: string | undefined) {
  return useLiveQuery(() => (sceneId ? db.scene_content.get(sceneId) : undefined), [sceneId])
}

export function useSaveSceneContent() {
  return async (sceneId: string, content: Record<string, unknown>): Promise<void> => {
    await db.scene_content.put({ id: sceneId, content } satisfies SceneContent)
  }
}
