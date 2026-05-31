import { useScenesByChapter, useSceneContent } from '@/lib/db/hooks'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

interface StoryTimelineProps {
  chapterId: string | null
  activeSceneId: string | null
  onSceneClick: (sceneId: string) => void
}

// Fetch word count for a single scene from its scene_content
function useSceneWordCount(sceneId: string): number {
  const content = useSceneContent(sceneId)
  if (!content?.content) return 0
  // Rough word count from Tiptap JSON: extract all text
  const text = extractText(content.content as Record<string, unknown>)
  return text.trim() ? text.trim().split(/\s+/).length : 0
}

function extractText(node: Record<string, unknown>): string {
  if (node.type === 'text') return (node.text as string) ?? ''
  if (!node.content) return ''
  return (node.content as Record<string, unknown>[]).map(extractText).join(' ')
}

function TimelineScene({
  sceneId,
  title,
  index,
  active,
  weight,
  onClick,
}: {
  sceneId: string
  title: string
  index: number
  active: boolean
  weight: number
  onClick: () => void
}) {
  const wc = useSceneWordCount(sceneId)
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          className={cn(
            'w-full min-h-[8px] rounded-sm transition-all',
            active
              ? 'bg-primary'
              : 'bg-muted hover:bg-muted-foreground/30',
          )}
          style={{ flex: weight || 1 }}
          onClick={onClick}
        />
      </TooltipTrigger>
      <TooltipContent side="left" className="max-w-[160px]">
        <p className="text-xs font-medium">
          Scene {index + 1}{title ? ` — ${title}` : ''}
        </p>
        <p className="text-muted-foreground text-xs">{wc.toLocaleString()} words</p>
      </TooltipContent>
    </Tooltip>
  )
}

export function StoryTimeline({ chapterId, activeSceneId, onSceneClick }: StoryTimelineProps) {
  const scenes = useScenesByChapter(chapterId ?? undefined) ?? []
  const activeScenes = scenes.filter(s => !s.archived)

  if (!chapterId || activeScenes.length === 0) return null

  return (
    <div className="flex w-5 shrink-0 flex-col gap-0.5 p-1 py-4">
      {activeScenes.map((scene, index) => (
        <TimelineScene
          key={scene.id}
          sceneId={scene.id}
          title={scene.title}
          index={index}
          active={scene.id === activeSceneId}
          weight={Math.max(scene.wordCount, 1)}
          onClick={() => {
            onSceneClick(scene.id)
            // Scroll to scene element
            document.getElementById(`scene-${scene.id}`)?.scrollIntoView({
              behavior: 'smooth',
              block: 'start',
            })
          }}
        />
      ))}
    </div>
  )
}
