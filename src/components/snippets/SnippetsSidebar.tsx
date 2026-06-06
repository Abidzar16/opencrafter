import { useState, useMemo } from 'react'
import { Plus, Search, Scissors, Pin, PinOff, Copy, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useSnippets, useCreateSnippet, useDeleteSnippet } from '@/lib/db/hooks'
import { useUIStore } from '@/stores/ui-store'
import { cn } from '@/lib/utils'
import type { Snippet } from '@/types'
import { SnippetEditor } from './SnippetEditor'

interface SnippetsSidebarProps {
  novelId: string
}

export function SnippetsSidebar({ novelId }: SnippetsSidebarProps) {
  const rawSnippets = useSnippets(novelId)
  const snippets = useMemo(() => rawSnippets ?? [], [rawSnippets])
  const createSnippet = useCreateSnippet()
  const deleteSnippet = useDeleteSnippet()
  const { snippetsPinned, toggleSnippetsPinned } = useUIStore()

  const [search, setSearch] = useState('')
  const [activeTag, setActiveTag] = useState<string | null>(null)
  const [selectedSnippetId, setSelectedSnippetId] = useState<string | null>(null)
  const [editorOpen, setEditorOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const allTags = useMemo(() => {
    const tagSet = new Set<string>()
    for (const s of snippets) {
      for (const t of s.tags) tagSet.add(t)
    }
    return Array.from(tagSet).sort()
  }, [snippets])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return snippets.filter(s => {
      const matchesSearch =
        !q || s.name.toLowerCase().includes(q) || s.tags.some(t => t.toLowerCase().includes(q))
      const matchesTag = !activeTag || s.tags.includes(activeTag)
      return matchesSearch && matchesTag
    })
  }, [snippets, search, activeTag])

  const openSnippet = (id: string) => {
    setSelectedSnippetId(id)
    setEditorOpen(true)
  }

  const openNew = async () => {
    const id = await createSnippet({ novelId, name: 'New snippet', content: {}, tags: [] })
    setSelectedSnippetId(id)
    setEditorOpen(true)
  }

  const handleDuplicate = async (snippet: Snippet) => {
    const id = await createSnippet({
      novelId,
      name: `${snippet.name} (copy)`,
      content: snippet.content,
      tags: [...snippet.tags],
    })
    setSelectedSnippetId(id)
    setEditorOpen(true)
  }

  const handleDelete = async () => {
    if (deleteId) {
      await deleteSnippet(deleteId)
      if (selectedSnippetId === deleteId) {
        setEditorOpen(false)
        setSelectedSnippetId(null)
      }
      setDeleteId(null)
    }
  }

  return (
    <>
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex shrink-0 items-center gap-2 border-b px-3 py-2">
          <span className="flex-1 text-sm font-semibold">Snippets</span>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant={snippetsPinned ? 'secondary' : 'ghost'}
                className="h-7 w-7"
                onClick={toggleSnippetsPinned}
              >
                {snippetsPinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
                <span className="sr-only">{snippetsPinned ? 'Unpin sidebar' : 'Pin sidebar'}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {snippetsPinned ? 'Unpin sidebar' : 'Pin sidebar'}
            </TooltipContent>
          </Tooltip>
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={openNew}>
            <Plus className="h-4 w-4" />
            <span className="sr-only">New snippet</span>
          </Button>
        </div>

        {/* Search */}
        <div className="shrink-0 px-3 py-2">
          <div className="relative">
            <Search className="text-muted-foreground absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search snippets…"
              className="h-8 pl-8 text-sm"
            />
          </div>
        </div>

        {/* Tag filter */}
        {allTags.length > 0 && (
          <div className="flex shrink-0 flex-wrap gap-1 px-3 pb-2">
            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                className={cn(
                  'rounded-full px-2 py-0.5 text-[11px] transition-colors',
                  activeTag === tag
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                )}
              >
                {tag}
              </button>
            ))}
          </div>
        )}

        {/* Snippet list */}
        <ScrollArea className="flex-1">
          {snippets.length === 0 ? (
            <div className="px-3 py-6">
              <EmptyState
                icon={<Scissors className="h-8 w-8" />}
                title="No snippets"
                description="Save reusable text snippets for quick access."
                action={
                  <Button size="sm" onClick={openNew}>
                    <Plus className="mr-1 h-3.5 w-3.5" />
                    New snippet
                  </Button>
                }
              />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-muted-foreground px-4 py-6 text-center text-sm">No results.</p>
          ) : (
            <div className="py-1">
              {filtered.map(snippet => (
                <SnippetRow
                  key={snippet.id}
                  snippet={snippet}
                  selected={selectedSnippetId === snippet.id && editorOpen}
                  onClick={() => openSnippet(snippet.id)}
                  onDuplicate={() => handleDuplicate(snippet)}
                  onDelete={() => setDeleteId(snippet.id)}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      <SnippetEditor
        open={editorOpen}
        snippetId={selectedSnippetId ?? undefined}
        novelId={novelId}
        onClose={() => {
          setEditorOpen(false)
          setSelectedSnippetId(null)
        }}
      />

      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={open => !open && setDeleteId(null)}
        title="Delete snippet?"
        description="This snippet will be permanently deleted."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        destructive
      />
    </>
  )
}

function SnippetRow({
  snippet,
  selected,
  onClick,
  onDuplicate,
  onDelete,
}: {
  snippet: Snippet
  selected: boolean
  onClick: () => void
  onDuplicate: () => void
  onDelete: () => void
}) {
  return (
    <div
      className={cn(
        'group flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm transition-colors',
        selected ? 'bg-accent text-accent-foreground' : 'hover:bg-muted text-foreground',
      )}
    >
      <button className="min-w-0 flex-1 truncate text-left" onClick={onClick}>
        {snippet.name}
      </button>
      <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        {snippet.tags.slice(0, 2).map(tag => (
          <Badge key={tag} variant="secondary" className="h-4 px-1 text-[10px]">
            {tag}
          </Badge>
        ))}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6"
              onClick={e => e.stopPropagation()}
            >
              <span className="text-muted-foreground text-xs">•••</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onDuplicate}>
              <Copy className="mr-2 h-3.5 w-3.5" />
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={onDelete}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-3.5 w-3.5" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
