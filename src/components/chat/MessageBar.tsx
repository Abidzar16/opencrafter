import { useState, useRef, useEffect } from 'react'
import { Send, Square, Paperclip } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ContextSelector, ContextPill } from './ContextSelector'
import { useModelConfigs, useApiKeys, usePromptsByType } from '@/lib/db/hooks'
import { useAIStore } from '@/stores/ai-store'
import { useUIStore } from '@/stores/ui-store'
import { PromptType } from '@/types'
import type { ContextAttachment } from '@/types'

interface MessageBarProps {
  novelId: string
  context: ContextAttachment[]
  onContextChange: (ctx: ContextAttachment[]) => void
  onSend: (text: string) => void
}

export function MessageBar({ novelId, context, onContextChange, onSend }: MessageBarProps) {
  const [text, setText] = useState('')
  const [contextOpen, setContextOpen] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { status, abort } = useAIStore()
  const { chatSelectedConfigId, setChatSelectedConfigId, chatSelectedPromptId, setChatSelectedPromptId } = useUIStore()
  const isGenerating = status === 'generating'

  const allConfigs = useModelConfigs() ?? []
  const apiKeys = useApiKeys() ?? []
  const chatPrompts = usePromptsByType(PromptType.WorkshopChat) ?? []

  // Filter to configs with valid API keys
  const configs = allConfigs.filter(c => !c.apiKeyRef || apiKeys.some(k => k.id === c.apiKeyRef))

  // Auto-select defaults on first render
  useEffect(() => {
    if (!chatSelectedConfigId && configs.length > 0) setChatSelectedConfigId(configs[0].id)
  }, [configs, chatSelectedConfigId, setChatSelectedConfigId])

  useEffect(() => {
    if (!chatSelectedPromptId && chatPrompts.length > 0) setChatSelectedPromptId(chatPrompts[0].id)
  }, [chatPrompts, chatSelectedPromptId, setChatSelectedPromptId])

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function handleSend() {
    const trimmed = text.trim()
    if (!trimmed || isGenerating) return
    onSend(trimmed)
    setText('')
    textareaRef.current?.focus()
  }

  return (
    <div className="border-t bg-background">
      {/* Context pills row */}
      {context.length > 0 && (
        <div className="flex flex-wrap gap-1.5 px-4 pt-3">
          {context.map(att => (
            <ContextPill
              key={att.id}
              att={att}
              onRemove={() => onContextChange(context.filter(a => a.id !== att.id))}
            />
          ))}
        </div>
      )}

      {/* Prompt + Model pickers */}
      <div className="flex items-center gap-2 px-4 pt-2">
        {chatPrompts.length > 0 && (
          <Select value={chatSelectedPromptId} onValueChange={setChatSelectedPromptId}>
            <SelectTrigger className="h-7 w-44 text-xs">
              <SelectValue placeholder="Prompt…" />
            </SelectTrigger>
            <SelectContent>
              {chatPrompts.map(p => (
                <SelectItem key={p.id} value={p.id} className="text-xs">
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {configs.length > 0 && (
          <Select value={chatSelectedConfigId} onValueChange={setChatSelectedConfigId}>
            <SelectTrigger className="h-7 w-44 text-xs">
              <SelectValue placeholder="Model…" />
            </SelectTrigger>
            <SelectContent>
              {configs.map(c => (
                <SelectItem key={c.id} value={c.id} className="text-xs">
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Textarea row */}
      <div className="flex items-end gap-2 p-4">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={() => setContextOpen(true)}
          title="Attach context"
        >
          <Paperclip className="h-4 w-4" />
        </Button>

        <Textarea
          ref={textareaRef}
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message… (Enter to send, Shift+Enter for newline)"
          rows={1}
          className="max-h-40 min-h-[36px] flex-1 resize-none py-2 text-sm"
          disabled={isGenerating}
        />

        {isGenerating ? (
          <Button variant="destructive" size="icon" className="h-8 w-8 shrink-0" onClick={abort}>
            <Square className="h-4 w-4 fill-current" />
          </Button>
        ) : (
          <Button
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={handleSend}
            disabled={!text.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        )}
      </div>

      <ContextSelector
        open={contextOpen}
        onClose={() => setContextOpen(false)}
        novelId={novelId}
        selected={context}
        onChange={onContextChange}
      />
    </div>
  )
}
