import { useState } from 'react'
import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { ChevronDown, ChevronRight, GripVertical, Plus, Copy, Archive, Trash2 } from 'lucide-react'
import { ChapterSection } from './chapter-section'
import { InlineEdit } from './inline-edit'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { ActionMenu } from '@/components/ui/action-menu'
import { Button } from '@/components/ui/button'
import {
  useChaptersByAct,
  useCreateChapter,
  useUpdateAct,
  useDeleteAct,
  useDuplicateAct,
  useOrderedItems,
} from '@/lib/db/hooks'
import { toast } from 'sonner'
import type { Act, Chapter } from '@/types'

interface ActSectionProps {
  act: Act
  novelId: string
  sortableProps?: ReturnType<typeof useSortable>
}

function SortableChapter({ chapter, novelId }: { chapter: Chapter; novelId: string }) {
  const sortableProps = useSortable({ id: chapter.id })
  return <ChapterSection chapter={chapter} novelId={novelId} sortableProps={sortableProps} />
}

export function ActSection({ act, novelId, sortableProps }: ActSectionProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const chapters = useChaptersByAct(act.id)
  const createChapter = useCreateChapter()
  const updateAct = useUpdateAct()
  const deleteAct = useDeleteAct()
  const duplicateAct = useDuplicateAct()
  const persistOrder = useOrderedItems()

  const activeChapters = chapters?.filter(c => !c.archived) ?? []

  async function handleAddChapter() {
    await createChapter({
      actId: act.id,
      novelId,
      title: 'New Chapter',
      order: activeChapters.length,
      archived: false,
    })
  }

  async function handleChapterDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const ids = activeChapters.map(c => c.id)
    const oldIndex = ids.indexOf(active.id as string)
    const newIndex = ids.indexOf(over.id as string)
    if (oldIndex === -1 || newIndex === -1) return
    const reordered = [...ids]
    reordered.splice(oldIndex, 1)
    reordered.splice(newIndex, 0, active.id as string)
    await persistOrder('chapters', reordered)
  }

  const actions = [
    {
      label: 'Duplicate',
      icon: <Copy className="h-4 w-4" />,
      onClick: async () => {
        await duplicateAct(act.id)
        toast.success('Act duplicated')
      },
    },
    {
      label: 'Archive',
      icon: <Archive className="h-4 w-4" />,
      onClick: () => {
        updateAct(act.id, { archived: true })
        toast.success('Act archived')
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
    <div {...dragHandle} className="group/act">
      {/* Act header */}
      <div className="hover:bg-muted/30 flex items-center gap-1 rounded-md px-2 py-2">
        {sortableProps && (
          <button
            {...sortableProps.attributes}
            {...sortableProps.listeners}
            className="text-muted-foreground/40 hover:text-muted-foreground cursor-grab touch-none"
            aria-label="Drag to reorder"
          >
            <GripVertical className="h-4 w-4" />
          </button>
        )}

        <button
          onClick={() => setCollapsed(v => !v)}
          className="text-muted-foreground hover:text-foreground"
          aria-label={collapsed ? 'Expand act' : 'Collapse act'}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>

        <div className="min-w-0 flex-1">
          <InlineEdit
            value={act.title}
            onSave={title => updateAct(act.id, { title })}
            className="text-sm font-semibold"
          />
        </div>

        <span className="text-muted-foreground text-xs">{activeChapters.length}ch</span>

        <div className="opacity-0 group-hover/act:opacity-100">
          <ActionMenu actions={actions} />
        </div>
      </div>

      {/* Chapters list */}
      {!collapsed && (
        <div className="ml-4 space-y-0.5 pb-2">
          <DndContext collisionDetection={closestCenter} onDragEnd={handleChapterDragEnd}>
            <SortableContext
              items={activeChapters.map(c => c.id)}
              strategy={verticalListSortingStrategy}
            >
              {activeChapters.map(chapter => (
                <SortableChapter key={chapter.id} chapter={chapter} novelId={novelId} />
              ))}
            </SortableContext>
          </DndContext>

          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground h-7 w-full justify-start gap-1 text-xs"
            onClick={handleAddChapter}
          >
            <Plus className="h-3.5 w-3.5" />
            Add Chapter
          </Button>
        </div>
      )}

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={v => setConfirmDelete(v)}
        title={`Delete "${act.title}"?`}
        description="This will permanently delete the act and all its chapters and scenes."
        confirmLabel="Delete"
        destructive
        onConfirm={async () => {
          await deleteAct(act.id)
          toast.success('Act deleted')
        }}
      />
    </div>
  )
}
