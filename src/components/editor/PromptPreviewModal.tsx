import { useState, useEffect } from 'react'
import { Eye, Loader2, CheckCircle, XCircle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { resolvePrompt } from '@/lib/ai/template-engine'
import { debugBuildAIContext } from '@/lib/ai/context-builder'
import db from '@/lib/db/db'
import type { Prompt } from '@/types'
import type { TemplateContext } from '@/lib/ai/template-engine'

interface PromptPreviewModalProps {
  open: boolean
  onClose: () => void
  prompt: Prompt
  ctx: TemplateContext
}

export function PromptPreviewModal({ open, onClose, prompt, ctx }: PromptPreviewModalProps) {
  const [loading, setLoading] = useState(false)
  const [resolved, setResolved] = useState<{
    messages: Array<{ role: 'system' | 'user'; content: string }>
    contextBlocks: Array<{ label: string; text: string; type: string }>
    resolvedSystem: string
    included: Array<{ entryId: string; name: string; entryType: string }>
    excluded: Array<{ entryId: string; name: string; reason: string }>
  } | null>(null)

  useEffect(() => {
    if (!open) { setResolved(null); return }
    setLoading(true)

    async function run() {
      // Resolve persona instructions if set
      let personaInstructions: string | undefined
      const personaId = ctx.novelId
        ? (await db.novels.get(ctx.novelId))?.settings?.defaultPersonaId
        : undefined
      if (personaId) {
        const persona = await db.prompt_personas.get(personaId)
        personaInstructions = persona?.instructions
      }

      const [result, debugResult] = await Promise.all([
        resolvePrompt(prompt, { ...ctx, personaInstructions }),
        debugBuildAIContext(ctx.novelId, ctx.sceneId ?? null, ctx.selectedText ?? '', ctx.manualEntryIds),
      ])

      setResolved({
        messages: result.messages,
        contextBlocks: result.contextBlocks,
        resolvedSystem: result.resolvedSystem,
        included: debugResult.included.map(b => ({
          entryId: b.entryId,
          name: b.name,
          entryType: b.entryType,
        })),
        excluded: debugResult.excluded,
      })
    }

    run()
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [open, prompt, ctx])

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="sm:max-w-2xl h-[80vh] flex flex-col p-0">
        <DialogHeader className="px-4 pt-4 pb-3 border-b shrink-0">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Eye className="h-4 w-4" />
            Prompt Preview — {prompt.name}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex-1 flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Assembling prompt…
          </div>
        ) : resolved ? (
          <Tabs defaultValue="messages" className="flex flex-col flex-1 min-h-0">
            <TabsList className="mx-4 mt-2 shrink-0 justify-start">
              <TabsTrigger value="messages">Messages</TabsTrigger>
              <TabsTrigger value="context">
                Context Blocks
                <Badge variant="secondary" className="ml-1.5 text-xs">
                  {resolved.contextBlocks.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="codex">
                Codex
                <Badge variant="secondary" className="ml-1.5 text-xs">
                  {resolved.included.length + resolved.excluded.length}
                </Badge>
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 min-h-0 overflow-hidden">
              {/* Messages tab */}
              <TabsContent value="messages" className="h-full mt-0">
                <ScrollArea className="h-full p-4">
                  <div className="space-y-4">
                    {resolved.messages.map((msg, i) => (
                      <div key={i} className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs capitalize">
                            {msg.role}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {msg.content.length} chars
                          </span>
                        </div>
                        <pre className="text-xs bg-muted rounded p-3 whitespace-pre-wrap font-mono leading-relaxed">
                          {msg.content}
                        </pre>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>

              {/* Context blocks tab */}
              <TabsContent value="context" className="h-full mt-0">
                <ScrollArea className="h-full p-4">
                  {resolved.contextBlocks.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No context blocks assembled.</p>
                  ) : (
                    <div className="space-y-4">
                      {resolved.contextBlocks.map((block, i) => (
                        <div key={i} className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">{block.label}</Badge>
                            <span className="text-xs text-muted-foreground">
                              {block.text.length} chars
                            </span>
                          </div>
                          <pre className="text-xs bg-muted rounded p-3 whitespace-pre-wrap leading-relaxed">
                            {block.text}
                          </pre>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>

              {/* Codex tab */}
              <TabsContent value="codex" className="h-full mt-0">
                <ScrollArea className="h-full p-4">
                  <div className="space-y-4">
                    {resolved.included.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          Included ({resolved.included.length})
                        </h4>
                        <div className="space-y-1">
                          {resolved.included.map(e => (
                            <div key={e.entryId} className="flex items-center gap-2 text-sm">
                              <CheckCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                              <span className="font-medium">{e.name}</span>
                              <Badge variant="outline" className="text-xs">{e.entryType}</Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {resolved.included.length > 0 && resolved.excluded.length > 0 && (
                      <Separator />
                    )}

                    {resolved.excluded.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          Excluded ({resolved.excluded.length})
                        </h4>
                        <div className="space-y-1">
                          {resolved.excluded.map(e => (
                            <div key={e.entryId} className="flex items-center gap-2 text-sm">
                              <XCircle className="h-3.5 w-3.5 text-red-500 shrink-0" />
                              <span className="font-medium text-muted-foreground">{e.name}</span>
                              <span className="text-xs text-muted-foreground">— {e.reason}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {resolved.included.length === 0 && resolved.excluded.length === 0 && (
                      <p className="text-sm text-muted-foreground">No codex entries evaluated.</p>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
            </div>
          </Tabs>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
