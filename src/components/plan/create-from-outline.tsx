import { useState } from 'react'
import { ChevronDown, ChevronRight, BookTemplate, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useActs, useCreateAct, useCreateChapter, useCreateScene } from '@/lib/db/hooks'
import { toast } from 'sonner'
import { OUTLINE_TEMPLATES } from './outline-templates'
import type { OutlineTemplate } from './outline-templates'
import { cn } from '@/lib/utils'

interface ParsedScene {
  summary: string
}

interface ParsedChapter {
  title: string
  scenes: ParsedScene[]
}

interface ParsedAct {
  title: string
  chapters: ParsedChapter[]
}

function parseOutline(text: string): ParsedAct[] {
  const lines = text.split('\n')
  const acts: ParsedAct[] = []
  let currentAct: ParsedAct | null = null
  let currentChapter: ParsedChapter | null = null

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue

    if (trimmed.startsWith('# ')) {
      const title = trimmed.slice(2).trim()
      currentAct = { title, chapters: [] }
      acts.push(currentAct)
      currentChapter = null
    } else if (trimmed.startsWith('## ')) {
      const title = trimmed.slice(3).trim()
      if (!currentAct) {
        currentAct = { title: 'Act 1', chapters: [] }
        acts.push(currentAct)
      }
      currentChapter = { title, scenes: [] }
      currentAct.chapters.push(currentChapter)
    } else if (!trimmed.startsWith('#')) {
      // Plain paragraph → scene
      if (!currentAct) {
        currentAct = { title: 'Act 1', chapters: [] }
        acts.push(currentAct)
      }
      if (!currentChapter) {
        currentChapter = { title: 'Chapter 1', scenes: [] }
        currentAct.chapters.push(currentChapter)
      }
      currentChapter.scenes.push({ summary: trimmed })
    }
  }

  return acts
}

interface PreviewTreeProps {
  parsed: ParsedAct[]
}

