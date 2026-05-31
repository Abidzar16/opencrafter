import { useLiveQuery } from 'dexie-react-hooks'
import db from '../db'
import type { Revision, RevisionEntityType } from '@/types'

const MAX_REVISIONS_PER_ENTITY = 50

export function useRevisions(entityType: RevisionEntityType | undefined, entityId: string | undefined) {
  return useLiveQuery(
    () =>
      entityType && entityId
        ? db.revisions
            .where('entityId')
            .equals(entityId)
            .filter(r => r.entityType === entityType)
            .reverse()
            .sortBy('createdAt')
        : [],
    [entityType, entityId],
  )
}

export function useCreateRevision() {
  return async (data: Omit<Revision, 'id' | 'createdAt'>): Promise<void> => {
    const id = crypto.randomUUID()
    await db.revisions.add({ id, ...data, createdAt: Date.now() })

    // Prune: keep only the latest N revisions per entity
    const all = await db.revisions
      .where('entityId')
      .equals(data.entityId)
      .filter(r => r.entityType === data.entityType)
      .sortBy('createdAt')
    if (all.length > MAX_REVISIONS_PER_ENTITY) {
      const toDelete = all.slice(0, all.length - MAX_REVISIONS_PER_ENTITY).map(r => r.id)
      await db.revisions.bulkDelete(toDelete)
    }
  }
}

export function useDeleteRevision() {
  return async (id: string): Promise<void> => {
    await db.revisions.delete(id)
  }
}
