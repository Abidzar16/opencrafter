import { useState, useCallback, useEffect, useRef } from 'react'
import { Wand2, Square, RotateCcw, Check, X, Layers } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { useModelConfigs, useApiKeys } from '@/lib/db/hooks'
import { buildAIContext, renderContextBlocks } from '@/lib/ai/context-builder'
import { useGenerateStream } from '@/lib/hooks/use-generate-stream'
import { useAIStore } from '@/stores/ai-store'
import { Provider } from '@/types'
import type { ModelConfig } from '@/types'
import type { Editor } from '@tiptap/core'

export type GenerationMode = 'beat' | 'replacement'

interface GenerationPanelProps {
  open: boolean
  onClose: () => void
  novelId: string
  sceneId: string
  mode: GenerationMode
  /** Beat content (mode=beat) or selected prose text (mode=replacement) */
  sourceText: string
  /** Tiptap editor reference for inserting result */
  editor: Editor | null
  /** Selection range to replace (mode=replacement only) */
  selectionRange?: { from: number; to: number }
}

function buildSystemPrompt(
  mode: GenerationMode,
  contextStr: string,
): string {
  const contextBlock = contextStr
    ? `\n\n## Story Context\n${contextStr}`
    : ''

  if (mode === 'beat') {
    return `You are a skilled fiction writer. Generate vivid, engaging prose for the beat instruction provided by the user.
Return only the prose — no preamble, no explanation, no meta-commentary.${contextBlock}`
  }

  return `You are a skilled fiction editor. Rewrite the passage provided by the user while preserving the core meaning and narrative intent.
Return only the rewritten text — no preamble, no explanation.${contextBlock}`
}

function buildUserPrompt(mode: GenerationMode, sourceText: string): string {
  if (mode === 'beat') {
    return `Beat instruction: ${sourceText}\n\nWrite the prose for this beat.`
  }
  return `Original:\n${sourceText}\n\nRewrite this passage.`
}

