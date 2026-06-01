import { useState, useCallback } from 'react'
import { Plus, Copy, Trash2, Search, Download, Upload, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { Label } from '@/components/ui/label'
import {
  usePrompts,
  useCreatePrompt,
  useUpdatePrompt,
  useDeletePrompt,
  usePromptComponents,
  useCreatePromptComponent,
  useUpdatePromptComponent,
  useDeletePromptComponent,
  usePromptPersonas,
  useCreatePromptPersona,
  useUpdatePromptPersona,
  useDeletePromptPersona,
} from '@/lib/db/hooks'
import { PromptEditor } from './PromptEditor'
import { ComponentsSection } from './ComponentsSection'
import { PersonasSection } from './PersonasSection'
import type { Prompt } from '@/types'
import { PromptType } from '@/types'

const PROMPT_TYPE_LABELS: Record<PromptType, string> = {
  [PromptType.BeatCompletion]: 'Beat Completion',
  [PromptType.Summarization]: 'Summarization',
  [PromptType.TextReplacement]: 'Text Replacement',
  [PromptType.WorkshopChat]: 'Workshop Chat',
}

const PROMPT_TYPE_COLORS: Record<PromptType, string> = {
  [PromptType.BeatCompletion]: 'bg-violet-500/15 text-violet-700 dark:text-violet-300',
  [PromptType.Summarization]: 'bg-blue-500/15 text-blue-700 dark:text-blue-300',
  [PromptType.TextReplacement]: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
  [PromptType.WorkshopChat]: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
}

const TYPE_FILTER_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'all', label: 'All' },
  { value: PromptType.BeatCompletion, label: 'Beat' },
  { value: PromptType.Summarization, label: 'Summary' },
  { value: PromptType.TextReplacement, label: 'Replacement' },
  { value: PromptType.WorkshopChat, label: 'Chat' },
]

// ─── Create Prompt Dialog ─────────────────────────────────────────────────────

interface CreatePromptDialogProps {
  open: boolean
  onClose: () => void
  onCreate: (type: PromptType) => void
}

