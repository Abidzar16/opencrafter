import { useEffect, useRef } from 'react'
import { MessageBubble, StreamingBubble } from './MessageBubble'
import { useAIStore } from '@/stores/ai-store'
import { useChatMessages, useDeleteChatMessage } from '@/lib/db/hooks'
import type { ChatMessage } from '@/types/chat'

interface MessageListProps {
  threadId: string
  streamingText: string
  onExtract: (content: string) => void
  onRegenerate: (messageId: string) => void
}

export function MessageList({ threadId, streamingText, onExtract, onRegenerate }: MessageListProps) {
  const messages: ChatMessage[] = (useChatMessages(threadId) as ChatMessage[]) ?? []
  const deleteChatMessage = useDeleteChatMessage()
  const { status } = useAIStore()
  const isStreaming = status === 'generating'
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length, streamingText])

  if (messages.length === 0 && !isStreaming) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-muted-foreground text-sm">Send a message to start the conversation.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col overflow-y-auto py-4">
      {messages.map((msg, i) => (
        <MessageBubble
          key={msg.id}
          message={msg}
          isLast={i === messages.length - 1}
          onDelete={deleteChatMessage}
          onExtract={onExtract}
          onRegenerate={onRegenerate}
        />
      ))}
      {isStreaming && <StreamingBubble text={streamingText} />}
      <div ref={bottomRef} />
    </div>
  )
}