export function GenerationPanel({
  open,
  onClose,
  novelId,
  sceneId,
  mode,
  sourceText,
  editor,
  selectionRange,
}: GenerationPanelProps) {
  const configs = useModelConfigs() ?? []
  const apiKeys = useApiKeys() ?? []
  const { status } = useAIStore()

  const [selectedConfigId, setSelectedConfigId] = useState<string>('')
  const [contextStr, setContextStr] = useState<string>('')
  const [generatedText, setGeneratedText] = useState<string>('')
  const [phase, setPhase] = useState<'idle' | 'generating' | 'done'>('idle')
  const previewRef = useRef<HTMLDivElement>(null)

  // Pick first available model on open
  useEffect(() => {
    if (open && !selectedConfigId && configs.length > 0) {
      setSelectedConfigId(configs[0].id)
    }
  }, [open, configs, selectedConfigId])

  // Assemble context when panel opens
  useEffect(() => {
    if (!open) return
    buildAIContext(novelId, sceneId, sourceText)
      .then(blocks => setContextStr(renderContextBlocks(blocks)))
      .catch(() => setContextStr(''))
  }, [open, novelId, sceneId, sourceText])

  // Reset when closed or source changes
  useEffect(() => {
    if (!open) {
      setGeneratedText('')
      setPhase('idle')
    }
  }, [open])

  // Auto-scroll preview to bottom
  useEffect(() => {
    if (previewRef.current) {
      previewRef.current.scrollTop = previewRef.current.scrollHeight
    }
  }, [generatedText])

  const { run, abort } = useGenerateStream({
    onChunk: useCallback((text: string) => {
      setGeneratedText(prev => prev + text)
    }, []),
    onDone: useCallback(() => {
      setPhase('done')
    }, []),
    onError: useCallback((err: Error) => {
      setPhase('idle')
      toast.error(`Generation failed: ${err.message}`)
    }, []),
  })

  const selectedConfig = configs.find(c => c.id === selectedConfigId)

  const handleGenerate = async () => {
    if (!selectedConfig) {
      toast.error('Select a model config first')
      return
    }

    const systemContent = buildSystemPrompt(mode, contextStr)
    const userContent = buildUserPrompt(mode, sourceText)

    setGeneratedText('')
    setPhase('generating')

    await run({
      messages: [
        { role: 'system', content: systemContent },
        { role: 'user', content: userContent },
      ],
      provider: selectedConfig.provider as Provider,
      modelId: selectedConfig.modelId,
      apiKeyRef: selectedConfig.apiKeyRef,
      temperature: selectedConfig.temperature,
      topP: selectedConfig.topP,
      maxTokens: selectedConfig.maxTokens,
      stream: true,
    })
  }

  const handleApply = () => {
    if (!editor || !generatedText) return
    if (mode === 'replacement' && selectionRange) {
      editor
        .chain()
        .focus()
        .deleteRange(selectionRange)
        .insertContentAt(selectionRange.from, generatedText)
        .run()
    } else {
      // Beat mode: insert after the current position
      editor.chain().focus().insertContent(generatedText).run()
    }
    onClose()
    toast.success('Prose applied')
  }

  const handleSection = () => {
    if (!editor || !generatedText) return
    if (mode === 'replacement' && selectionRange) {
      editor
        .chain()
        .focus()
        .deleteRange(selectionRange)
        .insertContentAt(selectionRange.from, {
          type: 'section',
          attrs: { color: '#6366f1', label: 'Generated' },
          content: [{ type: 'paragraph', content: [{ type: 'text', text: generatedText }] }],
        })
        .run()
    } else {
      editor
        .chain()
        .focus()
        .insertContent({
          type: 'section',
          attrs: { color: '#6366f1', label: 'Generated' },
          content: [{ type: 'paragraph', content: [{ type: 'text', text: generatedText }] }],
        })
        .run()
    }
    onClose()
    toast.success('Prose wrapped in section and applied')
  }

  const handleRetry = () => {
    setGeneratedText('')
    setPhase('idle')
  }

  const handleDiscard = () => {
    abort()
    setGeneratedText('')
    setPhase('idle')
    onClose()
  }

  const configsWithKeys = configs.filter(c => {
    if (!c.apiKeyRef) return true // local provider, no key needed
    return apiKeys.some(k => k.id === c.apiKeyRef)
  })

  return (
    <Sheet open={open} onOpenChange={v => !v && handleDiscard()}>
      <SheetContent side="bottom" className="h-[65vh] flex flex-col p-0">
        <SheetHeader className="px-4 pt-4 pb-2 border-b">
          <SheetTitle className="flex items-center gap-2 text-base">
            <Wand2 className="h-4 w-4" />
            {mode === 'beat' ? 'Generate prose from beat' : 'Rewrite selection'}
          </SheetTitle>
        </SheetHeader>

        <div className="flex flex-1 min-h-0 divide-x">
          {/* Left: Config */}
          <div className="w-64 shrink-0 flex flex-col gap-3 p-4 overflow-y-auto">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Model
              </label>
              {configsWithKeys.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  No model configs. Add one in Settings → Model Collections.
                </p>
              ) : (
                <Select value={selectedConfigId} onValueChange={setSelectedConfigId}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="Select model…" />
                  </SelectTrigger>
                  <SelectContent>
                    {configsWithKeys.map((c: ModelConfig) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {selectedConfig && (
              <div className="text-xs text-muted-foreground space-y-0.5">
                <div>{selectedConfig.provider} / {selectedConfig.modelId}</div>
                {selectedConfig.temperature !== undefined && (
                  <div>temp {selectedConfig.temperature}</div>
                )}
              </div>
            )}

            <Separator />

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Context ({contextStr ? `${contextStr.length} chars` : 'none'})
              </label>
              {contextStr ? (
                <div className="text-xs text-muted-foreground bg-muted rounded p-2 max-h-32 overflow-y-auto whitespace-pre-wrap">
                  {contextStr}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">No codex context assembled.</p>
              )}
            </div>

            <Separator />

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Source
              </label>
              <div className="text-xs text-muted-foreground bg-muted rounded p-2 max-h-24 overflow-y-auto line-clamp-6">
                {sourceText || '(empty)'}
              </div>
            </div>
          </div>

          {/* Right: Preview + Actions */}
          <div className="flex-1 flex flex-col min-h-0">
            <div
              ref={previewRef}
              className="flex-1 overflow-y-auto p-4 font-serif text-sm leading-relaxed whitespace-pre-wrap"
            >
              {generatedText || (
                <span className="text-muted-foreground italic">
                  {phase === 'idle'
                    ? 'Click Generate to create prose…'
                    : 'Generating…'}
                </span>
              )}
              {phase === 'generating' && (
                <span className="inline-block h-4 w-0.5 bg-foreground animate-pulse ml-0.5" />
              )}
            </div>

            <div className="border-t p-3 flex items-center gap-2">
              {phase === 'idle' && (
                <Button
                  onClick={handleGenerate}
                  disabled={!selectedConfig || status === 'generating'}
                  size="sm"
                >
                  <Wand2 className="mr-2 h-4 w-4" />
                  Generate
                </Button>
              )}

              {phase === 'generating' && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    abort()
                    setPhase('done')
                  }}
                >
                  <Square className="mr-2 h-3 w-3 fill-current" />
                  Stop
                </Button>
              )}

              {phase === 'done' && (
                <>
                  <Button size="sm" onClick={handleApply}>
                    <Check className="mr-2 h-4 w-4" />
                    Apply
                  </Button>
                  <Button size="sm" variant="secondary" onClick={handleSection}>
                    <Layers className="mr-2 h-4 w-4" />
                    Apply as section
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleRetry}>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Retry
                  </Button>
                  <Button size="sm" variant="ghost" onClick={handleDiscard}>
                    <X className="mr-2 h-4 w-4" />
                    Discard
                  </Button>
                </>
              )}

              <div className="ml-auto">
                {phase === 'generating' && (
                  <Badge variant="secondary" className="text-xs">Streaming…</Badge>
                )}
                {phase === 'done' && generatedText && (
                  <span className="text-xs text-muted-foreground">
                    {generatedText.split(/\s+/).filter(Boolean).length} words
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
