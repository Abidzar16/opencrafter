import { useState } from 'react'
import { Copy, Trash2, RotateCcw, Scissors } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { toast } from 'sonner'
import { ChatRole } from '@/types'
import type { ChatMessage } from '@/types/chat'

interface MessageBubbleProps {
  message: ChatMessage
  isStreaming?: boolean
  streamingText?: string
  isLast?: boolean
  onDelete: (id: string) => void
  onRegenerate?: (id: string) => void
  onExtract?: (content: string) => void
}

export function MessageBubble({
  message,
  isStreaming = false,
  streamingText = '',
  isLast = false,
  onDelete,
  onRegenerate,
  onExtract,
}: MessageBubbleProps) {
  const [hovered, setHovered] = useState(false)
  const isUser = message.role === ChatRole.User
  const displayContent = isStreaming ? streamingText : message.content

  function handleCopy() {
    navigator.clipboard.writeText(displayContent).catch(() => null)
    toast.success('Copied')
  }

  const timestamp = new Date(message.createdAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div
      className={cn('group flex gap-3 px-4 py-2', isUser ? 'flex-row-reverse' : 'flex-row')}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Avatar */}
      <div
        className={cn(
          'mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-muted-foreground',
        )}
      >
        {isUser ? 'U' : 'AI'}
      </div>

      {/* Bubble */}
      <div className={cn('flex max-w-[75%] flex-col gap-1', isUser ? 'items-end' : 'items-start')}>
        <div
          className={cn(
            'rounded-2xl px-4 py-2.5 text-sm',
            isUser
              ? 'bg-primary text-primary-foreground rounded-tr-sm'
              : 'bg-muted text-foreground rounded-tl-sm',
          )}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{displayContent}</p>
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <Markdown remarkPlugins={[remarkGfm]}>{displayContent}</Markdown>
              {isStreaming && (
                <span className="inline-block h-4 w-0.5 animate-pulse bg-current ml-0.5 align-middle" />
              )}
            </div>
          )}
        </div>

        {/* Timestamp + actions */}
        <div
          className={cn(
            'flex items-center gap-1 transition-opacity',
            hovered ? 'opacity-100' : 'opacity-0',
            isUser ? 'flex-row-reverse' : 'flex-row',
          )}
        >
          <span className="text-muted-foreground text-xs">{timestamp}</span>

          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={handleCopy}
            title="Copy"
          >
            <Copy className="h-3 w-3" />
          </Button>

          {!isUser && onExtract && !isStreaming && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => onExtract(message.content)}
              title="Extract"
            >
              <Scissors className="h-3 w-3" />
            </Button>
          )}

          {!isUser && isLast && onRegenerate && !isStreaming && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => onRegenerate(message.id)}
              title="Regenerate"
            >
              <RotateCcw className="h-3 w-3" />
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="text-destructive hover:text-destructive h-6 w-6"
            onClick={() => onDelete(message.id)}
            title="Delete"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  )
}

/** Thin streaming bubble shown while AI is generating (before the message is committed to DB) */
export function StreamingBubble({ text }: { text: string }) {
  return (
    <div className="flex gap-3 px-4 py-2">
      <div className="bg-muted text-muted-foreground mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
        AI
      </div>
      <div className="bg-muted text-foreground max-w-[75%] rounded-2xl rounded-tl-sm px-4 py-2.5 text-sm">
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <Markdown remarkPlugins={[remarkGfm]}>{text}</Markdown>
          <span className="inline-block h-4 w-0.5 animate-pulse bg-current ml-0.5 align-middle" />
        </div>
      </div>
    </div>
  )
}
