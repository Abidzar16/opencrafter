import { Link } from '@tanstack/react-router'
import { Badge } from '@/components/ui/badge'
import { ActionMenu, type ActionMenuItem } from '@/components/ui/action-menu'
import type { Novel } from '@/types'
import { BookOpen, Archive } from 'lucide-react'
import { cn } from '@/lib/utils'

interface NovelCardProps {
  novel: Novel
  onDelete: () => void
  onArchive: () => void
  onUnarchive: () => void
  onSettings: () => void
}

export function NovelCard({ novel, onDelete, onArchive, onUnarchive, onSettings }: NovelCardProps) {
  const actions: ActionMenuItem[] = novel.archived
    ? [
        { label: 'Restore', onClick: onUnarchive },
        { label: 'Settings', onClick: onSettings },
        { label: 'Delete permanently', onClick: onDelete, destructive: true, separator: true },
      ]
    : [
        { label: 'Settings', onClick: onSettings },
        { label: 'Archive', onClick: onArchive },
        { label: 'Delete', onClick: onDelete, destructive: true, separator: true },
      ]

  const updatedAt = new Date(novel.updatedAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <div
      className={cn(
        'group bg-card relative flex flex-col overflow-hidden rounded-lg border shadow-sm transition-shadow hover:shadow-md',
        novel.archived && 'opacity-60',
      )}
    >
      {/* Cover */}
      <Link
        to="/novel/$novelId/plan"
        params={{ novelId: novel.id }}
        className="block aspect-[2/3] bg-gradient-to-br from-muted to-muted/40"
      >
        {novel.coverImage ? (
          <img
            src={novel.coverImage}
            alt={novel.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <BookOpen className="text-muted-foreground h-12 w-12 opacity-40" />
          </div>
        )}
      </Link>

      {/* Info */}
      <div className="flex flex-col gap-1 p-3">
        <div className="flex items-start justify-between gap-1">
          <Link
            to="/novel/$novelId/plan"
            params={{ novelId: novel.id }}
            className="hover:text-primary line-clamp-2 text-sm font-semibold leading-tight"
          >
            {novel.title}
          </Link>
          <div className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100">
            <ActionMenu actions={actions} />
          </div>
        </div>
        <p className="text-muted-foreground text-xs">{updatedAt}</p>
        {novel.archived && (
          <Badge variant="secondary" className="w-fit text-xs">
            <Archive className="mr-1 h-3 w-3" />
            Archived
          </Badge>
        )}
      </div>
    </div>
  )
}
