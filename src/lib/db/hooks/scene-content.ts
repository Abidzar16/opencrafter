import { useState, useEffect } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import db from '../db'
import { compressJSON, decompressJSON } from '../compression'
import type { SceneContent } from '@/types'

export function useSceneContent(sceneId: string | undefined) {
  return useLiveQuery(() => (sceneId ? db.scene_content.get(sceneId) : undefined), [sceneId])
}

/**
 * Like `useSceneContent` but transparently decompresses large documents.
 * Prefer this hook in rendering components; use `useSceneContent` only when
 * you need the raw DB record (e.g. before overwriting with a revision).
 */
export function useSceneContentDecoded(sceneId: string | undefined) {
  const raw = useSceneContent(sceneId)
  const [decoded, setDecoded] = useState<SceneContent | undefined>(undefined)

  useEffect(() => {
    if (raw === undefined) {
      setDecoded(undefined)
      return
    }
    if (!raw._compressed) {
      setDecoded(raw)
      return
    }
    decompressJSON(raw._compressed).then(content => {
      setDecoded({ id: raw.id, content })
    })
  }, [raw])

  return decoded
}

export function useSaveSceneContent() {
  return async (sceneId: string, content: Record<string, unknown>): Promise<void> => {
    const compressed = await compressJSON(content)
    if (compressed) {
      await db.scene_content.put({ id: sceneId, content: {}, _compressed: compressed } satisfies SceneContent)
    } else {
      await db.scene_content.put({ id: sceneId, content } satisfies SceneContent)
    }
  }
}
