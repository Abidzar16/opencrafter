import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ActionMenu, type ActionMenuItem } from '@/components/ui/action-menu'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { useUpdateSeries, useDeleteSeries } from '@/lib/db/hooks/novels'
import type { Series, Novel } from '@/types'
import { NovelCard } from './novel-card'
import { ChevronDown, ChevronRight, FolderOpen } from 'lucide-react'
import { toast } from '@/components/ui/toast-provider'

interface SeriesSectionProps {
  series: Series
  novels: Novel[]
  onNovelDelete: (id: string) => void
  onNovelArchive: (id: string) => void
  onNovelUnarchive: (id: string) => void
  onNovelSettings: (novel: Novel) => void
}

export function SeriesSection({
  series,
  novels,
  onNovelDelete,
  onNovelArchive,
  onNovelUnarchive,
  onNovelSettings,
}: SeriesSectionProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [renaming, setRenaming] = useState(false)
  const [name, setName] = useState(series.name)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const updateSeries = useUpdateSeries()
  const deleteSeries = useDeleteSeries()

  async function handleRename() {
    if (!name.trim() || name.trim() === series.name) {
      setRenaming(false)
      setName(series.name)
      return
    }
    try {
      await updateSeries(series.id, { name: name.trim() })
      setRenaming(false)
    } catch {
      toast.error('Failed to rename series.')
    }
  }

  async function handleDelete() {
    try {
      await deleteSeries(series.id)
    } catch {
      toast.error('Failed to delete series.')
    }
  }

  const actions: ActionMenuItem[] = [
    { label: 'Rename', onClick: () => setRenaming(true) },
    { label: 'Delete series', onClick: () => setDeleteOpen(true), destructive: true, separator: true },
  ]

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1.5 px-2 font-semibold"
          onClick={() => setCollapsed(c => !c)}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
          <FolderOpen className="h-4 w-4" />
          {renaming ? (
            <Input
              className="h-6 px-1 text-sm font-semibold"
              value={name}
              onChange={e => setName(e.target.value)}
              onBlur={handleRename}
              onKeyDown={e => {
                if (e.key === 'Enter') handleRename()
                if (e.key === 'Escape') { setRenaming(false); setName(series.name) }
              }}
              autoFocus
              onClick={e => e.stopPropagation()}
            />
          ) : (
            <span>{series.name}</span>
          )}
          <span className="text-muted-foreground font-normal">({novels.length})</span>
        </Button>
        <ActionMenu actions={actions} />
      </div>

      {!collapsed && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {novels.map(novel => (
            <NovelCard
              key={novel.id}
              novel={novel}
              onDelete={() => onNovelDelete(novel.id)}
              onArchive={() => onNovelArchive(novel.id)}
              onUnarchive={() => onNovelUnarchive(novel.id)}
              onSettings={() => onNovelSettings(novel)}
            />
          ))}
        </div>
      )}

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={`Delete "${series.name}"?`}
        description="This removes the series grouping. Novels in this series will be moved to the main library."
        confirmLabel="Delete Series"
        destructive
        onConfirm={handleDelete}
      />
    </div>
  )
}
