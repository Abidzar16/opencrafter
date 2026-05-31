import db from '../db'

type OrderedTable = 'acts' | 'chapters' | 'scenes'

/**
 * Persists a new order for a list of items by writing the `order` field
 * for each item. IDs must be in the desired final order.
 */
export async function persistOrder(table: OrderedTable, orderedIds: string[]): Promise<void> {
  const updates = orderedIds.map((id, index) => db[table].update(id, { order: index }))
  await Promise.all(updates)
}

export function useOrderedItems() {
  return persistOrder
}
