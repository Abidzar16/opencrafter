import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowLeft, BookOpen, Plus, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { Spinner } from '@/components/ui/spinner'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { NovelCard } from '@/components/library/novel-card'
import { CodexSidebar } from '@/components/codex/CodexSidebar'
import { useOneSeries, useUpdateSeries, useNovelsInSeries } from '@/lib/db/hooks/novels'
import { toast } from '@/components/ui/toast-provider'
import { cn } from '@/lib/utils'

const SERIES_CODEX_NOVEL_PREFIX = '@series:'

/** Virtual novelId used to store series-level codex entries */
function seriesCodexId(seriesId: string) {
  return `${SERIES_CODEX_NOVEL_PREFIX}${seriesId}`
}

interface SeriesHomeProps {
  seriesId: string
}

export function SeriesHome({ seriesId }: SeriesHomeProps) {
  const series = useOneSeries(seriesId)
  const novels = useNovelsInSeries(seriesId) ?? []
  const updateSeries = useUpdateSeries()

  const [renaming, setRenaming] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const [codexOpen, setCodexOpen] = useState(false)

  if (series === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!series) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Series not found.</p>
        <Button asChild variant="outline">
          <Link to="/">Back to library</Link>
        </Button>
      </div>
    )
  }

  async function handleRename() {
    if (!nameInput.trim() || nameInput.trim() === series!.name) {
      setRenaming(false)
      return
    }
    try {
      await updateSeries(seriesId, { name: nameInput.trim() })
      setRenaming(false)
    } catch {
      toast.error('Failed to rename series.')
    }
  }

  const activeNovels = novels.filter(n => !n.archived)

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-background border-border flex h-12 shrink-0 items-center gap-2 border-b px-3">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
              <Link to="/">
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Back to library</span>
              </Link>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Library</TooltipContent>
        </Tooltip>

        <Separator orientation="vertical" className="h-5" />

        {renaming ? (
          <Input
            value={nameInput}
            onChange={e => setNameInput(e.target.value)}
            onBlur={handleRename}
            onKeyDown={e => {
              if (e.key === 'Enter') handleRename()
              if (e.key === 'Escape') setRenaming(false)
            }}
            className="h-7 max-w-[200px] text-sm font-medium"
            autoFocus
          />
        ) : (
          <button
            className="text-foreground max-w-[200px] truncate text-sm font-medium hover:underline"
            onDoubleClick={() => { setNameInput(series.name); setRenaming(true) }}
            title="Double-click to rename"
          >
            {series.name}
          </button>
        )}

        <Badge variant="secondary" className="text-xs">Series</Badge>

        <div className="ml-auto flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={codexOpen ? 'secondary' : 'ghost'}
                size="icon"
                className="h-8 w-8"
                onClick={() => setCodexOpen(v => !v)}
              >
                <BookOpen className="h-4 w-4" />
                <span className="sr-only">Series codex</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Series Codex</TooltipContent>
          </Tooltip>
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Series codex panel */}
        {codexOpen && (
          <div className="border-border bg-background w-72 shrink-0 border-r">
            {/* We use the seriesCodexId as a virtual novelId so existing CodexSidebar works */}
            <CodexSidebar novelId={seriesCodexId(seriesId)} />
          </div>
        )}

        {/* Main content */}
        <main className="flex-1 overflow-auto p-6">
          <div className="mx-auto max-w-5xl space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">{series.name}</h1>
                <p className="text-muted-foreground text-sm">
                  {activeNovels.length} novel{activeNovels.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            {activeNovels.length === 0 ? (
              <EmptyState
                icon={<BookOpen className="h-10 w-10" />}
                title="No novels in this series"
                description="Add a novel to this series from the library by editing its settings."
              />
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                {activeNovels.map(novel => (
                  <NovelCard
                    key={novel.id}
                    novel={novel}
                    onDelete={() => {}}
                    onArchive={() => {}}
                    onUnarchive={() => {}}
                    onSettings={() => {}}
                  />
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