function PreviewTree({ parsed }: PreviewTreeProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  function toggle(key: string) {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  if (parsed.length === 0) {
    return (
      <p className="text-sm text-muted-foreground italic py-4 text-center">
        Nothing to preview — try adding some text.
      </p>
    )
  }

  return (
    <div className="space-y-1 text-sm">
      {parsed.map((act, ai) => {
        const actKey = `act-${ai}`
        const actOpen = !expanded.has(actKey)
        const totalScenes = act.chapters.reduce((n, c) => n + c.scenes.length, 0)
        return (
          <div key={actKey}>
            <button
              className="flex w-full items-center gap-1.5 rounded py-0.5 text-left font-semibold hover:text-primary"
              onClick={() => toggle(actKey)}
            >
              {actOpen ? <ChevronDown className="h-3.5 w-3.5 shrink-0" /> : <ChevronRight className="h-3.5 w-3.5 shrink-0" />}
              {act.title}
              <span className="ml-auto text-xs font-normal text-muted-foreground shrink-0">
                {act.chapters.length}ch · {totalScenes}sc
              </span>
            </button>

            {actOpen && (
              <div className="ml-4 border-l border-border pl-3 space-y-0.5">
                {act.chapters.map((chapter, ci) => {
                  const chapKey = `act-${ai}-ch-${ci}`
                  const chapOpen = !expanded.has(chapKey)
                  return (
                    <div key={chapKey}>
                      <button
                        className="flex w-full items-center gap-1.5 rounded py-0.5 text-left font-medium text-muted-foreground hover:text-foreground"
                        onClick={() => toggle(chapKey)}
                      >
                        {chapOpen ? <ChevronDown className="h-3 w-3 shrink-0" /> : <ChevronRight className="h-3 w-3 shrink-0" />}
                        {chapter.title}
                        <span className="ml-auto text-xs font-normal shrink-0">{chapter.scenes.length}sc</span>
                      </button>

                      {chapOpen && chapter.scenes.length > 0 && (
                        <div className="ml-3 border-l border-border pl-2 py-0.5 space-y-0.5">
                          {chapter.scenes.map((scene, si) => (
                            <p key={si} className="text-xs text-muted-foreground py-0.5 truncate">
                              {scene.summary}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

interface CreateFromOutlineProps {
  novelId: string
}

export function CreateFromOutline({ novelId }: CreateFromOutlineProps) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [step, setStep] = useState<'edit' | 'preview'>('edit')
  const [parsed, setParsed] = useState<ParsedAct[]>([])
  const [templateOpen, setTemplateOpen] = useState(false)
  const [importing, setImporting] = useState(false)

  const existingActs = useActs(novelId)
  const createAct = useCreateAct()
  const createChapter = useCreateChapter()
  const createScene = useCreateScene()

  function handleParse() {
    const result = parseOutline(text)
    setParsed(result)
    setStep('preview')
  }

  function handleBack() {
    setStep('edit')
  }

  function applyTemplate(template: OutlineTemplate) {
    setText(template.text)
    setTemplateOpen(false)
  }

  async function handleAppend() {
    if (parsed.length === 0) return
    setImporting(true)
    try {
      const actCount = existingActs?.length ?? 0

      for (let ai = 0; ai < parsed.length; ai++) {
        const parsedAct = parsed[ai]
        const actId = await createAct({
          novelId,
          title: parsedAct.title,
          order: actCount + ai,
          archived: false,
        })

        for (let ci = 0; ci < parsedAct.chapters.length; ci++) {
          const parsedChapter = parsedAct.chapters[ci]
          const chapterId = await createChapter({
            actId,
            novelId,
            title: parsedChapter.title,
            order: ci,
            archived: false,
          })

          for (let si = 0; si < parsedChapter.scenes.length; si++) {
            const parsedScene = parsedChapter.scenes[si]
            await createScene({
              chapterId,
              novelId,
              title: `Scene ${si + 1}`,
              summary: parsedScene.summary,
              beats: [],
              labels: [],
              codexAssociations: [],
              wordCount: 0,
              order: si,
              archived: false,
            })
          }
        }
      }

      toast.success(`Appended ${parsed.length} act${parsed.length > 1 ? 's' : ''} to your novel`)
      setText('')
      setParsed([])
      setStep('edit')
      setOpen(false)
    } catch {
      toast.error('Failed to import outline')
    } finally {
      setImporting(false)
    }
  }

  const scenesCount = parsed.reduce(
    (n, a) => n + a.chapters.reduce((m, c) => m + c.scenes.length, 0),
    0,
  )

  return (
    <>
      <button
        onClick={() => setOpen(v => !v)}
        className={cn(
          'flex w-full items-center gap-2 border-t border-border px-6 py-3 text-xs text-muted-foreground hover:bg-muted/30 transition-colors',
          open && 'bg-muted/20',
        )}
      >
        {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
        <Plus className="h-3.5 w-3.5" />
        Create from Outline
      </button>

      {open && (
        <div className="border-t border-border bg-muted/10 px-6 py-4 space-y-3">
          {step === 'edit' ? (
            <>
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Use <code className="bg-muted px-1 rounded">#</code> for acts,{' '}
                  <code className="bg-muted px-1 rounded">##</code> for chapters, plain text for scenes.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 gap-1.5 text-xs shrink-0"
                  onClick={() => setTemplateOpen(true)}
                >
                  <BookTemplate className="h-3.5 w-3.5" />
                  Templates
                </Button>
              </div>

              <Textarea
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder={`# Act 1: Setup\n## Chapter 1\nThe protagonist discovers a mysterious letter...\n## Chapter 2\nA dangerous journey begins.`}
                className="min-h-[160px] text-sm font-mono resize-none"
              />

              <div className="flex justify-end">
                <Button size="sm" onClick={handleParse} disabled={!text.trim()}>
                  Preview structure
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="text-xs text-muted-foreground">
                Review the parsed structure below. This will be appended to your existing acts.
              </p>

              <ScrollArea className="h-48 rounded-md border border-border bg-background p-3">
                <PreviewTree parsed={parsed} />
              </ScrollArea>

              <p className="text-xs text-muted-foreground">
                Will add{' '}
                <strong>{parsed.length}</strong> act{parsed.length !== 1 ? 's' : ''},{' '}
                <strong>{parsed.reduce((n, a) => n + a.chapters.length, 0)}</strong> chapters,{' '}
                <strong>{scenesCount}</strong> scenes.
              </p>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" size="sm" onClick={handleBack}>Back to edit</Button>
                <Button size="sm" onClick={handleAppend} disabled={importing || parsed.length === 0}>
                  {importing ? 'Appending…' : 'Append to novel'}
                </Button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Template picker dialog */}
      <Dialog open={templateOpen} onOpenChange={setTemplateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Choose a Template</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-72">
            <div className="space-y-1 pr-2">
              {OUTLINE_TEMPLATES.map(tpl => (
                <button
                  key={tpl.id}
                  className="w-full rounded-md border border-transparent p-3 text-left hover:border-border hover:bg-muted/50 transition-colors"
                  onClick={() => applyTemplate(tpl)}
                >
                  <p className="text-sm font-medium">{tpl.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{tpl.description}</p>
                </button>
              ))}
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setTemplateOpen(false)}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
