import { useState, useRef, useEffect } from 'react'
import { Send, Square, Paperclip } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ContextSelector, ContextPill } from './ContextSelector'
import { useModelConfigs, useApiKeys, usePromptsByType, usePrompt } from '@/lib/db/hooks'
import { useAIStore } from '@/stores/ai-store'
import { useUIStore } from '@/stores/ui-store'
import { PromptType } from '@/types'
import type { ContextAttachment } from '@/types'

interface MessageBarProps {
  novelId: string
  context: ContextAttachment[]
  onContextChange: (ctx: ContextAttachment[]) => void
  onSend: (text: string, inputValues: Record<string, string>) => void
}

export function MessageBar({ novelId, context, onContextChange, onSend }: MessageBarProps) {
  const [text, setText] = useState('')
  const [contextOpen, setContextOpen] = useState(false)
  const [inputValues, setInputValues] = useState<Record<string, string>>({})
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { status, abort } = useAIStore()
  const { chatSelectedConfigId, setChatSelectedConfigId, chatSelectedPromptId, setChatSelectedPromptId } = useUIStore()
  const isGenerating = status === 'generating'

  const allConfigs = useModelConfigs() ?? []
  const apiKeys = useApiKeys() ?? []
  const chatPrompts = usePromptsByType(PromptType.WorkshopChat) ?? []
  const selectedPrompt = usePrompt(chatSelectedPromptId ?? undefined)

  // Filter to configs with valid API keys
  const configs = allConfigs.filter(c => !c.apiKeyRef || apiKeys.some(k => k.id === c.apiKeyRef))

  // Auto-select defaults on first render
  useEffect(() => {
    if (!chatSelectedConfigId && configs.length > 0) setChatSelectedConfigId(configs[0].id)
  }, [configs, chatSelectedConfigId, setChatSelectedConfigId])

  useEffect(() => {
    if (!chatSelectedPromptId && chatPrompts.length > 0) setChatSelectedPromptId(chatPrompts[0].id)
  }, [chatPrompts, chatSelectedPromptId, setChatSelectedPromptId])

  // Initialize input values from prompt defaults when prompt changes
  useEffect(() => {
    if (!selectedPrompt?.inputs?.length) {
      setInputValues({})
      return
    }
    setInputValues(prev => {
      const next: Record<string, string> = {}
      for (const input of selectedPrompt.inputs) {
        next[input.key] = prev[input.key] ?? input.defaultValue ?? (input.type === 'toggle' ? 'false' : '')
      }
      return next
    })
  }, [selectedPrompt?.id]) // reset only when prompt identity changes

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function handleSend() {
    const trimmed = text.trim()
    if (!trimmed || isGenerating) return
    onSend(trimmed, inputValues)
    setText('')
    textareaRef.current?.focus()
  }

  function setInputValue(key: string, value: string) {
    setInputValues(prev => ({ ...prev, [key]: value }))
  }

  const promptInputs = selectedPrompt?.inputs ?? []

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

      {/* Prompt inputs panel — shown when selected prompt has input fields */}
      {promptInputs.length > 0 && (
        <div className="border-b bg-muted/30 px-4 py-2 space-y-2">
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Prompt inputs</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {promptInputs.map(input => (
              <div key={input.id} className="space-y-1">
                <Label className="text-xs">{input.label}</Label>
                {input.type === 'text' && (
                  <Input
                    value={inputValues[input.key] ?? ''}
                    onChange={e => setInputValue(input.key, e.target.value)}
                    placeholder={input.label}
                    className="h-7 text-xs"
                  />
                )}
                {input.type === 'textarea' && (
                  <Textarea
                    value={inputValues[input.key] ?? ''}
                    onChange={e => setInputValue(input.key, e.target.value)}
                    placeholder={input.label}
                    rows={2}
                    className="text-xs resize-none"
                  />
                )}
                {input.type === 'dropdown' && (
                  <Select
                    value={inputValues[input.key] ?? ''}
                    onValueChange={v => setInputValue(input.key, v)}
                  >
                    <SelectTrigger className="h-7 text-xs">
                      <SelectValue placeholder="Select…" />
                    </SelectTrigger>
                    <SelectContent>
                      {(input.options ?? []).map(opt => (
                        <SelectItem key={opt.value} value={opt.value} className="text-xs">
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {input.type === 'toggle' && (
                  <div className="flex items-center gap-2 pt-1">
                    <Switch
                      checked={inputValues[input.key] === 'true'}
                      onCheckedChange={v => setInputValue(input.key, v ? 'true' : 'false')}
                    />
                    <span className="text-xs text-muted-foreground">
                      {inputValues[input.key] === 'true' ? 'On' : 'Off'}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Prompt + Model pickers — wrap at mobile */}
      <div className="flex flex-wrap items-center gap-2 px-4 pt-2">
        {chatPrompts.length > 0 && (
          <Select value={chatSelectedPromptId} onValueChange={setChatSelectedPromptId}>
            <SelectTrigger className="h-7 w-44 text-xs">
              <SelectValue placeholder="Prompt…" />
            </SelectTrigger>
            <SelectContent>
              {(() => {
                type P = typeof chatPrompts[0] & { groupId?: string }
                const ungrouped = chatPrompts.filter(p => !(p as P).groupId)
                const groupMap = new Map<string, typeof chatPrompts>()
                for (const p of chatPrompts) {
                  const gid = (p as P).groupId
                  if (gid) {
                    if (!groupMap.has(gid)) groupMap.set(gid, [])
                    groupMap.get(gid)!.push(p)
                  }
                }
                return (
                  <>
                    {ungrouped.map(p => (
                      <SelectItem key={p.id} value={p.id} className="text-xs">{p.name}</SelectItem>
                    ))}
                    {Array.from(groupMap.entries()).map(([gid, items]) => (
                      <SelectGroup key={gid}>
                        <SelectLabel className="text-xs">{gid}</SelectLabel>
                        {items.map(p => (
                          <SelectItem key={p.id} value={p.id} className="text-xs">{p.name}</SelectItem>
                        ))}
                      </SelectGroup>
                    ))}
                  </>
                )
              })()}
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
          aria-label="Attach context"
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
          <Button variant="destructive" size="icon" className="h-8 w-8 shrink-0" onClick={abort} aria-label="Stop generation">
            <Square className="h-4 w-4 fill-current" />
          </Button>
        ) : (
          <Button
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={handleSend}
            disabled={!text.trim()}
            aria-label="Send message"
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
