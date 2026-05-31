import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Copy, Archive, Trash2, MoveRight, FileText, ExternalLink, History } from 'lucide-react'
import { InlineEdit } from './inline-edit'
import { MoveSceneDialog } from './move-dialog'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { ActionMenu } from '@/components/ui/action-menu'
import { RevisionHistoryModal } from '@/components/ui/revision-history-modal'
import {
  useUpdateScene,
  useDeleteScene,
  useDuplicateScene,
  useMoveScene,
} from '@/lib/db/hooks'
import { useEditorStore } from '@/stores/editor-store'
import { toast } from 'sonner'
import type { Scene } from '@/types'
import { RevisionEntityType } from '@/types'

interface SceneRowProps {
  scene: Scene
  novelId: string
}

function exportSceneText(scene: Scene) {
  const lines: string[] = [scene.title]
  if (scene.subtitle) lines.push(scene.subtitle)
  if (scene.summary) lines.push('', scene.summary)
  if (scene.beats.length > 0) {
    lines.push('', 'Beats:')
    scene.beats.forEach((b, i) => lines.push(`${i + 1}. ${b.text}`))
  }
  const blob = new Blob([lines.join('\n')], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${scene.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.txt`
  a.click()
  URL.revokeObjectURL(url)
}

export function SceneRow({ scene, novelId }: SceneRowProps) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [moveOpen, setMoveOpen] = useState(false)
  const [revisionOpen, setRevisionOpen] = useState(false)

  const updateScene = useUpdateScene()
  const deleteScene = useDeleteScene()
  const duplicateScene = useDuplicateScene()
  const moveScene = useMoveScene()
  const { setActiveScene } = useEditorStore()

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: scene.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  const actions = [
    {
      label: 'Open details',
      icon: <ExternalLink className="h-4 w-4" />,
      onClick: () => setActiveScene(scene.id),
    },
    {
      label: scene.subtitle ? 'Edit subtitle' : 'Add subtitle',
      icon: <FileText className="h-4 w-4" />,
      onClick: () => setActiveScene(scene.id),
    },
    {
      label: 'Duplicate',
      icon: <Copy className="h-4 w-4" />,
      onClick: async () => {
        await duplicateScene(scene.id)
        toast.success('Scene duplicated')
      },
    },
    {
      label: 'Move to chapter…',
      icon: <MoveRight className="h-4 w-4" />,
      onClick: () => setMoveOpen(true),
    },
    {
      label: 'Archive',
      icon: <Archive className="h-4 w-4" />,
      onClick: () => {
        updateScene(scene.id, { archived: true })
        toast.success('Scene archived')
      },
    },
    {
      label: 'Export scene',
      icon: <FileText className="h-4 w-4" />,
      onClick: () => exportSceneText(scene),
    },
    {
      label: 'Version history',
      icon: <History className="h-4 w-4" />,
      onClick: () => setRevisionOpen(true),
    },
    {
      label: 'Delete',
      icon: <Trash2 className="h-4 w-4" />,
      onClick: () => setConfirmDelete(true),
      destructive: true,
    },
  ]

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="border-border bg-background hover:bg-muted/30 group flex items-center gap-2 rounded border px-3 py-2"
    >
      <button
        {...attributes}
        {...listeners}
        className="text-muted-foreground/40 hover:text-muted-foreground cursor-grab touch-none"
        aria-label="Drag to reorder"
      >
        <GripVertical className="h-4 w-4" />
      </button>

      <div className="min-w-0 flex-1">
        <InlineEdit
          value={scene.title}
          onSave={title => updateScene(scene.id, { title })}
          className="text-sm font-medium"
        />
        {scene.subtitle && (
          <p className="text-muted-foreground mt-0.5 truncate text-xs italic">{scene.subtitle}</p>
        )}
        {scene.summary && (
          <p className="text-muted-foreground mt-0.5 truncate text-xs">{scene.summary}</p>
        )}
      </div>

      {scene.wordCount > 0 && (
        <span className="text-muted-foreground shrink-0 text-xs">{scene.wordCount}w</span>
      )}

      <div className="opacity-0 group-hover:opacity-100">
        <ActionMenu actions={actions} />
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={v => setConfirmDelete(v)}
        title={`Delete "${scene.title}"?`}
        description="This will permanently delete the scene and its content."
        confirmLabel="Delete"
        destructive
        onConfirm={async () => {
          await deleteScene(scene.id)
          toast.success('Scene deleted')
        }}
      />

      <MoveSceneDialog
        open={moveOpen}
        novelId={novelId}
        currentChapterId={scene.chapterId}
        onMove={async targetChapterId => {
          await moveScene(scene.id, targetChapterId)
          toast.success('Scene moved')
        }}
        onClose={() => setMoveOpen(false)}
      />

      <RevisionHistoryModal
        open={revisionOpen}
        onOpenChange={setRevisionOpen}
        entityType={RevisionEntityType.SceneContent}
        entityId={scene.id}
        onRestore={() => {
          toast.info('Open the scene in Write mode to restore a version.')
        }}
      />
    </div>
  )
}
