import { useState } from 'react'
import {
  DndContext,
  closestCenter,
  type DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Beat } from '@/types'

interface BeatRowProps {
  beat: Beat
  onUpdate: (text: string) => void
  onDelete: () => void
}

function BeatRow({ beat, onUpdate, onDelete }: BeatRowProps) {
  const [value, setValue] = useState(beat.text)
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: beat.id,
  })

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
      }}
      className="group flex items-start gap-1.5"
    >
      <button
        {...attributes}
        {...listeners}
        className="mt-2 shrink-0 cursor-grab touch-none text-muted-foreground/40 hover:text-muted-foreground"
        aria-label="Drag to reorder"
      >
        <GripVertical className="h-3.5 w-3.5" />
      </button>

      <textarea
        className="flex-1 resize-none rounded border border-transparent bg-muted/40 px-2 py-1.5 text-xs leading-relaxed outline-none focus:border-border focus:bg-background min-h-[2.25rem]"
        value={value}
        rows={1}
        onChange={e => setValue(e.target.value)}
        onBlur={() => {
          if (value !== beat.text) onUpdate(value)
        }}
      />

      <button
        onClick={onDelete}
        className="mt-1.5 shrink-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
        aria-label="Delete beat"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

interface BeatEditorProps {
  beats: Beat[]
  onChange: (beats: Beat[]) => void
}

export function BeatEditor({ beats, onChange }: BeatEditorProps) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = beats.findIndex(b => b.id === active.id)
    const newIndex = beats.findIndex(b => b.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return
    const reordered = arrayMove(beats, oldIndex, newIndex).map((b, i) => ({ ...b, order: i }))
    onChange(reordered)
  }

  function addBeat() {
    const newBeat: Beat = {
      id: crypto.randomUUID(),
      text: '',
      order: beats.length,
    }
    onChange([...beats, newBeat])
  }

  function updateBeat(id: string, text: string) {
    onChange(beats.map(b => (b.id === id ? { ...b, text } : b)))
  }

  function deleteBeat(id: string) {
    onChange(beats.filter(b => b.id !== id).map((b, i) => ({ ...b, order: i })))
  }

  return (
    <div className="space-y-1.5">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={beats.map(b => b.id)} strategy={verticalListSortingStrategy}>
          {beats.map(beat => (
            <BeatRow
              key={beat.id}
              beat={beat}
              onUpdate={text => updateBeat(beat.id, text)}
              onDelete={() => deleteBeat(beat.id)}
            />
          ))}
        </SortableContext>
      </DndContext>

      <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs w-full justify-start" onClick={addBeat}>
        <Plus className="h-3.5 w-3.5" />
        Add beat
      </Button>
    </div>
  )
}
