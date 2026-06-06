import { useState, useMemo } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useCodexEntries, useCreateCodexProgression } from '@/lib/db/hooks'
import type { CodexProgressionMode } from '@/types'
import { toast } from '@/components/ui/toast-provider'

interface ProgressionPickerProps {
  open: boolean
  novelId: string
  sceneId: string
  onClose: () => void
}

export function ProgressionPicker({
  open,
  novelId,
  sceneId,
  onClose,
}: ProgressionPickerProps) {
  const entries = useCodexEntries(novelId)
  const createProgression = useCreateCodexProgression()

  const [entryId, setEntryId] = useState('')
  const [mode, setMode] = useState<CodexProgressionMode>('addition')
  const [content, setContent] = useState('')
  const [detailKey, setDetailKey] = useState('')
  const [search, setSearch] = useState('')

  const filteredEntries = useMemo(() => {
    const q = search.toLowerCase()
    return (entries ?? []).filter(e => !q || e.name.toLowerCase().includes(q))
  }, [entries, search])

  const selectedEntry = useMemo(
    () => (entries ?? []).find(e => e.id === entryId),
    [entries, entryId],
  )

  const handleCreate = async () => {
    if (!entryId || !content.trim()) return
    await createProgression({
      entryId,
      sceneId,
      novelId,
      mode,
      content: content.trim(),
      detailKey: detailKey.trim() || undefined,
    })
    toast('Progression created', { description: selectedEntry?.name })
    setEntryId('')
    setContent('')
    setDetailKey('')
    setMode('addition')
    onClose()
  }

  const handleOpenChange = (v: boolean) => {
    if (!v) onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Codex Progression</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-1">
          {/* Entry picker */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium">Codex entry</label>
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search entries…"
              className="h-8"
            />
            <Select value={entryId} onValueChange={setEntryId}>
              <SelectTrigger className="h-8">
                <SelectValue placeholder="Select entry…" />
              </SelectTrigger>
              <SelectContent className="max-h-52">
                {filteredEntries.map(e => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.name}
                  </SelectItem>
                ))}
                {filteredEntries.length === 0 && (
                  <div className="text-muted-foreground px-2 py-2 text-xs">No entries found</div>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Mode */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium">Mode</label>
            <Select value={mode} onValueChange={v => setMode(v as CodexProgressionMode)}>
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="addition">Addition — append to description</SelectItem>
                <SelectItem value="replacement">Replacement — override description</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Optional detail key */}
          {selectedEntry && selectedEntry.details.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium">
                Linked detail <span className="text-muted-foreground">(optional)</span>
              </label>
              <Select value={detailKey} onValueChange={setDetailKey}>
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {selectedEntry.details.map(d => (
                    <SelectItem key={d.id} value={d.key}>
                      {d.key}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Content */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium">What changed?</label>
            <Textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder={
                mode === 'replacement'
                  ? 'New description that replaces the old one at this scene…'
                  : 'Something new we learn about this entry at this scene…'
              }
              rows={3}
              className="resize-none text-sm"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={!entryId || !content.trim()}>
            Create Progression
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
