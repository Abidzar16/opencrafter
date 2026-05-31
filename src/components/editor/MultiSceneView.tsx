import { useEffect } from 'react'
import { useScenesByChapter } from '@/lib/db/hooks'
import { Editor } from './Editor'
import { EmptyState } from '@/components/ui/empty-state'
import { PenLine } from 'lucide-react'

export type SceneDividerStyle = 'line' | 'asterisks' | 'blank' | 'custom'

interface MultiSceneViewProps {
  chapterId: string
  dividerStyle?: SceneDividerStyle
  dividerCustomText?: string
  activeSceneId: string | null
  onSceneActive?: (sceneId: string) => void
  onWordCountChange?: (sceneId: string, count: number) => void
}

function SceneDivider({ style, customText }: { style: SceneDividerStyle; customText?: string }) {
  if (style === 'blank') {
    return <div className="my-8" />
  }
  if (style === 'line') {
    return <hr className="my-8 border-border" />
  }
  if (style === 'asterisks') {
    return (
      <div className="my-8 text-center text-muted-foreground select-none">* * *</div>
    )
  }
  // custom
  return (
    <div className="my-8 text-center text-muted-foreground select-none">
      {customText ?? '—'}
    </div>
  )
}

export function MultiSceneView({
  chapterId,
  dividerStyle = 'asterisks',
  dividerCustomText,
  onSceneActive,
  onWordCountChange,
}: MultiSceneViewProps) {
  const scenes = useScenesByChapter(chapterId) ?? []
  const activeScenes = scenes.filter(s => !s.archived)

  // Auto-select first scene when chapter changes
  useEffect(() => {
    if (activeScenes.length > 0) {
      onSceneActive?.(activeScenes[0].id)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chapterId])

  if (activeScenes.length === 0) {
    return (
      <EmptyState
        icon={<PenLine />}
        title="No scenes yet"
        description="Add scenes in the Plan module to start writing."
      />
    )
  }

  return (
    <div className="mx-auto w-full max-w-[70ch] px-4 py-8">
      {activeScenes.map((scene, index) => (
        <div key={scene.id} id={`scene-${scene.id}`}>
          {/* Scene label */}
          <div
            className="mb-2 cursor-pointer text-xs font-medium text-muted-foreground hover:text-foreground"
            onClick={() => onSceneActive?.(scene.id)}
          >
            Scene {index + 1}{scene.title ? ` — ${scene.title}` : ''}
          </div>

          <Editor
            sceneId={scene.id}
            onWordCountChange={count => onWordCountChange?.(scene.id, count)}
          />

          {index < activeScenes.length - 1 && (
            <SceneDivider style={dividerStyle} customText={dividerCustomText} />
          )}
        </div>
      ))}
    </div>
  )
}
