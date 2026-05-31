import { useCodexEntry } from '@/lib/db/hooks'
import { useEditorStore } from '@/stores/editor-store'
import { Badge } from '@/components/ui/badge'
import { ActionMenu } from '@/components/ui/action-menu'
import { cn } from '@/lib/utils'
import { Copy, Archive, Trash2, MoveRight, User, FileText } from 'lucide-react'
import { useState } from 'react'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { MoveSceneDialog } from './move-dialog'
import { useUpdateScene, useDeleteScene, useDuplicateScene, useMoveScene } from '@/lib/db/hooks'
import { toast } from 'sonner'
import type { Scene, Label } from '@/types'
import type { CardConfig } from './card-config'

interface SceneCardProps {
  scene: Scene
  novelId: string
  config: CardConfig
  labels: Label[]
}

function PovBadge({ povCharacterId }: { povCharacterId?: string }) {
  const entry = useCodexEntry(povCharacterId)
  if (!entry) return null
  return (
    <Badge variant="outline" className="text-xs gap-1 shrink-0">
      <User className="h-2.5 w-2.5" />
      {entry.name}
    </Badge>
  )
}

export function SceneCard({ scene, novelId, config, labels }: SceneCardProps) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [moveOpen, setMoveOpen] = useState(false)
  const { setActiveScene } = useEditorStore()

  const updateScene = useUpdateScene()
  const deleteScene = useDeleteScene()
  const duplicateScene = useDuplicateScene()
  const moveScene = useMoveScene()

  const assignedLabels = labels.filter(l => scene.labels.includes(l.id))

  function exportScene() {
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

  const actions = [
    {
      label: 'Open details',
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
      onClick: exportScene,
    },
    {
      label: 'Delete',
      icon: <Trash2 className="h-4 w-4" />,
      onClick: () => setConfirmDelete(true),
      destructive: true,
    },
  ]

  return (
    <>
      <div
        className={cn(
          'group/card relative flex flex-col gap-1.5 rounded-lg border border-border bg-card p-3 cursor-pointer',
          'hover:border-primary/50 hover:shadow-sm transition-all',
          'overflow-hidden',
        )}
        style={{ width: config.width, minHeight: config.height }}
        onClick={() => setActiveScene(scene.id)}
      >
        {/* Action menu */}
        <div
          className="absolute top-2 right-2 opacity-0 group-hover/card:opacity-100 transition-opacity"
          onClick={e => e.stopPropagation()}
        >
          <ActionMenu actions={actions} />
        </div>

        {/* Title */}
        <p className="text-sm font-semibold leading-snug pr-6 line-clamp-2">{scene.title}</p>

        {/* Summary */}
        {config.showSummary && scene.summary && (
          <p
            className="text-xs text-muted-foreground leading-relaxed flex-1"
            style={{ overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' as const }}
          >
            {scene.summary}
          </p>
        )}

        {/* Footer badges */}
        <div className="flex flex-wrap items-center gap-1 mt-auto">
          {config.showWordCount && scene.wordCount > 0 && (
            <Badge variant="secondary" className="text-xs">{scene.wordCount}w</Badge>
          )}
          {config.showPov && scene.povCharacterId && (
            <PovBadge povCharacterId={scene.povCharacterId} />
          )}
          {config.showLabels && assignedLabels.map(label => (
            <Badge
              key={label.id}
              variant="outline"
              className="text-xs"
              style={{ borderColor: label.color, color: label.color }}
            >
              {label.name}
            </Badge>
          ))}
        </div>
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
    </>
  )
}
