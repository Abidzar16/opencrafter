import { useCallback } from 'react'
import { useCreateRevision } from '@/lib/db/hooks/revisions'
import type { RevisionEntityType } from '@/types'

/**
 * Returns a stable async function that snapshots current content into the
 * revisions table. Call it *before* overwriting the entity's stored content.
 */
export function useRevision(entityType: RevisionEntityType, entityId: string | undefined) {
  const createRevision = useCreateRevision()

  return useCallback(
    async (content: string) => {
      if (!entityId || !content) return
      await createRevision({ entityType, entityId, content })
    },
    [createRevision, entityType, entityId],
  )
}
