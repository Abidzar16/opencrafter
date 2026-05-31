import { BookMarked } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useCodexProgressionsByScene, useCodexEntries } from '@/lib/db/hooks'

interface ProgressionBadgeProps {
  sceneId: string
  novelId: string
}

export function ProgressionBadge({ sceneId, novelId }: ProgressionBadgeProps) {
  const progressions = useCodexProgressionsByScene(sceneId) ?? []
  const entries = useCodexEntries(novelId) ?? []

  if (progressions.length === 0) return null

  const entryMap = new Map(entries.map(e => [e.id, e]))

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="text-primary/70 hover:text-primary ml-2 inline-flex cursor-default items-center gap-1 align-middle text-xs">
          <BookMarked className="h-3 w-3" />
          {progressions.length}
        </span>
      </TooltipTrigger>
      <TooltipContent side="right" className="max-w-[220px]">
        <div className="space-y-1 text-xs">
          <p className="font-medium">Codex progressions at this scene:</p>
          {progressions.map(p => (
            <p key={p.id} className="text-muted-foreground">
              <span className="text-foreground font-medium">
                {entryMap.get(p.entryId)?.name ?? 'Unknown'}
              </span>{' '}
              — {p.mode}: {p.content.slice(0, 60)}
              {p.content.length > 60 ? '…' : ''}
            </p>
          ))}
        </div>
      </TooltipContent>
    </Tooltip>
  )
}
