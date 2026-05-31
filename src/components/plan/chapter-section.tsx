import { useState } from 'react'
import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { ChevronDown, ChevronRight, GripVertical, Plus, Copy, Archive, Trash2, MoveRight, FileText } from 'lucide-react'
import { SceneRow } from './scene-row'
import { InlineEdit } from './inline-edit'
import { MoveChapterDialog } from './move-dialog'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { ActionMenu } from '@/components/ui/action-menu'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  useScenesByChapter,
  useCreateScene,
  useUpdateChapter,
  useDeleteChapter,
  useDuplicateChapter,
  useMoveChapter,
  useOrderedItems,
} from '@/lib/db/hooks'
import { toast } from 'sonner'
import type { Chapter } from '@/types'

interface ChapterSectionProps {
  chapter: Chapter
  novelId: string
  /** DnD sortable props from the parent act-section */
  sortableProps?: ReturnType<typeof useSortable>
}

export function ChapterSection({ chapter, novelId, sortableProps }: ChapterSectionProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [moveOpen, setMoveOpen] = useState(false)
  const [subtitleOpen, setSubtitleOpen] = useState(false)
  const [subtitleValue, setSubtitleValue] = useState(chapter.subtitle ?? '')

  const scenes = useScenesByChapter(chapter.id)
  const createScene = useCreateScene()
  const updateChapter = useUpdateChapter()
  const deleteChapter = useDeleteChapter()
  const duplicateChapter = useDuplicateChapter()
  const moveChapter = useMoveChapter()
  const persistOrder = useOrderedItems()

  const activeScenes = scenes?.filter(s => !s.archived) ?? []

  async function handleAddScene() {
    await createScene({
      chapterId: chapter.id,
      novelId,
      title: 'New Scene',
      summary: '',
      beats: [],
      labels: [],
      codexAssociations: [],
      wordCount: 0,
      order: activeScenes.length,
      archived: false,
    })
  }

  async function handleSceneDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const ids = activeScenes.map(s => s.id)
    const oldIndex = ids.indexOf(active.id as string)
    const newIndex = ids.indexOf(over.id as string)
    if (oldIndex === -1 || newIndex === -1) return
    const reordered = [...ids]
    reordered.splice(oldIndex, 1)
    reordered.splice(newIndex, 0, active.id as string)
    await persistOrder('scenes', reordered)
  }

  const actions = [
    {
      label: chapter.subtitle ? 'Edit subtitle' : 'Add subtitle',
      icon: <FileText className="h-4 w-4" />,
      onClick: () => {
        setSubtitleValue(chapter.subtitle ?? '')
        setSubtitleOpen(true)
      },
    },
    {
      label: 'Duplicate',
      icon: <Copy className="h-4 w-4" />,
      onClick: async () => {
        await duplicateChapter(chapter.id)
        toast.success('Chapter duplicated')
      },
    },
    {
      label: 'Move to act…',
      icon: <MoveRight className="h-4 w-4" />,
      onClick: () => setMoveOpen(true),
    },
    {
      label: 'Archive',
      icon: <Archive className="h-4 w-4" />,
      onClick: () => {
        updateChapter(chapter.id, { archived: true })
        toast.success('Chapter archived')
      },
    },
    {
      label: 'Delete',
      icon: <Trash2 className="h-4 w-4" />,
      onClick: () => setConfirmDelete(true),
      destructive: true,
    },
  ]

  const dragHandle = sortableProps
    ? {
        ref: sortableProps.setNodeRef,
        style: {
          transform: CSS.Transform.toString(sortableProps.transform),
          transition: sortableProps.transition,
          opacity: sortableProps.isDragging ? 0.4 : 1,
        },
      }
    : {}

  return (
    <div {...dragHandle} className="group/chapter rounded-md">
      {/* Chapter header */}
      <div className="hover:bg-muted/30 flex items-center gap-1 rounded-md px-2 py-1.5">
        {sortableProps && (
          <button
            {...sortableProps.attributes}
            {...sortableProps.listeners}
            className="text-muted-foreground/40 hover:text-muted-foreground cursor-grab touch-none"
            aria-label="Drag to reorder"
          >
            <GripVertical className="h-3.5 w-3.5" />
          </button>
        )}

        <button
          onClick={() => setCollapsed(v => !v)}
          className="text-muted-foreground hover:text-foreground"
          aria-label={collapsed ? 'Expand chapter' : 'Collapse chapter'}
        >
          {collapsed ? (
            <ChevronRight className="h-3.5 w-3.5" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5" />
          )}
        </button>

        <div className="min-w-0 flex-1">
          <InlineEdit
            value={chapter.title}
            onSave={title => updateChapter(chapter.id, { title })}
            className="text-sm font-medium"
          />
          {chapter.subtitle && (
            <p className="text-xs text-muted-foreground italic truncate">{chapter.subtitle}</p>
          )}
        </div>

        <span className="text-muted-foreground text-xs">{activeScenes.length}s</span>

        <div className="opacity-0 group-hover/chapter:opacity-100">
          <ActionMenu actions={actions} />
        </div>
      </div>

      {/* Scenes list */}
      {!collapsed && (
        <div className="ml-6 space-y-1 pb-1">
          <DndContext collisionDetection={closestCenter} onDragEnd={handleSceneDragEnd}>
            <SortableContext
              items={activeScenes.map(s => s.id)}
              strategy={verticalListSortingStrategy}
            >
              {activeScenes.map(scene => (
                <SceneRow key={scene.id} scene={scene} novelId={novelId} />
              ))}
            </SortableContext>
          </DndContext>

          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground h-7 w-full justify-start gap-1 text-xs"
            onClick={handleAddScene}
          >
            <Plus className="h-3.5 w-3.5" />
            Add Scene
          </Button>
        </div>
      )}

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={v => setConfirmDelete(v)}
        title={`Delete "${chapter.title}"?`}
        description="This will permanently delete the chapter and all its scenes."
        confirmLabel="Delete"
        destructive
        onConfirm={async () => {
          await deleteChapter(chapter.id)
          toast.success('Chapter deleted')
        }}
      />

      <MoveChapterDialog
        open={moveOpen}
        novelId={novelId}
        currentActId={chapter.actId}
        onMove={async targetActId => {
          await moveChapter(chapter.id, targetActId)
          toast.success('Chapter moved')
        }}
        onClose={() => setMoveOpen(false)}
      />

      {/* Subtitle dialog */}
      <Dialog open={subtitleOpen} onOpenChange={v => setSubtitleOpen(v)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{chapter.subtitle ? 'Edit Subtitle' : 'Add Subtitle'}</DialogTitle>
          </DialogHeader>
          <Input
            value={subtitleValue}
            onChange={e => setSubtitleValue(e.target.value)}
            placeholder="Chapter subtitle…"
            onKeyDown={e => {
              if (e.key === 'Enter') {
                updateChapter(chapter.id, { subtitle: subtitleValue.trim() || undefined })
                setSubtitleOpen(false)
              }
            }}
          />
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setSubtitleOpen(false)}>Cancel</Button>
            <Button
              size="sm"
              onClick={() => {
                updateChapter(chapter.id, { subtitle: subtitleValue.trim() || undefined })
                setSubtitleOpen(false)
              }}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
