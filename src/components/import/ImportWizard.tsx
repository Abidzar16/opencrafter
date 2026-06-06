import { useState, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'

import { parseMarkdown, parseDocx } from '@/lib/import/parse-structure'
import type { ParsedStructure, ParsedAct, ParsedChapter } from '@/lib/import/parse-structure'
import { useCreateAct, useCreateChapter, useCreateScene, useActs } from '@/lib/db/hooks'
import { useCreateNovel } from '@/lib/db/hooks/novels'
import { toast } from '@/components/ui/toast-provider'
import { useNavigate } from '@tanstack/react-router'
import { FileText, ChevronRight, FileUp, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

type ImportMode = 'new' | 'append'
type Step = 'pick' | 'preview' | 'confirm'

interface ImportWizardProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  novelId?: string   // if set, default mode is 'append'
}

export function ImportWizard({ open, onOpenChange, novelId }: ImportWizardProps) {
  const [step, setStep] = useState<Step>('pick')
  const [file, setFile] = useState<File | null>(null)
  const [parsed, setParsed] = useState<ParsedStructure | null>(null)
  const [mode, setMode] = useState<ImportMode>(novelId ? 'append' : 'new')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const createNovel = useCreateNovel()
  const createAct = useCreateAct()
  const createChapter = useCreateChapter()
  const createScene = useCreateScene()
  const acts = useActs(novelId)
  const navigate = useNavigate()

  function reset() {
    setStep('pick')
    setFile(null)
    setParsed(null)
    setError(null)
    setLoading(false)
  }

  function handleClose() {
    reset()
    onOpenChange(false)
  }

  async function handleFilePick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    setError(null)
    setLoading(true)
    try {
      let result: ParsedStructure
      if (f.name.endsWith('.md') || f.name.endsWith('.txt')) {
        const text = await f.text()
        result = parseMarkdown(text)
      } else if (f.name.endsWith('.docx')) {
        result = await parseDocx(f)
      } else {
        throw new Error('Unsupported file type. Choose a .md, .txt, or .docx file.')
      }
      setParsed(result)
      setStep('preview')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse file.')
    } finally {
      setLoading(false)
    }
    e.target.value = ''
  }

  async function handleImport() {
    if (!parsed) return
    setLoading(true)
    try {
      if (mode === 'new') {
        const novelTitle = file?.name.replace(/\.[^.]+$/, '') ?? 'Imported novel'
        const newNovelId = await createNovel({
          title: novelTitle,
          archived: false,
          settings: {},
        })
        await importStructure(parsed, newNovelId, 0)
        toast.success(`"${novelTitle}" created with ${countScenes(parsed)} scenes.`)
        navigate({ to: '/novel/$novelId/plan', params: { novelId: newNovelId } })
      } else if (novelId) {
        const actOffset = acts?.length ?? 0
        await importStructure(parsed, novelId, actOffset)
        toast.success(`Imported ${countScenes(parsed)} scenes.`)
      }
      handleClose()
    } catch {
      toast.error('Import failed.')
    } finally {
      setLoading(false)
    }
  }

  async function importStructure(structure: ParsedStructure, targetNovelId: string, actOffset: number) {
    for (let ai = 0; ai < structure.acts.length; ai++) {
      const act = structure.acts[ai]
      const actId = await createAct({
        novelId: targetNovelId,
        title: act.title,
        order: actOffset + ai,
        archived: false,
      })
      for (let ci = 0; ci < act.chapters.length; ci++) {
        const chapter = act.chapters[ci]
        const chapterId = await createChapter({
          novelId: targetNovelId,
          actId,
          title: chapter.title,
          order: ci,
          archived: false,
        })
        for (let si = 0; si < chapter.scenes.length; si++) {
          const scene = chapter.scenes[si]
          await createScene({
            novelId: targetNovelId,
            chapterId,
            title: scene.title,
            summary: scene.summary || undefined,
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
  }

  const sceneCount = parsed ? countScenes(parsed) : 0

  return (
    <Dialog open={open} onOpenChange={v => !v && handleClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileUp className="h-4 w-4" />
            Import from file
          </DialogTitle>
        </DialogHeader>

        {/* Stepper */}
        <div className="flex items-center gap-1 text-xs">
          {(['pick', 'preview'] as Step[]).map((s, i) => (
            <span key={s} className="flex items-center gap-1">
              <span className={cn(
                'rounded px-2 py-0.5 font-medium',
                step === s ? 'bg-primary text-primary-foreground' : 'text-muted-foreground',
              )}>
                {i + 1}. {s === 'pick' ? 'Choose file' : 'Preview & import'}
              </span>
              {i === 0 && <ChevronRight className="text-muted-foreground h-3 w-3" />}
            </span>
          ))}
        </div>

        {/* Step: Pick */}
        {step === 'pick' && (
          <div className="space-y-4">
            <p className="text-muted-foreground text-sm">
              Choose a <strong>.docx</strong> or <strong>.md</strong> file. Headings map to:
              H1 → Act, H2 → Chapter, H3 → Scene, body text → Scene summary.
            </p>

            {error && (
              <div className="text-destructive flex items-center gap-2 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm dark:border-red-900 dark:bg-red-950">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <Button
              variant="outline"
              className="w-full py-8"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
            >
              {loading ? (
                <Spinner size="sm" className="mr-2" />
              ) : (
                <FileText className="mr-2 h-5 w-5" />
              )}
              {loading ? 'Parsing file…' : 'Click to choose file'}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".md,.txt,.docx"
              className="hidden"
              onChange={handleFilePick}
            />

            {novelId && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Import into:</p>
                <ModeToggle mode={mode} onChange={setMode} showAppend />
              </div>
            )}
          </div>
        )}

        {/* Step: Preview */}
        {step === 'preview' && parsed && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <FileText className="text-muted-foreground h-4 w-4" />
              <span className="text-sm font-medium">{file?.name}</span>
              <Badge variant="secondary">{sceneCount} scenes</Badge>
            </div>

            <ScrollArea className="h-60 rounded-md border">
              <div className="p-3 text-sm">
                {parsed.acts.map((act, ai) => (
                  <ActPreview key={ai} act={act} />
                ))}
              </div>
            </ScrollArea>

            {!novelId && (
              <p className="text-muted-foreground text-sm">
                A new novel will be created using the filename as the title.
              </p>
            )}
          </div>
        )}

        <DialogFooter>
          {step === 'pick' ? (
            <Button variant="outline" onClick={handleClose}>Cancel</Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => setStep('pick')}>Back</Button>
              <Button onClick={handleImport} disabled={loading}>
                {loading && <Spinner size="sm" className="mr-2" />}
                Import {sceneCount} scenes
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ActPreview({ act }: { act: ParsedAct }) {
  return (
    <div className="mb-2">
      <div className="font-semibold text-foreground">{act.title}</div>
      {act.chapters.map((ch, ci) => (
        <ChapterPreview key={ci} chapter={ch} />
      ))}
    </div>
  )
}

function ChapterPreview({ chapter }: { chapter: ParsedChapter }) {
  return (
    <div className="ml-3 mb-1">
      <div className="text-muted-foreground font-medium">{chapter.title}</div>
      {chapter.scenes.map((s, si) => (
        <div key={si} className="text-muted-foreground ml-3 text-xs">
          — {s.title}
        </div>
      ))}
    </div>
  )
}

function ModeToggle({
  mode,
  onChange,
  showAppend = false,
}: {
  mode: ImportMode
  onChange: (m: ImportMode) => void
  showAppend?: boolean
}) {
  const opts: { value: ImportMode; label: string }[] = [
    ...(showAppend ? [{ value: 'append' as ImportMode, label: 'Append to current novel' }] : []),
    { value: 'new', label: 'Create new novel' },
  ]
  return (
    <div className="flex flex-col gap-1.5">
      {opts.map(opt => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            'flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors',
            mode === opt.value
              ? 'border-primary bg-primary/5 font-medium'
              : 'border-border hover:bg-muted',
          )}
        >
          <span className={cn(
            'h-3.5 w-3.5 rounded-full border-2 transition-colors',
            mode === opt.value ? 'border-primary bg-primary' : 'border-muted-foreground',
          )} />
          {opt.label}
        </button>
      ))}
    </div>
  )
}

function countScenes(s: ParsedStructure) {
  return s.acts.reduce((sum, a) => sum + a.chapters.reduce((s2, c) => s2 + c.scenes.length, 0), 0)
}
