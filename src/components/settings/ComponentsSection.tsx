import { useState } from 'react'
import { Plus, Pencil, Trash2, Lock } from 'lucide-react'
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
  usePromptComponents,
  useCreatePromptComponent,
  useUpdatePromptComponent,
  useDeletePromptComponent,
} from '@/lib/db/hooks'
import type { PromptComponent } from '@/types'

interface ComponentDialogProps {
  open: boolean
  component: PromptComponent | null
  onSave: (data: Omit<PromptComponent, 'id'>) => void
  onClose: () => void
}

function ComponentDialog({ open, component, onSave, onClose }: ComponentDialogProps) {
  const [name, setName] = useState(component?.name ?? '')
  const [content, setContent] = useState(component?.content ?? '')

  function handleOpen(isOpen: boolean) {
    if (isOpen) {
      setName(component?.name ?? '')
      setContent(component?.content ?? '')
    }
  }

  return (
    <Dialog open={open} onOpenChange={v => { handleOpen(v); if (!v) onClose() }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{component ? 'Edit Component' : 'New Component'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="comp-name">Name</Label>
            <Input
              id="comp-name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Writing Style Guide"
            />
            <p className="text-xs text-muted-foreground">
              Inserted as{' '}
              <code className="bg-muted px-1 rounded">{`{{component:${name || 'Name'}}}`}</code>
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="comp-content">Content</Label>
            <Textarea
              id="comp-content"
              value={content}
              onChange={e => setContent(e.target.value)}
              rows={8}
              className="text-sm resize-none"
              placeholder="Component text that will be injected into the prompt…"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={() => { onSave({ name, content, readOnly: false }); onClose() }}
            disabled={!name.trim() || !content.trim()}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function ComponentsSection() {
  const components = usePromptComponents() ?? []
  const createComponent = useCreatePromptComponent()
  const updateComponent = useUpdatePromptComponent()
  const deleteComponent = useDeletePromptComponent()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<PromptComponent | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  async function handleSave(data: Omit<PromptComponent, 'id'>) {
    if (editing) {
      await updateComponent(editing.id, data)
      toast.success('Component updated')
    } else {
      await createComponent(data)
      toast.success('Component created')
    }
    setEditing(null)
  }

  function openEdit(c: PromptComponent) {
    setEditing(c)
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
          <h3 className="font-semibold text-sm">Prompt Components</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Reusable text blocks inserted into prompts via{' '}
            <code className="bg-muted px-1 rounded">{'{{component:Name}}'}</code>
          </p>
        </div>
        <Button size="sm" onClick={openNew}>
          <Plus className="mr-2 h-4 w-4" />
          New Component
        </Button>
      </div>

      {components.length === 0 ? (
        <div className="text-center py-10 text-sm text-muted-foreground border rounded-md">
          No components yet. Create one to reuse text across prompts.
        </div>
      ) : (
        <div className="border rounded-md divide-y">
          {components.map(c => (
            <div key={c.id} className="flex items-start gap-3 px-4 py-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{c.name}</span>
                  {c.readOnly && (
                    <Badge variant="outline" className="text-xs gap-1">
                      <Lock className="h-3 w-3" />
                      Built-in
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{c.content}</p>
              </div>
              {!c.readOnly && (
                <div className="flex gap-1 shrink-0">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(c)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => setDeleteId(c.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <ComponentDialog
        open={dialogOpen}
        component={editing}
        onSave={handleSave}
        onClose={() => { setDialogOpen(false); setEditing(null) }}
      />

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={v => !v && setDeleteId(null)}
        title="Delete component?"
        description="Prompts using this component will show a placeholder instead of the content."
        confirmLabel="Delete"
        destructive
        onConfirm={async () => {
          if (deleteId) { await deleteComponent(deleteId); toast.success('Component deleted') }
          setDeleteId(null)
        }}
      />
    </div>
  )
}
