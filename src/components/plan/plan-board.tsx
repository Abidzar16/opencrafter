import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Plus } from 'lucide-react'
import { ActSection } from './act-section'
import { ArchivedPanel } from './archived-panel'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { useActs, useCreateAct, useOrderedItems } from '@/lib/db/hooks'
import { LayoutGrid } from 'lucide-react'
import type { Act } from '@/types'

interface PlanBoardProps {
  novelId: string
}

function SortableAct({ act, novelId }: { act: Act; novelId: string }) {
  const sortableProps = useSortable({ id: act.id })
  return <ActSection act={act} novelId={novelId} sortableProps={sortableProps} />
}

export function PlanBoard({ novelId }: PlanBoardProps) {
  const acts = useActs(novelId)
  const createAct = useCreateAct()
  const persistOrder = useOrderedItems()

  const activeActs = acts?.filter(a => !a.archived) ?? []

  async function handleAddAct() {
    await createAct({
      novelId,
      title: 'New Act',
      order: activeActs.length,
      archived: false,
    })
  }

  async function handleActDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const ids = activeActs.map(a => a.id)
    const oldIndex = ids.indexOf(active.id as string)
    const newIndex = ids.indexOf(over.id as string)
    if (oldIndex === -1 || newIndex === -1) return
    const reordered = [...ids]
    reordered.splice(oldIndex, 1)
    reordered.splice(newIndex, 0, active.id as string)
    await persistOrder('acts', reordered)
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-6">
      {acts === undefined ? null : acts.filter(a => !a.archived).length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-16">
          <EmptyState
            icon={<LayoutGrid />}
            title="No acts yet"
            description="Start building your story structure by adding an act."
          />
          <Button onClick={handleAddAct}>
            <Plus className="mr-2 h-4 w-4" />
            Add Act
          </Button>
        </div>
      ) : (
        <>
          <DndContext collisionDetection={closestCenter} onDragEnd={handleActDragEnd}>
            <SortableContext
              items={activeActs.map(a => a.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {activeActs.map(act => (
                  <SortableAct key={act.id} act={act} novelId={novelId} />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          <Button
            variant="outline"
            size="sm"
            className="mt-4 w-full"
            onClick={handleAddAct}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Act
          </Button>
        </>
      )}

      <ArchivedPanel novelId={novelId} />
    </div>
  )
}
