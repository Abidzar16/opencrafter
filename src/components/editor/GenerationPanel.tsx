import { useState, useCallback, useEffect, useRef } from 'react'
import { Wand2, Square, RotateCcw, Check, X, Layers, Eye } from 'lucide-react'
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
import {
  useModelConfigs,
  useApiKeys,
  usePrompts,
  usePromptPresets,
  useCreatePromptPreset,
  useDeletePromptPreset,
} from '@/lib/db/hooks'
import { useGenerateStream } from '@/lib/hooks/use-generate-stream'
import { useAIStore } from '@/stores/ai-store'
import { resolvePrompt } from '@/lib/ai/template-engine'
import { PromptPreviewModal } from './PromptPreviewModal'
import { Provider, PromptType } from '@/types'
import type { ModelConfig, Prompt } from '@/types'
import type { Editor } from '@tiptap/core'
import db from '@/lib/db/db'

const DEFAULTS_KEY = 'opencrafter:account-defaults'

function loadAccountDefault(key: string): string | undefined {
  try {
    const raw = localStorage.getItem(DEFAULTS_KEY)
    if (!raw) return undefined
    return (JSON.parse(raw) as Record<string, string>)[key]
  } catch {
    return undefined
  }
}

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
  const allPrompts = usePrompts() ?? []
  const { status } = useAIStore()

  const promptType = mode === 'beat' ? PromptType.BeatCompletion : PromptType.TextReplacement
  const typedPrompts = allPrompts.filter(p => p.type === promptType)

  const [selectedConfigId, setSelectedConfigId] = useState<string>('')
  const [selectedPromptId, setSelectedPromptId] = useState<string>('')
  const [contextSummary, setContextSummary] = useState<string>('')
  const [generatedText, setGeneratedText] = useState<string>('')
  const [phase, setPhase] = useState<'idle' | 'generating' | 'done'>('idle')
  const [previewOpen, setPreviewOpen] = useState(false)
  const previewRef = useRef<HTMLDivElement>(null)

  const presets = usePromptPresets(selectedPromptId) ?? []
  const createPreset = useCreatePromptPreset()
  const deletePreset = useDeletePromptPreset()

  async function handleSavePreset() {
    if (!selectedPromptId || !selectedConfigId) return
    const name = `Preset ${presets.length + 1}`
    await createPreset({ promptId: selectedPromptId, name, modelConfigId: selectedConfigId, inputDefaults: {} })
    toast.success('Preset saved')
  }

  function applyPreset(presetId: string) {
    const preset = presets.find(p => p.id === presetId)
    if (!preset) return
    if (preset.modelConfigId) setSelectedConfigId(preset.modelConfigId)
  }

  // Pick defaults on open
  useEffect(() => {
    if (!open) return

    if (!selectedConfigId && configs.length > 0) {
      setSelectedConfigId(configs[0].id)
    }

    if (!selectedPromptId) {
      // Try novel-level default, then account default, then first available
      async function pickDefaultPrompt() {
        const novel = await db.novels.get(novelId)
        const novelDefault =
          mode === 'beat'
            ? novel?.settings?.defaultBeatCompletionPromptId
            : novel?.settings?.defaultTextReplacementPromptId
        const accountDefault = loadAccountDefault(
          mode === 'beat' ? 'defaultBeatCompletionPromptId' : 'defaultTextReplacementPromptId',
        )
        const fallbackId = typedPrompts[0]?.id
        const id = novelDefault ?? accountDefault ?? fallbackId ?? ''
        if (id) setSelectedPromptId(id)
      }
      pickDefaultPrompt().catch(console.error)
    }
  }, [open, configs, typedPrompts, selectedConfigId, selectedPromptId, novelId, mode])

  // Assemble context summary when panel opens
  useEffect(() => {
    if (!open || !selectedPromptId) return
    const prompt = allPrompts.find(p => p.id === selectedPromptId)
    if (!prompt) return

    resolvePrompt(prompt, { novelId, sceneId, selectedText: sourceText })
      .then(r => {
        const blockCount = r.contextBlocks.length
        setContextSummary(blockCount > 0 ? `${blockCount} context block(s) assembled` : 'No context blocks')
      })
      .catch(() => setContextSummary(''))
  }, [open, selectedPromptId, allPrompts, novelId, sceneId, sourceText])

  useEffect(() => {
    if (!open) {
      setGeneratedText('')
      setPhase('idle')
    }
  }, [open])

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
  const selectedPrompt = allPrompts.find(p => p.id === selectedPromptId) ?? null

  const handleGenerate = async () => {
    if (!selectedConfig) {
      toast.error('Select a model config first')
      return
    }
    if (!selectedPrompt) {
      toast.error('Select a prompt first')
      return
    }

    // Resolve persona
    let personaInstructions: string | undefined
    try {
      const novel = await db.novels.get(novelId)
      const personaId = novel?.settings?.defaultPersonaId
      if (personaId) {
        const persona = await db.prompt_personas.get(personaId)
        personaInstructions = persona?.instructions
      }
    } catch { /* ignore */ }

    const resolved = await resolvePrompt(selectedPrompt, {
      novelId,
      sceneId,
      selectedText: sourceText,
      personaInstructions,
    })

    // Append user message for beat/replacement source if not already in messages
    const messages = resolved.messages
    const hasUserMsg = messages.some(m => m.role === 'user')
    if (!hasUserMsg && sourceText) {
      messages.push({ role: 'user', content: sourceText })
    }

    // Apply prompt-level model settings overrides
    const temp = selectedPrompt.modelSettings.temperature ?? selectedConfig.temperature
    const maxTok = selectedPrompt.modelSettings.maxTokens ?? selectedConfig.maxTokens

    setGeneratedText('')
    setPhase('generating')

    await run({
      messages,
      provider: selectedConfig.provider as Provider,
      modelId: selectedConfig.modelId,
      apiKeyRef: selectedConfig.apiKeyRef,
      temperature: temp,
      topP: selectedConfig.topP,
      maxTokens: maxTok,
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
    if (!c.apiKeyRef) return true
    return apiKeys.some(k => k.id === c.apiKeyRef)
  })

  const previewCtx = {
    novelId,
    sceneId,
    selectedText: sourceText,
  }

  return (
    <>
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
            <div className="w-72 shrink-0 flex flex-col gap-3 p-4 overflow-y-auto">
              {/* Prompt selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Prompt
                </label>
                {typedPrompts.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    No prompts for this type. Add one in Settings → Prompt Library.
                  </p>
                ) : (
                  <Select value={selectedPromptId} onValueChange={setSelectedPromptId}>
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder="Select prompt…" />
                    </SelectTrigger>
                    <SelectContent>
                      {typedPrompts.map((p: Prompt) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {selectedPrompt?.description && (
                  <p className="text-xs text-muted-foreground">{selectedPrompt.description}</p>
                )}
              </div>

              {/* Model selector */}
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
                {selectedConfig && (
                  <div className="text-xs text-muted-foreground space-y-0.5">
                    <div>{selectedConfig.provider} / {selectedConfig.modelId}</div>
                    {selectedConfig.temperature !== undefined && (
                      <div>temp {selectedConfig.temperature}</div>
                    )}
                  </div>
                )}
              </div>

              {/* Presets */}
              {presets.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Presets
                    </label>
                    <div className="flex flex-col gap-1">
                      {presets.map(preset => (
                        <div key={preset.id} className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 h-7 text-xs justify-start"
                            onClick={() => applyPreset(preset.id)}
                          >
                            {preset.name}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive shrink-0"
                            onClick={() => deletePreset(preset.id)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <Separator />

              {/* Context summary */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Context
                  </label>
                  <div className="flex gap-1">
                    {selectedPrompt && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-xs px-2"
                        onClick={() => setPreviewOpen(true)}
                      >
                        <Eye className="mr-1 h-3 w-3" />
                        Preview
                      </Button>
                    )}
                    {selectedPromptId && selectedConfigId && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-xs px-2"
                        onClick={handleSavePreset}
                      >
                        Save preset
                      </Button>
                    )}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">{contextSummary || 'No context.'}</p>
              </div>

              <Separator />

              {/* Source */}
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
                    {phase === 'idle' ? 'Click Generate to create prose…' : 'Generating…'}
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
                    disabled={!selectedConfig || !selectedPrompt || status === 'generating'}
                    size="sm"
                  >
                    <Wand2 className="mr-2 h-4 w-4" />
                    Generate
                  </Button>
                )}

                {phase === 'generating' && (
                  <Button variant="destructive" size="sm" onClick={() => { abort(); setPhase('done') }}>
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

      {selectedPrompt && (
        <PromptPreviewModal
          open={previewOpen}
          onClose={() => setPreviewOpen(false)}
          prompt={selectedPrompt}
          ctx={previewCtx}
        />
      )}
    </>
  )
}
