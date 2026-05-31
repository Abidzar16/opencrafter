import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useActs, useChaptersByAct } from '@/lib/db/hooks'
import { cn } from '@/lib/utils'
import type { Chapter } from '@/types'

// Move-scene dialog: pick target chapter

interface MoveSceneDialogProps {
  open: boolean
  novelId: string
  currentChapterId: string
  onMove: (targetChapterId: string) => void
  onClose: () => void
}

function ChapterOption({
  chapter,
  selected,
  onSelect,
}: {
  chapter: Chapter
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        'hover:bg-accent w-full rounded px-3 py-2 text-left text-sm',
        selected && 'bg-accent',
      )}
    >
      {chapter.title}
    </button>
  )
}

function ActChapters({
  actId,
  selectedChapterId,
  currentChapterId,
  onSelect,
}: {
  actId: string
  selectedChapterId: string | null
  currentChapterId: string
  onSelect: (id: string) => void
}) {
  const chapters = useChaptersByAct(actId)
  if (!chapters?.length) return null

  return (
    <>
      {chapters
        .filter(c => !c.archived && c.id !== currentChapterId)
        .map(chapter => (
          <ChapterOption
            key={chapter.id}
            chapter={chapter}
            selected={selectedChapterId === chapter.id}
            onSelect={() => onSelect(chapter.id)}
          />
        ))}
    </>
  )
}

export function MoveSceneDialog({
  open,
  novelId,
  currentChapterId,
  onMove,
  onClose,
}: MoveSceneDialogProps) {
  const [selected, setSelected] = useState<string | null>(null)
  const acts = useActs(novelId)

  function handleMove() {
    if (selected) {
      onMove(selected)
      setSelected(null)
      onClose()
    }
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Move scene to chapter</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-72">
          <div className="space-y-3 pr-2">
            {acts
              ?.filter(a => !a.archived)
              .map(act => (
                <div key={act.id}>
                  <p className="text-muted-foreground mb-1 px-3 text-xs font-semibold uppercase tracking-wide">
                    {act.title}
                  </p>
                  <ActChapters
                    actId={act.id}
                    selectedChapterId={selected}
                    currentChapterId={currentChapterId}
                    onSelect={setSelected}
                  />
                </div>
              ))}
          </div>
        </ScrollArea>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button disabled={!selected} onClick={handleMove}>Move</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Move-chapter dialog: pick target act

interface MoveChapterDialogProps {
  open: boolean
  novelId: string
  currentActId: string
  onMove: (targetActId: string) => void
  onClose: () => void
}

export function MoveChapterDialog({
  open,
  novelId,
  currentActId,
  onMove,
  onClose,
}: MoveChapterDialogProps) {
  const [selected, setSelected] = useState<string | null>(null)
  const acts = useActs(novelId)

  function handleMove() {
    if (selected) {
      onMove(selected)
      setSelected(null)
      onClose()
    }
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Move chapter to act</DialogTitle>
        </DialogHeader>
        <div className="space-y-1">
          {acts
            ?.filter(a => !a.archived && a.id !== currentActId)
            .map(act => (
              <button
                key={act.id}
                onClick={() => setSelected(act.id)}
                className={cn(
                  'hover:bg-accent w-full rounded px-3 py-2 text-left text-sm',
                  selected === act.id && 'bg-accent',
                )}
              >
                {act.title}
              </button>
            ))}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button disabled={!selected} onClick={handleMove}>Move</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
