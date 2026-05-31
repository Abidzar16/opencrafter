import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { EmptyState } from '@/components/ui/empty-state'
import { Spinner } from '@/components/ui/spinner'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { CreateNovelDialog } from './create-novel-dialog'
import { NovelSettingsModal } from './novel-settings-modal'
import { NovelCard } from './novel-card'
import { SeriesSection } from './series-section'
import {
  useNovels,
  useSeries,
  useDeleteNovel,
  useUpdateNovel,
  useCreateSeries,
} from '@/lib/db/hooks/novels'
import type { Novel } from '@/types'
import { Plus, BookOpen, Settings } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { toast } from '@/components/ui/toast-provider'

type LibraryTab = 'active' | 'archived'

export function NovelLibrary() {
  const [tab, setTab] = useState<LibraryTab>('active')
  const [createOpen, setCreateOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Novel | null>(null)
  const [settingsTarget, setSettingsTarget] = useState<Novel | null>(null)

  const novels = useNovels()
  const seriesList = useSeries()
  const deleteNovel = useDeleteNovel()
  const updateNovel = useUpdateNovel()
  const createSeries = useCreateSeries()

  if (!novels) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  const active = novels.filter(n => !n.archived)
  const archived = novels.filter(n => n.archived)

  const seriesIds = [...new Set(active.filter(n => n.seriesId).map(n => n.seriesId!))]
  const novelsBySeries = new Map(seriesIds.map(sid => [sid, active.filter(n => n.seriesId === sid)]))
  const unseriesed = active.filter(n => !n.seriesId)

  async function handleDelete(novel: Novel) {
    try {
      await deleteNovel(novel.id)
      toast.success(`"${novel.title}" deleted.`)
    } catch {
      toast.error('Failed to delete novel.')
    }
  }

  async function handleArchive(id: string) {
    try {
      await updateNovel(id, { archived: true })
    } catch {
      toast.error('Failed to archive novel.')
    }
  }

  async function handleUnarchive(id: string) {
    try {
      await updateNovel(id, { archived: false })
    } catch {
      toast.error('Failed to restore novel.')
    }
  }

  async function handleCreateSeries() {
    const name = window.prompt('Series name:')
    if (!name?.trim()) return
    try {
      await createSeries({ name: name.trim() })
    } catch {
      toast.error('Failed to create series.')
    }
  }

  return (
    <div className="min-h-screen">
      <header className="bg-background border-border sticky top-0 z-10 flex h-14 items-center justify-between border-b px-6">
        <h1 className="text-xl font-bold">Opencrafter</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleCreateSeries}>
            New Series
          </Button>
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" />
            New Novel
          </Button>
          <Button variant="ghost" size="icon" asChild>
            <Link to="/settings">
              <Settings className="h-4 w-4" />
              <span className="sr-only">Settings</span>
            </Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-screen-xl px-6 py-8">
        <Tabs value={tab} onValueChange={v => setTab(v as LibraryTab)}>
          <TabsList className="mb-6">
            <TabsTrigger value="active">Library ({active.length})</TabsTrigger>
            <TabsTrigger value="archived">Archived ({archived.length})</TabsTrigger>
          </TabsList>
        </Tabs>

        {tab === 'active' ? (
          active.length === 0 ? (
            <EmptyState
              icon={<BookOpen />}
              title="No novels yet"
              description="Create your first novel to get started."
              action={
                <Button onClick={() => setCreateOpen(true)}>
                  <Plus className="mr-1.5 h-4 w-4" />
                  New Novel
                </Button>
              }
            />
          ) : (
            <div className="flex flex-col gap-8">
              {seriesIds.map(sid => {
                const s = seriesList?.find(sr => sr.id === sid)
                if (!s) return null
                return (
                  <SeriesSection
                    key={sid}
                    series={s}
                    novels={novelsBySeries.get(sid) ?? []}
                    onNovelDelete={id => setDeleteTarget(novels.find(n => n.id === id) ?? null)}
                    onNovelArchive={handleArchive}
                    onNovelUnarchive={handleUnarchive}
                    onNovelSettings={novel => setSettingsTarget(novel)}
                  />
                )
              })}

              {unseriesed.length > 0 && (
                <div>
                  {seriesIds.length > 0 && (
                    <h2 className="text-muted-foreground mb-3 text-sm font-semibold uppercase tracking-wide">
                      Other novels
                    </h2>
                  )}
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                    {unseriesed.map(novel => (
                      <NovelCard
                        key={novel.id}
                        novel={novel}
                        onDelete={() => setDeleteTarget(novel)}
                        onArchive={() => handleArchive(novel.id)}
                        onUnarchive={() => handleUnarchive(novel.id)}
                        onSettings={() => setSettingsTarget(novel)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        ) : archived.length === 0 ? (
          <EmptyState
            icon={<BookOpen />}
            title="No archived novels"
            description="Archived novels appear here."
          />
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {archived.map(novel => (
              <NovelCard
                key={novel.id}
                novel={novel}
                onDelete={() => setDeleteTarget(novel)}
                onArchive={() => handleArchive(novel.id)}
                onUnarchive={() => handleUnarchive(novel.id)}
                onSettings={() => setSettingsTarget(novel)}
              />
            ))}
          </div>
        )}
      </main>

      <CreateNovelDialog open={createOpen} onOpenChange={setCreateOpen} />

      {settingsTarget && (
        <NovelSettingsModal
          open={!!settingsTarget}
          onOpenChange={v => !v && setSettingsTarget(null)}
          novel={settingsTarget}
        />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={v => !v && setDeleteTarget(null)}
        title={`Delete "${deleteTarget?.title}"?`}
        description="This permanently deletes the novel and all its content. This cannot be undone."
        confirmLabel="Delete"
        destructive
        onConfirm={() => { if (deleteTarget) return handleDelete(deleteTarget) }}
      />
    </div>
  )
}
