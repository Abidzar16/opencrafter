import { useState } from 'react'
import { Plus, Trash2, Tag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useLabels, useCreateLabel, useUpdateLabel, useDeleteLabel } from '@/lib/db/hooks'
import { cn } from '@/lib/utils'
import type { Label } from '@/types'

const PRESET_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899',
  '#6b7280', '#1f2937',
]

interface ManageLabelsDialogProps {
  novelId: string
  open: boolean
  onClose: () => void
}

function ManageLabelsDialog({ novelId, open, onClose }: ManageLabelsDialogProps) {
  const labels = useLabels(novelId) ?? []
  const createLabel = useCreateLabel()
  const updateLabel = useUpdateLabel()
  const deleteLabel = useDeleteLabel()

  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState(PRESET_COLORS[0])

  async function handleCreate() {
    if (!newName.trim()) return
    await createLabel({ novelId, name: newName.trim(), color: newColor })
    setNewName('')
    setNewColor(PRESET_COLORS[0])
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Manage Labels</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {/* Existing labels */}
          {labels.length > 0 && (
            <ul className="space-y-1.5">
              {labels.map(label => (
                <LabelRow key={label.id} label={label} onUpdate={updateLabel} onDelete={deleteLabel} />
              ))}
            </ul>
          )}

          {/* New label form */}
          <div className="flex items-center gap-2 pt-1">
            <Input
              placeholder="Label name"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              className="h-8 text-sm flex-1"
            />
            <ColorPicker value={newColor} onChange={setNewColor} />
            <Button size="sm" className="h-8 px-3" onClick={handleCreate} disabled={!newName.trim()}>
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

interface LabelRowProps {
  label: Label
  onUpdate: (id: string, data: Partial<Label>) => void
  onDelete: (id: string) => void
}

function LabelRow({ label, onUpdate, onDelete }: LabelRowProps) {
  const [name, setName] = useState(label.name)
  const [color, setColor] = useState(label.color)

  function handleBlur() {
    const trimmed = name.trim()
    if (!trimmed) {
      setName(label.name)
      return
    }
    if (trimmed !== label.name || color !== label.color) {
      onUpdate(label.id, { name: trimmed, color })
    }
  }

  return (
    <li className="flex items-center gap-2">
      <ColorPicker value={color} onChange={v => { setColor(v); onUpdate(label.id, { color: v }) }} />
      <Input
        value={name}
        onChange={e => setName(e.target.value)}
        onBlur={handleBlur}
        className="h-7 text-xs flex-1"
      />
      <button
        onClick={() => onDelete(label.id)}
        className="shrink-0 text-muted-foreground hover:text-destructive"
        aria-label="Delete label"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </li>
  )
}

interface ColorPickerProps {
  value: string
  onChange: (color: string) => void
}

function ColorPicker({ value, onChange }: ColorPickerProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button
        className="h-6 w-6 rounded-full border border-border shadow-sm shrink-0"
        style={{ background: value }}
        onClick={() => setOpen(v => !v)}
        aria-label="Pick color"
      />
      {open && (
        <div className="absolute left-0 top-8 z-50 grid grid-cols-5 gap-1 rounded-md border border-border bg-popover p-2 shadow-md">
          {PRESET_COLORS.map(c => (
            <button
              key={c}
              className={cn(
                'h-5 w-5 rounded-full border-2 transition-transform hover:scale-110',
                c === value ? 'border-foreground' : 'border-transparent',
              )}
              style={{ background: c }}
              onClick={() => { onChange(c); setOpen(false) }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

interface LabelSelectorProps {
  novelId: string
  selectedIds: string[]
  onChange: (ids: string[]) => void
}

export function LabelSelector({ novelId, selectedIds, onChange }: LabelSelectorProps) {
  const labels = useLabels(novelId) ?? []
  const [manageOpen, setManageOpen] = useState(false)

  function toggle(id: string) {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter(x => x !== id))
    } else {
      onChange([...selectedIds, id])
    }
  }

  return (
    <div className="space-y-2">
      {labels.length === 0 ? (
        <p className="text-xs text-muted-foreground italic">No labels yet.</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {labels.map(label => {
            const selected = selectedIds.includes(label.id)
            return (
              <button
                key={label.id}
                onClick={() => toggle(label.id)}
                className={cn(
                  'flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition-all',
                  selected
                    ? 'border-transparent text-white'
                    : 'border-border text-muted-foreground hover:border-foreground/30',
                )}
                style={selected ? { background: label.color, borderColor: label.color } : {}}
              >
                <span
                  className="h-2 w-2 rounded-full shrink-0"
                  style={{ background: label.color }}
                />
                {label.name}
              </button>
            )
          })}
        </div>
      )}

      <Button
        variant="ghost"
        size="sm"
        className="h-6 gap-1 text-xs text-muted-foreground"
        onClick={() => setManageOpen(true)}
      >
        <Tag className="h-3 w-3" />
        Manage labels
      </Button>

      <ManageLabelsDialog
        novelId={novelId}
        open={manageOpen}
        onClose={() => setManageOpen(false)}
      />
    </div>
  )
}
