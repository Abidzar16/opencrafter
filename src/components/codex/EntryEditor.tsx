import { useState, useEffect, useCallback } from 'react'
import {
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Copy,
  X,
  GripVertical,
  AlertTriangle,
} from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { ImageUpload } from '@/components/ui/image-upload'
import { RevisionHistoryModal } from '@/components/ui/revision-history-modal'
import { ProseEditor } from '@/components/editor/ProseEditor'
import {
  useCodexEntry,
  useCreateCodexEntry,
  useUpdateCodexEntry,
  useDeleteCodexEntry,
  useCodexRelations,
  useCodexProgressions,
  useCreateCodexRelation,
  useDeleteCodexRelation,
  useDeleteCodexProgression,
  useUpdateCodexProgression,
  useCodexEntries,
} from '@/lib/db/hooks'
import { useRevision } from '@/lib/hooks/use-revision'
import { useDebouncedSave } from '@/lib/hooks/use-debounced-save'
import { CodexType, AiContextMode, RevisionEntityType } from '@/types'
import type { CodexDetail, CodexEntry } from '@/types'
import { cn } from '@/lib/utils'

const TYPE_LABELS: Record<CodexType, string> = {
  [CodexType.Character]: 'Character',
  [CodexType.Location]: 'Location',
  [CodexType.Object]: 'Object / Item',
  [CodexType.Lore]: 'Lore',
  [CodexType.Subplot]: 'Subplot',
  [CodexType.Other]: 'Other',
}

const AI_MODE_LABELS: Record<AiContextMode, string> = {
  [AiContextMode.AlwaysInclude]: 'Always include',
  [AiContextMode.IncludeWhenDetected]: 'Include when detected',
  [AiContextMode.NotWhenDetected]: "Don't include when detected",
  [AiContextMode.NeverInclude]: 'Never include',
}

interface EntryEditorProps {
  open: boolean
  novelId: string
  entryId?: string
  defaultType?: CodexType
  onClose: () => void
  onCreated?: (id: string) => void
}

