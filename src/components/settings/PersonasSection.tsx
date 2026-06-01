import { useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import {
  usePromptPersonas,
  useCreatePromptPersona,
  useUpdatePromptPersona,
  useDeletePromptPersona,
} from '@/lib/db/hooks'
import type { PromptPersona } from '@/types'

interface PersonaDialogProps {
  open: boolean
  persona: PromptPersona | null
  onSave: (data: Omit<PromptPersona, 'id'>) => void
  onClose: () => void
}

function PersonaDialog({ open, persona, onSave, onClose }: PersonaDialogProps) {
  const [name, setName] = useState(persona?.name ?? '')
  const [instructions, setInstructions] = useState(persona?.instructions ?? '')

  function handleOpen(isOpen: boolean) {
    if (isOpen) {
      setName(persona?.name ?? '')
      setInstructions(persona?.instructions ?? '')
    }
  }

  return (
    <Dialog open={open} onOpenChange={v => { handleOpen(v); if (!v) onClose() }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{persona ? 'Edit Persona' : 'New Persona'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="persona-name">Name</Label>
            <Input
              id="persona-name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Dark Fantasy Editor"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="persona-instructions">Instructions</Label>
            <Textarea
              id="persona-instructions"
              value={instructions}
              onChange={e => setInstructions(e.target.value)}
              rows={8}
              className="text-sm resize-none"
              placeholder="Prepended to every system prompt when this persona is active. e.g. 'You are a dark fantasy fiction editor with a preference for lyrical, evocative prose…'"
            />
            <p className="text-xs text-muted-foreground">
              This text is prepended to all system prompts when this persona is assigned to a novel.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={() => {
              onSave({ name, instructions, scope: 'account' })
              onClose()
            }}
            disabled={!name.trim() || !instructions.trim()}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function PersonasSection() {
  const personas = usePromptPersonas() ?? []
  const createPersona = useCreatePromptPersona()
  const updatePersona = useUpdatePromptPersona()
  const deletePersona = useDeletePromptPersona()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<PromptPersona | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  async function handleSave(data: Omit<PromptPersona, 'id'>) {
    if (editing) {
      await updatePersona(editing.id, data)
      toast.success('Persona updated')
    } else {
      await createPersona(data)
      toast.success('Persona created')
    }
    setEditing(null)
  }

  function openEdit(p: PromptPersona) {
    setEditing(p)
    setDialogOpen(true)
  }

  function openNew() {
    setEditing(null)
    setDialogOpen(true)
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-sm">AI Personas</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Personas are prepended to every system prompt for the novel they&apos;re assigned to.
            Assign a persona in Novel Settings.
          </p>
        </div>
        <Button size="sm" onClick={openNew}>
          <Plus className="mr-2 h-4 w-4" />
          New Persona
        </Button>
      </div>

      {personas.length === 0 ? (
        <div className="text-center py-10 text-sm text-muted-foreground border rounded-md">
          No personas yet. Create one to give your AI a consistent voice for a novel.
        </div>
      ) : (
        <div className="border rounded-md divide-y">
          {personas.map(p => (
            <div key={p.id} className="flex items-start gap-3 px-4 py-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{p.name}</span>
                  <Badge variant="outline" className="text-xs">{p.scope}</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{p.instructions}</p>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(p)}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => setDeleteId(p.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <PersonaDialog
        open={dialogOpen}
        persona={editing}
        onSave={handleSave}
        onClose={() => { setDialogOpen(false); setEditing(null) }}
      />

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={v => !v && setDeleteId(null)}
        title="Delete persona?"
        description="Novels assigned to this persona will fall back to no persona."
        confirmLabel="Delete"
        destructive
        onConfirm={async () => {
          if (deleteId) { await deletePersona(deleteId); toast.success('Persona deleted') }
          setDeleteId(null)
        }}
      />
    </div>
  )
}
