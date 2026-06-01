import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useCreateCodexEntry } from '@/lib/db/hooks'
import { useScene, useUpdateScene } from '@/lib/db/hooks'
import { CodexType, AiContextMode } from '@/types'

const TYPE_LABELS: Record<CodexType, string> = {
  [CodexType.Character]: 'Character',
  [CodexType.Location]: 'Location',
  [CodexType.Object]: 'Object / Item',
  [CodexType.Lore]: 'Lore',
  [CodexType.Subplot]: 'Subplot',
  [CodexType.Other]: 'Other',
}

interface QuickCreateCodexDialogProps {
  open: boolean
  novelId: string
  sceneId: string | null
  onClose: () => void
  onCreated?: (id: string) => void
}

export function QuickCreateCodexDialog({
  open,
  novelId,
  sceneId,
  onClose,
  onCreated,
}: QuickCreateCodexDialogProps) {
  const [name, setName] = useState('')
  const [type, setType] = useState<CodexType>(CodexType.Character)
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const createEntry = useCreateCodexEntry()
  const updateScene = useUpdateScene()
  const scene = useScene(sceneId ?? undefined)

  const handleClose = () => {
    setName('')
    setType(CodexType.Character)
    setDescription('')
    onClose()
  }

  const handleCreate = async () => {
    if (!name.trim()) return
    setSubmitting(true)
    try {
      const id = await createEntry({
        novelId,
        type,
        name: name.trim(),
        aliases: [],
        description: description.trim()
          ? { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: description.trim() }] }] }
          : {},
        notes: {},
        details: [],
        tags: [],
        trackingSettings: { enabled: true, caseSensitive: false, exclusions: [] },
        aiContextMode: AiContextMode.IncludeWhenDetected,
        mentionCount: 0,
      })

      // Auto-wire to current scene's associations
      if (sceneId && scene) {
        const existing = scene.codexAssociations ?? []
        if (!existing.includes(id)) {
          await updateScene(sceneId, { codexAssociations: [...existing, id] })
        }
      }

      onCreated?.(id)
      handleClose()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && handleClose()}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="text-base">New Codex Entry</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="space-y-1">
            <label className="text-xs font-medium">Name</label>
            <Input
              autoFocus
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              placeholder="Entry name"
              className="h-8"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium">Type</label>
            <Select value={type} onValueChange={v => setType(v as CodexType)}>
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.values(CodexType).map(t => (
                  <SelectItem key={t} value={t}>
                    {TYPE_LABELS[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium">Description <span className="text-muted-foreground font-normal">(optional)</span></label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Brief description…"
              rows={3}
              className="border-input bg-background placeholder:text-muted-foreground focus-visible:ring-ring w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-1 focus-visible:outline-none resize-none"
            />
          </div>

          {sceneId && (
            <p className="text-muted-foreground text-xs">
              This entry will be associated with the current scene.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={handleClose}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleCreate} disabled={!name.trim() || submitting}>
            Create Entry
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