export function EntryEditor({
  open,
  novelId,
  entryId,
  defaultType = CodexType.Character,
  onClose,
  onCreated,
}: EntryEditorProps) {
  const isNew = !entryId
  const entry = useCodexEntry(entryId)
  const createEntry = useCreateCodexEntry()
  const updateEntry = useUpdateCodexEntry()
  const deleteEntry = useDeleteCodexEntry()

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [revHistoryField, setRevHistoryField] = useState<'description' | 'notes' | null>(null)

  // Local form state
  const [name, setName] = useState('')
  const [type, setType] = useState<CodexType>(defaultType)
  const [aliasInput, setAliasInput] = useState('')
  const [aliases, setAliases] = useState<string[]>([])
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [category, setCategory] = useState('')
  const [coverImage, setCoverImage] = useState<string | undefined>()
  const [description, setDescription] = useState<Record<string, unknown>>({})
  const [notes, setNotes] = useState<Record<string, unknown>>({})
  const [details, setDetails] = useState<CodexDetail[]>([])

  // Revision tracking
  const saveDescRevision = useRevision(RevisionEntityType.CodexDescription, entryId ?? '')
  const saveNotesRevision = useRevision(RevisionEntityType.CodexNotes, entryId ?? '')

  // Sync entry → local state
  useEffect(() => {
    if (!entry) return
    setName(entry.name)
    setType(entry.type)
    setAliases(entry.aliases)
    setTags(entry.tags)
    setCategory(entry.category ?? '')
    setCoverImage(entry.coverImage)
    setDescription(entry.description)
    setNotes(entry.notes)
    setDetails(entry.details)
  }, [entry])

  // Reset when opening new entry
  useEffect(() => {
    if (open && isNew) {
      setName('')
      setType(defaultType)
      setAliases([])
      setTags([])
      setTagInput('')
      setAliasInput('')
      setCategory('')
      setCoverImage(undefined)
      setDescription({})
      setNotes({})
      setDetails([])
    }
  }, [open, isNew, defaultType])

  const persist = useCallback(
    async (patch: Partial<Omit<CodexEntry, 'id' | 'createdAt' | 'updatedAt'>>) => {
      if (isNew) return
      if (!entryId) return
      await updateEntry(entryId, patch)
    },
    [isNew, entryId, updateEntry],
  )

  const handleNameBlur = () => persist({ name })
  const handleTypeChange = (v: CodexType) => {
    setType(v)
    persist({ type: v })
  }
  const handleCategoryBlur = () => persist({ category: category || undefined })
  const handleCoverImage = (img: string | undefined) => {
    setCoverImage(img)
    persist({ coverImage: img })
  }

  // Description / notes — debounced + revision snapshot
  const doSaveDescription = useCallback(async () => {
    if (!entryId) return
    const stored = await import('@/lib/db/db').then(m => m.default.codex_entries.get(entryId))
    if (stored?.description && Object.keys(stored.description).length > 0) {
      await saveDescRevision(JSON.stringify(stored.description))
    }
    await persist({ description })
  }, [entryId, description, persist, saveDescRevision])
  const triggerSaveDesc = useDebouncedSave(doSaveDescription, 800)
  const handleDescriptionChange = (content: Record<string, unknown>) => {
    setDescription(content)
    triggerSaveDesc()
  }

  const doSaveNotes = useCallback(async () => {
    if (!entryId) return
    const stored = await import('@/lib/db/db').then(m => m.default.codex_entries.get(entryId))
    if (stored?.notes && Object.keys(stored.notes).length > 0) {
      await saveNotesRevision(JSON.stringify(stored.notes))
    }
    await persist({ notes })
  }, [entryId, notes, persist, saveNotesRevision])
  const triggerSaveNotes = useDebouncedSave(doSaveNotes, 800)
  const handleNotesChange = (content: Record<string, unknown>) => {
    setNotes(content)
    triggerSaveNotes()
  }

  // Alias chips
  const addAlias = () => {
    const v = aliasInput.trim()
    if (!v || aliases.includes(v)) return
    const next = [...aliases, v]
    setAliases(next)
    setAliasInput('')
    persist({ aliases: next })
  }
  const removeAlias = (a: string) => {
    const next = aliases.filter(x => x !== a)
    setAliases(next)
    persist({ aliases: next })
  }

  // Tag chips
  const addTag = () => {
    const v = tagInput.trim()
    if (!v || tags.includes(v)) return
    const next = [...tags, v]
    setTags(next)
    setTagInput('')
    persist({ tags: next })
  }
  const removeTag = (t: string) => {
    const next = tags.filter(x => x !== t)
    setTags(next)
    persist({ tags: next })
  }

  // Details (key/value list)
  const addDetail = () => {
    const next: CodexDetail[] = [
      ...details,
      { id: crypto.randomUUID(), key: '', value: '', order: details.length },
    ]
    setDetails(next)
    persist({ details: next })
  }
  const updateDetail = (id: string, patch: Partial<CodexDetail>) => {
    const next = details.map(d => (d.id === id ? { ...d, ...patch } : d))
    setDetails(next)
    persist({ details: next })
  }
  const removeDetail = (id: string) => {
    const next = details.filter(d => d.id !== id).map((d, i) => ({ ...d, order: i }))
    setDetails(next)
    persist({ details: next })
  }
  const moveDetail = (id: string, dir: 'up' | 'down') => {
    const idx = details.findIndex(d => d.id === id)
    if (idx < 0) return
    const next = [...details]
    const swapIdx = dir === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= next.length) return
    ;[next[idx], next[swapIdx]] = [next[swapIdx], next[idx]]
    const reordered = next.map((d, i) => ({ ...d, order: i }))
    setDetails(reordered)
    persist({ details: reordered })
  }

  // Create
  const handleCreate = async () => {
    if (!name.trim()) return
    const id = await createEntry({
      novelId,
      type,
      name: name.trim(),
      aliases,
      description,
      notes,
      details,
      tags,
      category: category || undefined,
      coverImage,
      trackingSettings: { enabled: true, caseSensitive: false, exclusions: [] },
      aiContextMode: AiContextMode.IncludeWhenDetected,
      mentionCount: 0,
    })
    onCreated?.(id)
  }

  // Delete
  const handleDelete = async () => {
    if (!entryId) return
    await deleteEntry(entryId)
    onClose()
  }

  // Duplicate
  const handleDuplicate = async () => {
    if (!entry) return
    const id = await createEntry({
      ...entry,
      name: `${entry.name} (copy)`,
      mentionCount: 0,
    })
    onCreated?.(id)
  }

  return (
    <>
      <Sheet open={open} onOpenChange={v => !v && onClose()}>
        <SheetContent
          side="right"
          className="flex w-[520px] max-w-full flex-col gap-0 p-0 sm:max-w-[520px]"
        >
          <SheetHeader className="flex-row items-center gap-2 border-b px-4 py-3">
            <SheetTitle className="flex-1 text-base">
              {isNew ? 'New Codex Entry' : (entry?.name ?? '…')}
            </SheetTitle>
            {!isNew && (
              <div className="flex items-center gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  onClick={handleDuplicate}
                  title="Duplicate"
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-destructive hover:text-destructive h-7 w-7"
                  onClick={() => setDeleteOpen(true)}
                  title="Delete"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </SheetHeader>

          {isNew ? (
            <NewEntryForm
              name={name}
              setName={setName}
              type={type}
              setType={setType}
              onCreate={handleCreate}
              onCancel={onClose}
            />
          ) : (
            <Tabs defaultValue="general" className="flex min-h-0 flex-1 flex-col">
              <TabsList className="mx-4 mt-3 mb-1 h-8 w-auto justify-start">
                <TabsTrigger value="general" className="text-xs">General</TabsTrigger>
                <TabsTrigger value="relations" className="text-xs">Relations</TabsTrigger>
                <TabsTrigger value="tracking" className="text-xs">Tracking</TabsTrigger>
                <TabsTrigger value="progressions" className="text-xs">Progressions</TabsTrigger>
              </TabsList>

              <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
                {/* General Tab */}
                <TabsContent value="general" className="mt-3 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2 space-y-1">
                      <label className="text-xs font-medium">Name</label>
                      <Input
                        value={name}
                        onChange={e => setName(e.target.value)}
                        onBlur={handleNameBlur}
                        placeholder="Entry name"
                        className="h-8"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-medium">Type</label>
                      <Select value={type} onValueChange={v => handleTypeChange(v as CodexType)}>
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
                      <label className="text-xs font-medium">Category</label>
                      <Input
                        value={category}
                        onChange={e => setCategory(e.target.value)}
                        onBlur={handleCategoryBlur}
                        placeholder="e.g. Protagonist"
                        className="h-8"
                      />
                    </div>
                  </div>

                  {/* Aliases */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium">Aliases</label>
                    <div className="flex gap-2">
                      <Input
                        value={aliasInput}
                        onChange={e => setAliasInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && addAlias()}
                        placeholder="Add alias, press Enter"
                        className="h-8"
                      />
                      <Button size="sm" variant="outline" className="h-8" onClick={addAlias}>
                        Add
                      </Button>
                    </div>
                    {aliases.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {aliases.map(a => (
                          <Badge key={a} variant="secondary" className="gap-1 text-xs">
                            {a}
                            <button onClick={() => removeAlias(a)} className="hover:text-destructive">
                              <X className="h-2.5 w-2.5" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Tags */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium">Tags</label>
                    <div className="flex gap-2">
                      <Input
                        value={tagInput}
                        onChange={e => setTagInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && addTag()}
                        placeholder="Add tag, press Enter"
                        className="h-8"
                      />
                      <Button size="sm" variant="outline" className="h-8" onClick={addTag}>
                        Add
                      </Button>
                    </div>
                    {tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {tags.map(t => (
                          <Badge key={t} variant="outline" className="gap-1 text-xs">
                            {t}
                            <button onClick={() => removeTag(t)} className="hover:text-destructive">
                              <X className="h-2.5 w-2.5" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Cover image */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium">Cover Image</label>
                    <ImageUpload value={coverImage} onChange={handleCoverImage} />
                  </div>

                  <Separator />

                  {/* Description */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium">Description</label>
                      {entryId && (
                        <button
                          className="text-muted-foreground hover:text-foreground text-xs underline-offset-2 hover:underline"
                          onClick={() => setRevHistoryField('description')}
                        >
                          Version history
                        </button>
                      )}
                    </div>
                    <ProseEditor
                      content={description}
                      onChange={handleDescriptionChange}
                      placeholder="Describe this entry…"
                      minHeight="100px"
                    />
                  </div>

                  {/* Notes */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium">Notes</label>
                      {entryId && (
                        <button
                          className="text-muted-foreground hover:text-foreground text-xs underline-offset-2 hover:underline"
                          onClick={() => setRevHistoryField('notes')}
                        >
                          Version history
                        </button>
                      )}
                    </div>
                    <ProseEditor
                      content={notes}
                      onChange={handleNotesChange}
                      placeholder="Private notes…"
                      minHeight="80px"
                    />
                  </div>

                  <Separator />

                  {/* Details (key/value) */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium">Details</label>
                      <Button size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={addDetail}>
                        <Plus className="mr-1 h-3 w-3" />
                        Add
                      </Button>
                    </div>
                    {details.length === 0 && (
                      <p className="text-muted-foreground text-xs">No details yet.</p>
                    )}
                    <div className="space-y-1.5">
                      {details.map((d, idx) => (
                        <div key={d.id} className="flex items-center gap-1.5">
                          <GripVertical className="text-muted-foreground h-4 w-4 shrink-0" />
                          <Input
                            value={d.key}
                            onChange={e => updateDetail(d.id, { key: e.target.value })}
                            onBlur={() => persist({ details })}
                            placeholder="Key"
                            className="h-7 w-28 text-xs"
                          />
                          <Input
                            value={d.value}
                            onChange={e => updateDetail(d.id, { value: e.target.value })}
                            onBlur={() => persist({ details })}
                            placeholder="Value"
                            className="h-7 flex-1 text-xs"
                          />
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6"
                            disabled={idx === 0}
                            onClick={() => moveDetail(d.id, 'up')}
                          >
                            <ChevronUp className="h-3 w-3" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6"
                            disabled={idx === details.length - 1}
                            onClick={() => moveDetail(d.id, 'down')}
                          >
                            <ChevronDown className="h-3 w-3" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="text-destructive hover:text-destructive h-6 w-6"
                            onClick={() => removeDetail(d.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                {/* Relations Tab */}
                <TabsContent value="relations" className="mt-3">
                  {entryId && (
                    <RelationsTab entryId={entryId} novelId={novelId} />
                  )}
                </TabsContent>

                {/* Tracking Tab */}
                <TabsContent value="tracking" className="mt-3">
                  {entryId && entry && (
                    <TrackingTab entry={entry} onUpdate={patch => persist(patch)} />
                  )}
                </TabsContent>

                {/* Progressions Tab */}
                <TabsContent value="progressions" className="mt-3">
                  {entryId && <ProgressionsTab entryId={entryId} novelId={novelId} />}
                </TabsContent>
              </div>
            </Tabs>
          )}
        </SheetContent>
      </Sheet>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete codex entry"
        description="This will permanently delete the entry along with all its relations and progressions. This cannot be undone."
        confirmLabel="Delete"
        destructive
        onConfirm={handleDelete}
      />

      {/* Revision history */}
      {entryId && revHistoryField && (
        <RevisionHistoryModal
          open={!!revHistoryField}
          onOpenChange={v => !v && setRevHistoryField(null)}
          entityType={
            revHistoryField === 'notes'
              ? RevisionEntityType.CodexNotes
              : RevisionEntityType.CodexDescription
          }
          entityId={entryId}
        />
      )}
    </>
  )
}

// ─── New Entry Form ──────────────────────────────────────────────────────────

function NewEntryForm({
  name,
  setName,
  type,
  setType,
  onCreate,
  onCancel,
}: {
  name: string
  setName: (v: string) => void
  type: CodexType
  setType: (v: CodexType) => void
  onCreate: () => void
  onCancel: () => void
}) {
  return (
    <div className="flex flex-1 flex-col gap-4 px-4 py-4">
      <div className="space-y-1">
        <label className="text-xs font-medium">Name</label>
        <Input
          autoFocus
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && onCreate()}
          placeholder="Entry name"
          className="h-9"
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium">Type</label>
        <Select value={type} onValueChange={v => setType(v as CodexType)}>
          <SelectTrigger className="h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.values(CodexType).map(t => (
              <SelectItem key={t} value={t}>
                {{
                  [CodexType.Character]: 'Character',
                  [CodexType.Location]: 'Location',
                  [CodexType.Object]: 'Object / Item',
                  [CodexType.Lore]: 'Lore',
                  [CodexType.Subplot]: 'Subplot',
                  [CodexType.Other]: 'Other',
                }[t]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex gap-2 pt-2">
        <Button className="flex-1" onClick={onCreate} disabled={!name.trim()}>
          Create Entry
        </Button>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  )
}

// ─── Relations Tab ───────────────────────────────────────────────────────────

const RELATION_PRESETS = [
  'parent of', 'child of', 'ally of', 'enemy of', 'married to',
  'member of', 'owns', 'located in', 'created by', 'related to',
]

function RelationsTab({ entryId, novelId }: { entryId: string; novelId: string }) {
  const relations = useCodexRelations(entryId)
  const allEntries = useCodexEntries(novelId)
  const createRelation = useCreateCodexRelation()
  const deleteRelation = useDeleteCodexRelation()

  const [targetId, setTargetId] = useState('')
  const [relationType, setRelationType] = useState('')
  const [addOpen, setAddOpen] = useState(false)

  const entryMap = new Map((allEntries ?? []).map(e => [e.id, e]))

  const handleAdd = async () => {
    if (!targetId || !relationType) return
    await createRelation({ fromId: entryId, toId: targetId, relationType })
    setTargetId('')
    setRelationType('')
    setAddOpen(false)
  }

  const outbound = relations?.outbound ?? []
  const inbound = relations?.inbound ?? []

  return (
    <div className="space-y-4">
      <Button size="sm" variant="outline" onClick={() => setAddOpen(v => !v)}>
        <Plus className="mr-1.5 h-3.5 w-3.5" />
        Add relation
      </Button>

      {addOpen && (
        <div className="rounded-md border p-3 space-y-2">
          <div className="space-y-1">
            <label className="text-xs font-medium">Entry</label>
            <Select value={targetId} onValueChange={setTargetId}>
              <SelectTrigger className="h-8">
                <SelectValue placeholder="Select entry…" />
              </SelectTrigger>
              <SelectContent>
                {(allEntries ?? [])
                  .filter(e => e.id !== entryId)
                  .map(e => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium">Relation type</label>
            <div className="flex gap-2">
              <Input
                value={relationType}
                onChange={e => setRelationType(e.target.value)}
                placeholder="e.g. ally of"
                className="h-8 flex-1"
                list="relation-presets"
              />
              <datalist id="relation-presets">
                {RELATION_PRESETS.map(p => <option key={p} value={p} />)}
              </datalist>
              <Button size="sm" className="h-8" onClick={handleAdd} disabled={!targetId || !relationType}>
                Add
              </Button>
            </div>
          </div>
        </div>
      )}

      {outbound.length === 0 && inbound.length === 0 ? (
        <p className="text-muted-foreground text-sm">No relations yet.</p>
      ) : (
        <div className="space-y-2">
          {outbound.map(r => (
            <div key={r.id} className="flex items-center gap-2 text-sm">
              <span className="flex-1">
                <span className="font-medium">{entryMap.get(r.toId)?.name ?? 'Unknown'}</span>
                <span className="text-muted-foreground"> — {r.relationType}</span>
              </span>
              <Button
                size="icon"
                variant="ghost"
                className="text-destructive h-6 w-6"
                onClick={() => deleteRelation(r.id)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
          {inbound.length > 0 && (
            <>
              <Separator />
              <p className="text-muted-foreground text-xs font-medium">Incoming links</p>
              {inbound.map(r => (
                <div key={r.id} className="text-muted-foreground text-sm">
                  <span className="text-foreground font-medium">
                    {entryMap.get(r.fromId)?.name ?? 'Unknown'}
                  </span>{' '}
                  {r.relationType} this entry
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Tracking Tab ────────────────────────────────────────────────────────────

function TrackingTab({
  entry,
  onUpdate,
}: {
  entry: CodexEntry
  onUpdate: (patch: Partial<CodexEntry>) => void
}) {
  const [exclusionInput, setExclusionInput] = useState('')

  const tracking = entry.trackingSettings
  const aiMode = entry.aiContextMode

  const updateTracking = (patch: Partial<typeof tracking>) => {
    onUpdate({ trackingSettings: { ...tracking, ...patch } })
  }

  const addExclusion = () => {
    const v = exclusionInput.trim()
    if (!v || tracking.exclusions.includes(v)) return
    updateTracking({ exclusions: [...tracking.exclusions, v] })
    setExclusionInput('')
  }

  const removeExclusion = (exc: string) => {
    updateTracking({ exclusions: tracking.exclusions.filter(x => x !== exc) })
  }

  return (
    <div className="space-y-5">
      {/* Enable toggle */}
      <ToggleRow
        label="Enable tracking"
        description="Automatically detect this entry's name in scene text"
        value={tracking.enabled}
        onChange={v => updateTracking({ enabled: v })}
      />

      <Separator />

      {/* Case sensitive */}
      <ToggleRow
        label="Case sensitive"
        description="Only match exact casing (e.g. 'Jon' won't match 'jon')"
        value={tracking.caseSensitive}
        onChange={v => updateTracking({ caseSensitive: v })}
      />

      <Separator />

      {/* Exclusions */}
      <div className="space-y-2">
        <div>
          <p className="text-sm font-medium">Exclusion list</p>
          <p className="text-muted-foreground text-xs">
            Phrases containing these strings won't be highlighted.
          </p>
        </div>
        <div className="flex gap-2">
          <Input
            value={exclusionInput}
            onChange={e => setExclusionInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addExclusion()}
            placeholder="Add phrase, press Enter"
            className="h-8 flex-1"
          />
          <Button size="sm" variant="outline" className="h-8" onClick={addExclusion}>
            Add
          </Button>
        </div>
        {tracking.exclusions.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tracking.exclusions.map(exc => (
              <Badge key={exc} variant="secondary" className="gap-1 text-xs">
                {exc}
                <button onClick={() => removeExclusion(exc)} className="hover:text-destructive">
                  <X className="h-2.5 w-2.5" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      <Separator />

      {/* AI context mode */}
      <div className="space-y-2">
        <div>
          <p className="text-sm font-medium">AI context mode</p>
          <p className="text-muted-foreground text-xs">
            Controls when this entry is included in AI prompts.
          </p>
        </div>
        <Select value={aiMode} onValueChange={v => onUpdate({ aiContextMode: v as AiContextMode })}>
          <SelectTrigger className="h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.values(AiContextMode).map(m => (
              <SelectItem key={m} value={m}>
                {AI_MODE_LABELS[m]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {aiMode === AiContextMode.NeverInclude && (
          <div className="text-destructive flex items-center gap-1.5 text-xs">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            This entry will never be sent to any AI provider.
          </div>
        )}
      </div>
    </div>
  )
}

function ToggleRow({
  label,
  description,
  value,
  onChange,
}: {
  label: string
  description: string
  value: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-muted-foreground text-xs">{description}</p>
      </div>
      <button
        role="switch"
        aria-checked={value}
        onClick={() => onChange(!value)}
        className={cn(
          'relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors focus:outline-none',
          value ? 'bg-primary' : 'bg-muted',
        )}
      >
        <span
          className={cn(
            'inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform',
            value ? 'translate-x-4' : 'translate-x-0.5',
          )}
        />
      </button>
    </div>
  )
}

// ─── Progressions Tab ────────────────────────────────────────────────────────

function ProgressionsTab({ entryId }: { entryId: string; novelId: string }) {
  const progressions = useCodexProgressions(entryId)
  const deleteProgression = useDeleteCodexProgression()
  const updateProgression = useUpdateCodexProgression()

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')

  if (!progressions?.length) {
    return (
      <div className="space-y-2">
        <p className="text-muted-foreground text-sm">
          No progressions yet. Use the{' '}
          <kbd className="bg-muted rounded px-1 text-xs">/codex progression</kbd> slash command
          in the editor to anchor a change at a scene.
        </p>
      </div>
    )
  }

  const startEdit = (id: string, content: string) => {
    setEditingId(id)
    setEditContent(content)
  }

  const saveEdit = async () => {
    if (!editingId) return
    await updateProgression(editingId, { content: editContent })
    setEditingId(null)
  }

  return (
    <div className="space-y-3">
      {progressions.map(p => (
        <div key={p.id} className="rounded-md border p-3 text-sm space-y-1.5">
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="text-xs">
              {p.mode === 'addition' ? 'Addition' : 'Replacement'}
            </Badge>
            <div className="flex gap-1">
              {editingId === p.id ? (
                <>
                  <Button size="sm" className="h-6 px-2 text-xs" onClick={saveEdit}>Save</Button>
                  <Button size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={() => setEditingId(null)}>Cancel</Button>
                </>
              ) : (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 px-2 text-xs"
                  onClick={() => startEdit(p.id, p.content)}
                >
                  Edit
                </Button>
              )}
              <Button
                size="icon"
                variant="ghost"
                className="text-destructive h-6 w-6"
                onClick={() => deleteProgression(p.id)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {p.detailKey && (
            <p className="text-muted-foreground text-xs">Detail: {p.detailKey}</p>
          )}

          {editingId === p.id ? (
            <textarea
              value={editContent}
              onChange={e => setEditContent(e.target.value)}
              className="w-full rounded border p-2 text-xs"
              rows={3}
            />
          ) : (
            <p className="text-xs">{p.content}</p>
          )}
        </div>
      ))}
    </div>
  )
}
