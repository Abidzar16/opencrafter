import { useLiveQuery } from 'dexie-react-hooks'
import db from '../db'
import type { ChatThread, ChatMessage } from '@/types'

// Threads

export function useChatThreads(novelId: string | undefined) {
  return useLiveQuery(
    () => (novelId ? db.chat_threads.where('novelId').equals(novelId).toArray() : []),
    [novelId],
  )
}

export function useChatThread(id: string | undefined) {
  return useLiveQuery(() => (id ? db.chat_threads.get(id) : undefined), [id])
}

export function useCreateChatThread() {
  return async (data: Omit<ChatThread, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    const id = crypto.randomUUID()
    const now = Date.now()
    await db.chat_threads.add({ id, ...data, createdAt: now, updatedAt: now })
    return id
  }
}

export function useUpdateChatThread() {
  return async (id: string, data: Partial<ChatThread>): Promise<void> => {
    await db.chat_threads.update(id, { ...data, updatedAt: Date.now() })
  }
}

export function useDeleteChatThread() {
  return async (id: string): Promise<void> => {
    await db.transaction('rw', [db.chat_threads, db.chat_messages], async () => {
      await db.chat_messages.where('threadId').equals(id).delete()
      await db.chat_threads.delete(id)
    })
  }
}

// Messages

export function useChatMessages(threadId: string | undefined) {
  return useLiveQuery(
    () => (threadId ? db.chat_messages.where('threadId').equals(threadId).sortBy('createdAt') : []),
    [threadId],
  )
}

export function useAddChatMessage() {
  return async (data: Omit<ChatMessage, 'id' | 'createdAt'>): Promise<string> => {
    const id = crypto.randomUUID()
    const now = Date.now()
    await db.chat_messages.add({ id, ...data, createdAt: now })
    await db.chat_threads.update(data.threadId, { updatedAt: now })
    return id
  }
}

export function useDeleteChatMessage() {
  return async (id: string): Promise<void> => {
    await db.chat_messages.delete(id)
  }
}