function CreatePromptDialog({ open, onClose, onCreate }: CreatePromptDialogProps) {
  const [type, setType] = useState<PromptType>(PromptType.BeatCompletion)

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>New Prompt</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1.5">
            <Label>Prompt type</Label>
            <Select value={type} onValueChange={v => setType(v as PromptType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PROMPT_TYPE_LABELS).map(([v, label]) => (
                  <SelectItem key={v} value={v}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => { onCreate(type); onClose() }}>Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Prompt List ──────────────────────────────────────────────────────────────

function PromptList({
  prompts,
  selectedId,
  onSelect,
  onDuplicate,
  onDelete,
}: {
  prompts: Prompt[]
  selectedId: string | null
  onSelect: (id: string) => void
  onDuplicate: (p: Prompt) => void
  onDelete: (id: string) => void
}) {
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const grouped = Object.values(PromptType).reduce<Record<PromptType, Prompt[]>>(
    (acc, t) => {
      acc[t] = prompts.filter(p => p.type === t)
      return acc
    },
    {} as Record<PromptType, Prompt[]>,
  )

  return (
    <>
      <div className="flex-1 overflow-y-auto">
        {Object.entries(grouped).map(([type, items]) => {
          if (items.length === 0) return null
          return (
            <div key={type}>
              <div className="px-3 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide bg-muted/50 border-b">
                {PROMPT_TYPE_LABELS[type as PromptType]}
              </div>
              {items.map(p => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onSelect(p.id)}
                  className={[
                    'w-full text-left px-3 py-2.5 border-b last:border-b-0 hover:bg-accent transition-colors',
                    selectedId === p.id ? 'bg-accent' : '',
                  ].join(' ')}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="flex-1 text-sm font-medium truncate">{p.name}</span>
                    {p.readOnly && (
                      <Lock className="h-3 w-3 text-muted-foreground shrink-0" />
                    )}
                  </div>
                  {p.description && (
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{p.description}</p>
                  )}
                  <div className="flex gap-1 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    {/* Actions shown in right-click / keyboard accessible via detail panel */}
                  </div>
                </button>
              ))}
            </div>
          )
        })}
      </div>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={v => !v && setDeleteId(null)}
        title="Delete prompt?"
        description="This will permanently remove the prompt. This cannot be undone."
        confirmLabel="Delete"
        destructive
        onConfirm={() => { if (deleteId) onDelete(deleteId); setDeleteId(null) }}
      />
    </>
  )
}

// ─── Prompts Panel (two-panel layout) ────────────────────────────────────────

function PromptsPanel() {
  const allPrompts = usePrompts() ?? []
  const createPrompt = useCreatePrompt()
  const updatePrompt = useUpdatePrompt()
  const deletePrompt = useDeletePrompt()

  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const filtered = allPrompts.filter(p => {
    const matchesSearch =
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.description ?? '').toLowerCase().includes(search.toLowerCase())
    const matchesType = typeFilter === 'all' || p.type === typeFilter
    return matchesSearch && matchesType
  })

  const selectedPrompt = allPrompts.find(p => p.id === selectedId) ?? null

  async function handleCreate(type: PromptType) {
    const id = await createPrompt({
      name: 'New Prompt',
      type,
      description: '',
      instructions: '',
      contextConfig: [
        { blockType: 'codex', enabled: true, order: 0 },
        { blockType: 'scene_summary', enabled: true, order: 1 },
        { blockType: 'beats', enabled: true, order: 2 },
        { blockType: 'scene_content', enabled: false, order: 3 },
        { blockType: 'prior_text', enabled: false, order: 4 },
        { blockType: 'snippets', enabled: false, order: 5 },
      ],
      inputs: [],
      modelSettings: {},
      readOnly: false,
    })
    setSelectedId(id)
  }

  async function handleDuplicate(p: Prompt) {
    const id = await createPrompt({
      ...p,
      name: `${p.name} (copy)`,
      readOnly: false,
    })
    setSelectedId(id)
    toast.success('Prompt duplicated')
  }

  async function handleDelete(id: string) {
    if (selectedId === id) setSelectedId(null)
    await deletePrompt(id)
    toast.success('Prompt deleted')
  }

  const handleChange = useCallback(
    async (updates: Partial<Prompt>) => {
      if (!selectedId) return
      await updatePrompt(selectedId, updates)
    },
    [selectedId, updatePrompt],
  )

  function handleExport(p: Prompt) {
    const json = JSON.stringify(p, null, 2)
    navigator.clipboard.writeText(json)
    toast.success('Prompt copied to clipboard as JSON')
  }

  async function handleImport() {
    try {
      const text = await navigator.clipboard.readText()
      const data = JSON.parse(text) as Partial<Prompt>
      if (!data.name || !data.type || !data.instructions) {
        toast.error('Invalid prompt JSON')
        return
      }
      const id = await createPrompt({
        name: data.name,
        type: data.type,
        description: data.description,
        instructions: data.instructions ?? '',
        contextConfig: data.contextConfig ?? [],
        inputs: data.inputs ?? [],
        modelSettings: data.modelSettings ?? {},
        readOnly: false,
      })
      setSelectedId(id)
      toast.success('Prompt imported')
    } catch {
      toast.error('Could not read clipboard or parse JSON')
    }
  }

  return (
    <div className="flex h-full min-h-0">
      {/* Left: Prompt List */}
      <div className="w-64 shrink-0 flex flex-col border-r">
        {/* Search + filter */}
        <div className="p-2 space-y-2 border-b">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search…"
              className="pl-7 h-8 text-sm"
            />
          </div>
          <div className="flex gap-1 flex-wrap">
            {TYPE_FILTER_OPTIONS.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setTypeFilter(opt.value)}
                className={[
                  'px-2 py-0.5 rounded-full text-xs border transition-colors',
                  typeFilter === opt.value
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-border hover:border-primary/50',
                ].join(' ')}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground px-3">
              {allPrompts.length === 0 ? 'No prompts yet.' : 'No results.'}
            </div>
          ) : (
            <PromptList
              prompts={filtered}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onDuplicate={handleDuplicate}
              onDelete={id => setDeleteId(id)}
            />
          )}
        </div>

        {/* Footer actions */}
        <div className="p-2 border-t flex gap-1">
          <Button variant="default" size="sm" className="flex-1 h-8" onClick={() => setCreateOpen(true)}>
            <Plus className="mr-1 h-3.5 w-3.5" />
            New
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleImport} title="Import from clipboard">
            <Upload className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Right: Editor */}
      <div className="flex-1 min-w-0 flex flex-col">
        {selectedPrompt ? (
          <>
            {/* Toolbar */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b shrink-0">
              <div className="flex items-center gap-2">
                <span
                  className={[
                    'text-xs px-2 py-0.5 rounded-full font-medium',
                    PROMPT_TYPE_COLORS[selectedPrompt.type],
                  ].join(' ')}
                >
                  {PROMPT_TYPE_LABELS[selectedPrompt.type]}
                </span>
                {selectedPrompt.readOnly && (
                  <Badge variant="outline" className="text-xs gap-1">
                    <Lock className="h-3 w-3" />
                    Built-in
                  </Badge>
                )}
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => handleExport(selectedPrompt)}
                >
                  <Download className="mr-1 h-3.5 w-3.5" />
                  Export
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => handleDuplicate(selectedPrompt)}
                >
                  <Copy className="mr-1 h-3.5 w-3.5" />
                  Duplicate
                </Button>
                {!selectedPrompt.readOnly && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-destructive hover:text-destructive"
                    onClick={() => setDeleteId(selectedPrompt.id)}
                  >
                    <Trash2 className="mr-1 h-3.5 w-3.5" />
                    Delete
                  </Button>
                )}
              </div>
            </div>

            <PromptEditor prompt={selectedPrompt} onChange={handleChange} />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <EmptyState
              icon={<Search className="h-8 w-8" />}
              title="No prompt selected"
              description="Select a prompt from the list, or create a new one."
            />
          </div>
        )}
      </div>

      <CreatePromptDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreate={handleCreate}
      />

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={v => !v && setDeleteId(null)}
        title="Delete prompt?"
        description="This will permanently remove the prompt and cannot be undone."
        confirmLabel="Delete"
        destructive
        onConfirm={() => { if (deleteId) handleDelete(deleteId); setDeleteId(null) }}
      />
    </div>
  )
}

// ─── Main PromptLibraryTab ────────────────────────────────────────────────────

export function PromptLibraryTab() {
  return (
    <Tabs defaultValue="prompts" className="flex flex-col h-full">
      <TabsList className="shrink-0 justify-start border-b rounded-none px-4 h-10 bg-transparent">
        <TabsTrigger value="prompts" className="text-sm">Prompts</TabsTrigger>
        <TabsTrigger value="components" className="text-sm">Components</TabsTrigger>
        <TabsTrigger value="personas" className="text-sm">Personas</TabsTrigger>
      </TabsList>

      <div className="flex-1 min-h-0 overflow-hidden">
        <TabsContent value="prompts" className="h-full mt-0">
          <PromptsPanel />
        </TabsContent>
        <TabsContent value="components" className="h-full mt-0 overflow-y-auto">
          <ComponentsSection />
        </TabsContent>
        <TabsContent value="personas" className="h-full mt-0 overflow-y-auto">
          <PersonasSection />
        </TabsContent>
      </div>
    </Tabs>
  )
}
