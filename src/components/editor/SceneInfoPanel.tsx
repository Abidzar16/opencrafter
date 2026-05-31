import { useState, useEffect } from 'react'
import { useScene, useChapter, useUpdateScene } from '@/lib/db/hooks'
import { useRevision } from '@/lib/hooks/use-revision'
import { useDebouncedSave } from '@/lib/hooks/use-debounced-save'
import { RevisionHistoryModal } from '@/components/ui/revision-history-modal'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { RevisionEntityType } from '@/types'
import { Hash, FileText, AlignLeft, History, Copy, ExternalLink } from 'lucide-react'
import { Link } from '@tanstack/react-router'

interface SceneInfoPanelProps {
  novelId: string
  sceneId: string | null
  wordCounts: Record<string, number>
  chapterId: string | null
}

export function SceneInfoPanel({ novelId, sceneId, wordCounts, chapterId }: SceneInfoPanelProps) {
  const scene = useScene(sceneId ?? undefined)
  const chapter = useChapter(scene?.chapterId ?? chapterId ?? undefined)
  const updateScene = useUpdateScene()
  const [summary, setSummary] = useState('')
  const [revisionModalOpen, setRevisionModalOpen] = useState(false)

  const saveRevision = useRevision(RevisionEntityType.SceneSummary, sceneId ?? undefined)

  const doSaveSummary = useDebouncedSave(async () => {
    if (!scene) return
    // Snapshot previous summary before overwrite
    if (scene.summary) {
      await saveRevision(scene.summary)
    }
    await updateScene(scene.id, { summary })
  }, 800)

  // Sync summary state when scene changes
  useEffect(() => {
    setSummary(scene?.summary ?? '')
  }, [scene?.id, scene?.summary])

  const totalWords = Object.values(wordCounts).reduce((a, b) => a + b, 0)
  const sceneWords = sceneId ? (wordCounts[sceneId] ?? scene?.wordCount ?? 0) : 0

  if (!sceneId || !scene) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <p className="text-muted-foreground text-sm">Select a scene to view details.</p>
      </div>
    )
  }

  return (
    <ScrollArea className="h-full">
      <div className="flex flex-col gap-4 p-4">
        {/* Scene identification */}
        <div>
          <h3 className="text-sm font-semibold">{scene.title || 'Untitled Scene'}</h3>
          {scene.subtitle && <p className="text-muted-foreground text-xs">{scene.subtitle}</p>}
          {chapter && (
            <p className="text-muted-foreground mt-1 text-xs">
              {chapter.title}
            </p>
          )}
        </div>

        <Separator />

        {/* Word counts */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2 text-xs">
            <Hash className="text-muted-foreground h-3 w-3" />
            <span className="text-muted-foreground">Scene words</span>
            <span className="ml-auto font-mono font-medium">{sceneWords.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <FileText className="text-muted-foreground h-3 w-3" />
            <span className="text-muted-foreground">Chapter total</span>
            <span className="ml-auto font-mono font-medium">{totalWords.toLocaleString()}</span>
          </div>
        </div>

        <Separator />

        {/* Summary */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5">
            <AlignLeft className="text-muted-foreground h-3 w-3" />
            <span className="text-xs font-medium">Summary</span>
          </div>
          <Textarea
            value={summary}
            onChange={e => {
              setSummary(e.target.value)
              doSaveSummary()
            }}
            placeholder="Scene summary…"
            className="h-24 resize-none text-xs"
          />
        </div>

        {/* POV character */}
        {scene.povCharacterId && (
          <>
            <Separator />
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground">POV</span>
              <span className="font-medium">{scene.povCharacterId}</span>
            </div>
          </>
        )}

        <Separator />

        {/* Quick actions */}
        <div className="flex flex-col gap-1">
          <p className="text-muted-foreground mb-1 text-xs font-medium uppercase tracking-wide">
            Quick actions
          </p>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 justify-start gap-2 text-xs"
            onClick={() => setRevisionModalOpen(true)}
          >
            <History className="h-3.5 w-3.5" />
            Version history
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 justify-start gap-2 text-xs"
            onClick={() => {
              const text = document.querySelector('.prose-editor')?.textContent ?? ''
              navigator.clipboard.writeText(text)
            }}
          >
            <Copy className="h-3.5 w-3.5" />
            Copy scene text
          </Button>
          <Button variant="ghost" size="sm" className="h-7 justify-start gap-2 text-xs" asChild>
            <Link to="/novel/$novelId/plan" params={{ novelId }}>
              <ExternalLink className="h-3.5 w-3.5" />
              Open in Plan
            </Link>
          </Button>
        </div>
      </div>

      {/* Revision history modal */}
      <RevisionHistoryModal
        open={revisionModalOpen}
        onOpenChange={setRevisionModalOpen}
        entityType={RevisionEntityType.SceneContent}
        entityId={sceneId}
        onRestore={() => {
          // Phase 3: wire up restore-to-editor
        }}
      />
    </ScrollArea>
  )
}
