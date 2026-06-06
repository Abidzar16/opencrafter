import { useActs, useChaptersByAct, useScenesByChapter, useLabels } from '@/lib/db/hooks'
import { EmptyState } from '@/components/ui/empty-state'
import { LayoutGrid } from 'lucide-react'
import { SceneCard } from './scene-card'
import type { Act, Chapter, Scene, Label } from '@/types'
import type { CardConfig } from './card-config'

interface GridViewProps {
  novelId: string
  config: CardConfig
  search: string
}

function sceneMatchesSearch(scene: Scene, query: string): boolean {
  if (!query) return true
  const q = query.toLowerCase()
  if (scene.title.toLowerCase().includes(q)) return true
  if (scene.summary?.toLowerCase().includes(q)) return true
  if (scene.beats.some(b => b.text.toLowerCase().includes(q))) return true
  return false
}

interface ChapterColumnProps {
  chapter: Chapter
  novelId: string
  config: CardConfig
  labels: Label[]
  search: string
}

function ChapterColumn({ chapter, novelId, config, labels, search }: ChapterColumnProps) {
  const scenes = useScenesByChapter(chapter.id)
  const activeScenes = (scenes?.filter(s => !s.archived) ?? []).filter(s =>
    sceneMatchesSearch(s, search),
  )

  return (
    <div className="flex flex-col gap-2" style={{ width: config.width }}>
      {/* Chapter header */}
      <div className="px-1">
        <p className="text-xs font-semibold text-foreground truncate">{chapter.title}</p>
        {chapter.subtitle && (
          <p className="text-xs text-muted-foreground italic truncate">{chapter.subtitle}</p>
        )}
      </div>

      {/* Scene cards */}
      <div className="flex flex-col gap-2">
        {activeScenes.map(scene => (
          <SceneCard
            key={scene.id}
            scene={scene}
            novelId={novelId}
            config={config}
            labels={labels}
          />
        ))}
        {activeScenes.length === 0 && (
          <div
            className="flex items-center justify-center rounded-lg border border-dashed border-border text-xs text-muted-foreground/50"
            style={{ minHeight: config.height * 0.5 }}
          >
            {search ? 'No match' : 'Empty'}
          </div>
        )}
      </div>
    </div>
  )
}

interface ActGroupProps {
  act: Act
  novelId: string
  config: CardConfig
  labels: Label[]
  search: string
}

function ActGroup({ act, novelId, config, labels, search }: ActGroupProps) {
  const chapters = useChaptersByAct(act.id)
  const activeChapters = chapters?.filter(c => !c.archived) ?? []

  return (
    <div className="flex flex-col gap-3 shrink-0">
      {/* Act header — spans all chapter columns */}
      <div
        className="rounded-md bg-muted/50 px-3 py-1.5"
        style={{ minWidth: activeChapters.length * (config.width + 12) }}
      >
        <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{act.title}</p>
      </div>

      {/* Chapter columns side by side */}
      <div className="flex gap-3">
        {activeChapters.map(chapter => (
          <ChapterColumn
            key={chapter.id}
            chapter={chapter}
            novelId={novelId}
            config={config}
            labels={labels}
            search={search}
          />
        ))}
        {activeChapters.length === 0 && (
          <div
            className="flex items-center justify-center rounded-md border border-dashed border-border text-xs text-muted-foreground/50"
            style={{ width: config.width }}
          >
            No chapters
          </div>
        )}
      </div>
    </div>
  )
}

export function GridView({ novelId, config, search }: GridViewProps) {
  const acts = useActs(novelId)
  const labels = useLabels(novelId) ?? []
  const activeActs = acts?.filter(a => !a.archived) ?? []

  if (acts === undefined) return null

  if (activeActs.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <EmptyState
          icon={<LayoutGrid />}
          title="No structure yet"
          description="Switch to Board view to add acts, chapters, and scenes."
        />
      </div>
    )
  }

  return (
    <div className="h-full overflow-auto">
      {/* sm+: horizontal scroll; mobile: vertical stack (1 column) */}
      <div className="flex flex-col gap-6 px-4 py-4 sm:w-max sm:min-w-full sm:flex-row sm:px-6">
        {activeActs.map(act => (
          <ActGroup
            key={act.id}
            act={act}
            novelId={novelId}
            config={config}
            labels={labels}
            search={search}
          />
        ))}
      </div>
    </div>
  )
}
