import { useState } from 'react'
import { Archive, ChevronDown, ChevronRight, RotateCcw, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import {
  useArchivedActs,
  useArchivedChapters,
  useArchivedScenes,
  useUpdateAct,
  useUpdateChapter,
  useUpdateScene,
  useDeleteAct,
  useDeleteChapter,
  useDeleteScene,
} from '@/lib/db/hooks'
import { toast } from 'sonner'

interface ArchivedPanelProps {
  novelId: string
}

export function ArchivedPanel({ novelId }: ArchivedPanelProps) {
  const [open, setOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<{
    type: 'act' | 'chapter' | 'scene'
    id: string
    title: string
  } | null>(null)

  const archivedActs = useArchivedActs(novelId)
  const archivedChapters = useArchivedChapters(novelId)
  const archivedScenes = useArchivedScenes(novelId)

  const updateAct = useUpdateAct()
  const updateChapter = useUpdateChapter()
  const updateScene = useUpdateScene()
  const deleteAct = useDeleteAct()
  const deleteChapter = useDeleteChapter()
  const deleteScene = useDeleteScene()

  const totalArchived =
    (archivedActs?.length ?? 0) + (archivedChapters?.length ?? 0) + (archivedScenes?.length ?? 0)

  if (totalArchived === 0) return null

  async function handleDelete() {
    if (!confirmDelete) return
    try {
      if (confirmDelete.type === 'act') await deleteAct(confirmDelete.id)
      if (confirmDelete.type === 'chapter') await deleteChapter(confirmDelete.id)
      if (confirmDelete.type === 'scene') await deleteScene(confirmDelete.id)
      toast.success(`${confirmDelete.title} deleted`)
    } catch {
      toast.error('Delete failed')
    } finally {
      setConfirmDelete(null)
    }
  }

  return (
    <div className="border-border mt-4 rounded-lg border">
      <button
        onClick={() => setOpen(v => !v)}
        className="hover:bg-muted/50 flex w-full items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium"
      >
        <Archive className="text-muted-foreground h-4 w-4" />
        <span>Archived ({totalArchived})</span>
        {open ? (
          <ChevronDown className="text-muted-foreground ml-auto h-4 w-4" />
        ) : (
          <ChevronRight className="text-muted-foreground ml-auto h-4 w-4" />
        )}
      </button>

      {open && (
        <div className="border-border divide-border divide-y border-t">
          {archivedActs?.map(act => (
            <ArchivedRow
              key={act.id}
              label="Act"
              title={act.title}
              onRestore={() => {
                updateAct(act.id, { archived: false })
                toast.success('Act restored')
              }}
              onDelete={() => setConfirmDelete({ type: 'act', id: act.id, title: act.title })}
            />
          ))}
          {archivedChapters?.map(chapter => (
            <ArchivedRow
              key={chapter.id}
              label="Chapter"
              title={chapter.title}
              onRestore={() => {
                updateChapter(chapter.id, { archived: false })
                toast.success('Chapter restored')
              }}
              onDelete={() =>
                setConfirmDelete({ type: 'chapter', id: chapter.id, title: chapter.title })
              }
            />
          ))}
          {archivedScenes?.map(scene => (
            <ArchivedRow
              key={scene.id}
              label="Scene"
              title={scene.title}
              onRestore={() => {
                updateScene(scene.id, { archived: false })
                toast.success('Scene restored')
              }}
              onDelete={() =>
                setConfirmDelete({ type: 'scene', id: scene.id, title: scene.title })
              }
            />
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!confirmDelete}
        onOpenChange={v => !v && setConfirmDelete(null)}
        title={`Delete "${confirmDelete?.title}"?`}
        description="This will permanently delete it and all its children. This cannot be undone."
        confirmLabel="Delete"
        destructive
        onConfirm={handleDelete}
      />
    </div>
  )
}

function ArchivedRow({
  label,
  title,
  onRestore,
  onDelete,
}: {
  label: string
  title: string
  onRestore: () => void
  onDelete: () => void
}) {
  return (
    <div className="flex items-center gap-2 px-4 py-2">
      <span className="text-muted-foreground w-14 shrink-0 text-xs">{label}</span>
      <span className="text-sm">{title}</span>
      <div className="ml-auto flex items-center gap-1">
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onRestore} title="Restore">
          <RotateCcw className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="text-destructive hover:text-destructive h-7 w-7"
          onClick={onDelete}
          title="Delete permanently"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
}
