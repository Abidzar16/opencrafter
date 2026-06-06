import { useState } from 'react'
import { X, ChevronDown, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { useLiveQuery } from 'dexie-react-hooks'
import db from '@/lib/db/db'
import { CodexType } from '@/types'
import type { ContextAttachment } from '@/types'

interface ContextSelectorProps {
  open: boolean
  onClose: () => void
  novelId: string
  selected: ContextAttachment[]
  onChange: (attachments: ContextAttachment[]) => void
}

export function ContextSelector({ open, onClose, novelId, selected, onChange }: ContextSelectorProps) {
  const [draft, setDraft] = useState<ContextAttachment[]>(selected)

  function handleOpen() {
    setDraft(selected)
  }

  function toggle(att: ContextAttachment) {
    setDraft(prev => {
      const exists = prev.some(a => a.id === att.id)
      return exists ? prev.filter(a => a.id !== att.id) : [...prev, att]
    })
  }

  function isSelected(id: string) {
    return draft.some(a => a.id === id)
  }

  function handleApply() {
    onChange(draft)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()} onOpenAutoFocus={handleOpen as unknown as React.EventHandler<Event>}>
      <DialogContent className="max-w-2xl h-[70vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-5 pb-3 border-b">
          <DialogTitle>Select Context</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="novel" className="flex flex-1 flex-col min-h-0">
          <TabsList className="mx-6 mt-3 self-start">
            <TabsTrigger value="novel">Novel Text</TabsTrigger>
            <TabsTrigger value="codex">Codex</TabsTrigger>
            <TabsTrigger value="snippets">Snippets</TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 mt-2">
            <TabsContent value="novel" className="mt-0 p-4 space-y-2">
              <NovelTextTab
                novelId={novelId}
                isSelected={isSelected}
                onToggle={toggle}
              />
            </TabsContent>

            <TabsContent value="codex" className="mt-0 p-4 space-y-2">
              <CodexTab novelId={novelId} isSelected={isSelected} onToggle={toggle} />
            </TabsContent>

            <TabsContent value="snippets" className="mt-0 p-4 space-y-2">
              <SnippetsTab novelId={novelId} isSelected={isSelected} onToggle={toggle} />
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <DialogFooter className="px-6 py-4 border-t">
          <span className="text-muted-foreground mr-auto text-sm">
            {draft.length} item{draft.length !== 1 ? 's' : ''} selected
          </span>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleApply}>Apply</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// --- Novel Text Tab ---
function NovelTextTab({
  novelId,
  isSelected,
  onToggle,
}: {
  novelId: string
  isSelected: (id: string) => boolean
  onToggle: (att: ContextAttachment) => void
}) {
  const [actsOpen, setActsOpen] = useState<Record<string, boolean>>({})
  const [chaptersOpen, setChaptersOpen] = useState<Record<string, boolean>>({})
  const novel = useLiveQuery(() => db.novels.get(novelId), [novelId])
  const acts = useLiveQuery(() => db.acts.where('novelId').equals(novelId).sortBy('order'), [novelId]) ?? []
  const chapters = useLiveQuery(() => db.chapters.where('novelId').equals(novelId).sortBy('order'), [novelId]) ?? []
  const scenes = useLiveQuery(() => db.scenes.where('novelId').equals(novelId).sortBy('order'), [novelId]) ?? []

  const fullNovelId = `full:${novelId}`
  const fullNovelAtt: ContextAttachment = { type: 'full_novel', id: novelId, label: novel?.title ?? 'Full Novel' }

  return (
    <div className="space-y-2">
      {/* Full novel option */}
      <ContextCheckItem
        id={fullNovelId}
        label={novel?.title ?? 'Full Novel'}
        sublabel="All scenes (structure + summaries)"
        isSelected={isSelected(novelId)}
        onToggle={() => onToggle(fullNovelAtt)}
      />

      <div className="border-t pt-2 space-y-1">
        <p className="text-muted-foreground text-xs font-medium px-1">Or select specific sections:</p>
        {acts.map(act => {
          const actChapters = chapters.filter(c => c.actId === act.id)
          const isActOpen = actsOpen[act.id] ?? false
          return (
            <div key={act.id}>
              <div className="flex items-center gap-1">
                <button
                  className="text-muted-foreground hover:text-foreground p-0.5"
                  onClick={() => setActsOpen(s => ({ ...s, [act.id]: !s[act.id] }))}
                >
                  {isActOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                </button>
                <ContextCheckItem
                  id={act.id}
                  label={act.title}
                  sublabel="Act"
                  isSelected={isSelected(act.id)}
                  onToggle={() => onToggle({ type: 'act', id: act.id, label: act.title })}
                  className="flex-1"
                />
              </div>
              {isActOpen && actChapters.map(ch => {
                const chScenes = scenes.filter(s => s.chapterId === ch.id)
                const isChOpen = chaptersOpen[ch.id] ?? false
                return (
                  <div key={ch.id} className="ml-5">
                    <div className="flex items-center gap-1">
                      <button
                        className="text-muted-foreground hover:text-foreground p-0.5"
                        onClick={() => setChaptersOpen(s => ({ ...s, [ch.id]: !s[ch.id] }))}
                      >
                        {isChOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                      </button>
                      <ContextCheckItem
                        id={ch.id}
                        label={ch.title}
                        sublabel="Chapter"
                        isSelected={isSelected(ch.id)}
                        onToggle={() => onToggle({ type: 'chapter', id: ch.id, label: ch.title })}
                        className="flex-1"
                      />
                    </div>
                    {isChOpen && chScenes.map(sc => (
                      <div key={sc.id} className="ml-5">
                        <ContextCheckItem
                          id={sc.id}
                          label={sc.title}
                          sublabel={`Scene${sc.summary ? ' · ' + sc.summary.slice(0, 60) : ''}`}
                          isSelected={isSelected(sc.id)}
                          onToggle={() => onToggle({ type: 'scene', id: sc.id, label: sc.title })}
                        />
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// --- Codex Tab ---
function CodexTab({
  novelId,
  isSelected,
  onToggle,
}: {
  novelId: string
  isSelected: (id: string) => boolean
  onToggle: (att: ContextAttachment) => void
}) {
  const [search, setSearch] = useState('')
  const entries = useLiveQuery(
    () => db.codex_entries.where('novelId').equals(novelId).toArray(),
    [novelId],
  ) ?? []

  const filtered = entries.filter(e =>
    !search ||
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))
  )

  const byType = Object.values(CodexType).map(type => ({
    type,
    entries: filtered.filter(e => e.type === type),
  })).filter(g => g.entries.length > 0)

  return (
    <div className="space-y-3">
      <input
        type="text"
        placeholder="Search entries…"
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="border-input bg-background w-full rounded-md border px-3 py-1.5 text-sm outline-none focus:ring-1"
      />
      {byType.map(({ type, entries: typeEntries }) => (
        <div key={type}>
          <p className="text-muted-foreground mb-1 text-xs font-medium capitalize">{type}</p>
          <div className="space-y-0.5">
            {typeEntries.map(entry => (
              <ContextCheckItem
                key={entry.id}
                id={entry.id}
                label={entry.name}
                sublabel={entry.aliases.slice(0, 2).join(', ')}
                isSelected={isSelected(entry.id)}
                onToggle={() => onToggle({ type: 'codex_entry', id: entry.id, label: entry.name })}
              />
            ))}
          </div>
        </div>
      ))}
      {byType.length === 0 && (
        <p className="text-muted-foreground text-sm">No codex entries found.</p>
      )}
    </div>
  )
}

// --- Snippets Tab ---
function SnippetsTab({
  novelId,
  isSelected,
  onToggle,
}: {
  novelId: string
  isSelected: (id: string) => boolean
  onToggle: (att: ContextAttachment) => void
}) {
  const snippets = useLiveQuery(
    () => db.snippets.where('novelId').equals(novelId).toArray(),
    [novelId],
  ) ?? []

  if (snippets.length === 0) {
    return <p className="text-muted-foreground text-sm">No snippets for this novel.</p>
  }

  return (
    <div className="space-y-0.5">
      {snippets.map(s => (
        <ContextCheckItem
          key={s.id}
          id={s.id}
          label={s.name}
          sublabel={s.tags.join(', ')}
          isSelected={isSelected(s.id)}
          onToggle={() => onToggle({ type: 'snippet', id: s.id, label: s.name })}
        />
      ))}
    </div>
  )
}

// --- Shared checkbox item ---
function ContextCheckItem({
  id,
  label,
  sublabel,
  isSelected,
  onToggle,
  className,
}: {
  id: string
  label: string
  sublabel?: string
  isSelected: boolean
  onToggle: () => void
  className?: string
}) {
  return (
    <label
      htmlFor={`ctx-${id}`}
      className={cn(
        'flex cursor-pointer items-start gap-2 rounded-md px-2 py-1.5 hover:bg-accent/50 select-none',
        isSelected && 'bg-accent',
        className,
      )}
    >
      <input
        id={`ctx-${id}`}
        type="checkbox"
        checked={isSelected}
        onChange={onToggle}
        className="mt-0.5 shrink-0"
      />
      <div className="min-w-0">
        <p className="truncate text-sm">{label}</p>
        {sublabel && <p className="text-muted-foreground truncate text-xs">{sublabel}</p>}
      </div>
    </label>
  )
}

/** Small pill showing a context attachment, with remove button */
export function ContextPill({ att, onRemove }: { att: ContextAttachment; onRemove: () => void }) {
  const typeLabel: Record<ContextAttachment['type'], string> = {
    full_novel: 'Novel',
    act: 'Act',
    chapter: 'Ch',
    scene: 'Scene',
    codex_entry: 'Codex',
    snippet: 'Snippet',
  }
  return (
    <Badge variant="secondary" className="gap-1 pr-1 text-xs">
      <span className="text-muted-foreground">{typeLabel[att.type]}:</span>
      {att.label.length > 20 ? att.label.slice(0, 18) + '…' : att.label}
      <button onClick={onRemove} className="text-muted-foreground hover:text-foreground ml-0.5">
        <X className="h-2.5 w-2.5" />
      </button>
    </Badge>
  )
}
