import { useState, useEffect } from 'react'
import { X, ChevronDown, ChevronRight } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { BeatEditor } from './beat-editor'
import { LabelSelector } from './label-manager'
import {
  useScene,
  useChapter,
  useUpdateScene,
  useCodexEntriesByType,
} from '@/lib/db/hooks'
import { useEditorStore } from '@/stores/editor-store'
import { CodexType } from '@/types'
import type { Beat } from '@/types'

interface SectionProps {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
}

function Section({ title, children, defaultOpen = true }: SectionProps) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div>
      <button
        className="flex w-full items-center justify-between py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground"
        onClick={() => setOpen(v => !v)}
      >
        {title}
        {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
      </button>
      {open && <div className="pt-1 pb-2">{children}</div>}
    </div>
  )
}

interface SceneDetailPanelProps {
  novelId: string
}

export function SceneDetailPanel({ novelId }: SceneDetailPanelProps) {
  const { activeSceneId, setActiveScene } = useEditorStore()
  const scene = useScene(activeSceneId ?? undefined)
  const chapter = useChapter(scene?.chapterId)
  const updateScene = useUpdateScene()
  const characters = useCodexEntriesByType(novelId, CodexType.Character) ?? []

  // Local state mirrors scene fields for controlled inputs
  const [title, setTitle] = useState('')
  const [subtitle, setSubtitle] = useState('')
  const [summary, setSummary] = useState('')
  const [showSubtitle, setShowSubtitle] = useState(false)

  // Sync local state when scene changes (keyed on scene.id to avoid stale state)
  useEffect(() => {
    if (!scene) return
    setTitle(scene.title)
    setSubtitle(scene.subtitle ?? '')
    setSummary(scene.summary ?? '')
    setShowSubtitle(!!scene.subtitle)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene?.id])

  if (!activeSceneId) return null

  function handleClose() {
    setActiveScene(null)
  }

  function savePatch(patch: Parameters<typeof updateScene>[1]) {
    if (!scene) return
    updateScene(scene.id, patch)
  }

  function handleBeatsChange(beats: Beat[]) {
    savePatch({ beats })
  }

  return (
    <Sheet open={!!activeSceneId} onOpenChange={open => !open && handleClose()}>
      <SheetContent
        side="right"
        className="w-[380px] sm:w-[420px] flex flex-col gap-0 p-0 overflow-hidden"
      >
        {scene ? (
          <>
            <SheetHeader className="px-4 pt-4 pb-3 border-b border-border shrink-0">
              <div className="flex items-center justify-between">
                <SheetTitle className="text-base">Scene Details</SheetTitle>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleClose}>
                  <X className="h-4 w-4" />
                  <span className="sr-only">Close</span>
                </Button>
              </div>
              {chapter && (
                <p className="text-xs text-muted-foreground">in {chapter.title}</p>
              )}
            </SheetHeader>

            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {/* Title */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Title</label>
                <Input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  onBlur={() => title.trim() && savePatch({ title: title.trim() })}
                  className="h-8 text-sm"
                />
              </div>

              {/* Subtitle */}
              {showSubtitle ? (
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Subtitle</label>
                  <Input
                    value={subtitle}
                    placeholder="Optional subtitle"
                    onChange={e => setSubtitle(e.target.value)}
                    onBlur={() => savePatch({ subtitle: subtitle.trim() || undefined })}
                    className="h-8 text-sm"
                  />
                </div>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 gap-1 text-xs text-muted-foreground"
                  onClick={() => setShowSubtitle(true)}
                >
                  + Add subtitle
                </Button>
              )}

              {/* Summary */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Summary</label>
                <Textarea
                  value={summary}
                  placeholder="Scene summary…"
                  onChange={e => setSummary(e.target.value)}
                  onBlur={() => savePatch({ summary })}
                  className="min-h-[80px] text-sm resize-none"
                />
              </div>

              <Separator />

              {/* Beats */}
              <Section title="Beats">
                <BeatEditor beats={scene.beats} onChange={handleBeatsChange} />
              </Section>

              <Separator />

              {/* POV Character */}
              <Section title="POV Character">
                <Select
                  value={scene.povCharacterId ?? 'none'}
                  onValueChange={v => savePatch({ povCharacterId: v === 'none' ? undefined : v })}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {characters.map(char => (
                      <SelectItem key={char.id} value={char.id}>
                        {char.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {characters.length === 0 && (
                  <p className="mt-1 text-xs text-muted-foreground italic">
                    Add character entries in the Codex to assign a POV.
                  </p>
                )}
              </Section>

              <Separator />

              {/* Labels */}
              <Section title="Labels">
                <LabelSelector
                  novelId={novelId}
                  selectedIds={scene.labels}
                  onChange={ids => savePatch({ labels: ids })}
                />
              </Section>

              <Separator />

              {/* Metadata */}
              <Section title="Info" defaultOpen={false}>
                <div className="space-y-1.5 text-xs text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Word count</span>
                    <span className="font-medium text-foreground">{scene.wordCount}</span>
                  </div>
                  {chapter && (
                    <div className="flex justify-between">
                      <span>Chapter</span>
                      <span className="font-medium text-foreground truncate max-w-[60%] text-right">{chapter.title}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Beats</span>
                    <span className="font-medium text-foreground">{scene.beats.length}</span>
                  </div>
                </div>
              </Section>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center flex-1 text-sm text-muted-foreground">
            Loading…
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
