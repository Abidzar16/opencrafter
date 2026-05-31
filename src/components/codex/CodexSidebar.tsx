import { useState, useMemo } from 'react'
import { Plus, Search, ChevronRight, ChevronDown, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { useCodexEntries } from '@/lib/db/hooks'
import { CodexType } from '@/types'
import type { CodexEntry } from '@/types'
import { cn } from '@/lib/utils'
import { EntryEditor } from './EntryEditor'

const TYPE_LABELS: Record<CodexType, string> = {
  [CodexType.Character]: 'Characters',
  [CodexType.Location]: 'Locations',
  [CodexType.Object]: 'Objects / Items',
  [CodexType.Lore]: 'Lore',
  [CodexType.Subplot]: 'Subplots',
  [CodexType.Other]: 'Other',
}

const TYPE_ORDER: CodexType[] = [
  CodexType.Character,
  CodexType.Location,
  CodexType.Object,
  CodexType.Lore,
  CodexType.Subplot,
  CodexType.Other,
]

interface CodexSidebarProps {
  novelId: string
}

export function CodexSidebar({ novelId }: CodexSidebarProps) {
  const rawEntries = useCodexEntries(novelId)
  const entries = useMemo(() => rawEntries ?? [], [rawEntries])

  const [search, setSearch] = useState('')
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null)
  const [editorOpen, setEditorOpen] = useState(false)
  const [newEntryType, setNewEntryType] = useState<CodexType | null>(null)

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    if (!q) return entries
    return entries.filter(
      e =>
        e.name.toLowerCase().includes(q) ||
        e.aliases.some(a => a.toLowerCase().includes(q)) ||
        e.tags.some(t => t.toLowerCase().includes(q)),
    )
  }, [entries, search])

  const grouped = useMemo(() => {
    const map = new Map<CodexType, CodexEntry[]>()
    for (const type of TYPE_ORDER) map.set(type, [])
    for (const e of filtered) {
      map.get(e.type)?.push(e)
    }
    return map
  }, [filtered])

  const toggleSection = (type: string) => {
    setCollapsed(prev => {
      const next = new Set(prev)
      if (next.has(type)) {
        next.delete(type)
      } else {
        next.add(type)
      }
      return next
    })
  }

  const openEntry = (id: string) => {
    setSelectedEntryId(id)
    setNewEntryType(null)
    setEditorOpen(true)
  }

  const openNewEntry = (type?: CodexType) => {
    setSelectedEntryId(null)
    setNewEntryType(type ?? CodexType.Character)
    setEditorOpen(true)
  }

  const handleEditorClose = () => {
    setEditorOpen(false)
    setSelectedEntryId(null)
    setNewEntryType(null)
  }

  return (
    <>
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex shrink-0 items-center gap-2 border-b px-3 py-2">
          <span className="flex-1 text-sm font-semibold">Codex</span>
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openNewEntry()}>
            <Plus className="h-4 w-4" />
            <span className="sr-only">New entry</span>
          </Button>
        </div>

        {/* Search */}
        <div className="shrink-0 px-3 py-2">
          <div className="relative">
            <Search className="text-muted-foreground absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search entries…"
              className="h-8 pl-8 text-sm"
            />
          </div>
        </div>

        {/* Entry list */}
        <ScrollArea className="flex-1">
          {entries.length === 0 ? (
            <div className="px-3 py-6">
              <EmptyState
                icon={<BookOpen className="h-8 w-8" />}
                title="No codex entries"
                description="Add characters, locations, lore, and more."
                action={
                  <Button size="sm" onClick={() => openNewEntry()}>
                    <Plus className="mr-1 h-3.5 w-3.5" />
                    New entry
                  </Button>
                }
              />
            </div>
          ) : (
            <div className="py-1">
              {TYPE_ORDER.map(type => {
                const typeEntries = grouped.get(type) ?? []
                if (typeEntries.length === 0 && search) return null
                const isCollapsed = collapsed.has(type)

                return (
                  <div key={type}>
                    <button
                      className="text-muted-foreground hover:text-foreground flex w-full items-center gap-1 px-3 py-1.5 text-xs font-medium uppercase tracking-wider transition-colors"
                      onClick={() => toggleSection(type)}
                    >
                      {isCollapsed ? (
                        <ChevronRight className="h-3 w-3 shrink-0" />
                      ) : (
                        <ChevronDown className="h-3 w-3 shrink-0" />
                      )}
                      <span className="flex-1 text-left">{TYPE_LABELS[type]}</span>
                      <span className="tabular-nums">{typeEntries.length}</span>
                    </button>

                    {!isCollapsed && (
                      <>
                        {typeEntries.length === 0 ? (
                          <button
                            className="text-muted-foreground hover:text-foreground flex w-full items-center gap-1.5 px-5 py-1 text-xs transition-colors"
                            onClick={() => openNewEntry(type)}
                          >
                            <Plus className="h-3 w-3" />
                            Add {TYPE_LABELS[type].toLowerCase().replace(/s$/, '')}
                          </button>
                        ) : (
                          typeEntries.map(entry => (
                            <EntryRow
                              key={entry.id}
                              entry={entry}
                              selected={selectedEntryId === entry.id}
                              onClick={() => openEntry(entry.id)}
                            />
                          ))
                        )}
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Entry editor sheet */}
      <EntryEditor
        open={editorOpen}
        novelId={novelId}
        entryId={selectedEntryId ?? undefined}
        defaultType={newEntryType ?? undefined}
        onClose={handleEditorClose}
        onCreated={id => {
          setSelectedEntryId(id)
          setNewEntryType(null)
        }}
      />
    </>
  )
}

function EntryRow({
  entry,
  selected,
  onClick,
}: {
  entry: CodexEntry
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      className={cn(
        'flex w-full items-center gap-2 px-5 py-1.5 text-left text-sm transition-colors',
        selected
          ? 'bg-accent text-accent-foreground'
          : 'hover:bg-muted text-foreground',
      )}
      onClick={onClick}
    >
      <span className="flex-1 truncate">{entry.name}</span>
      {entry.mentionCount > 0 && (
        <Badge variant="secondary" className="h-4 px-1 text-[10px]">
          {entry.mentionCount}
        </Badge>
      )}
    </button>
  )
}
