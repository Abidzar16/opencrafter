import { useEffect, useRef, useState } from 'react'
import { useScenesByChapter, useTrackedEntries } from '@/lib/db/hooks'
import { Editor } from './Editor'
import { EmptyState } from '@/components/ui/empty-state'
import { useCodexHoverCard } from '@/components/codex/CodexHoverCard'
import { ProgressionPicker } from '@/components/codex/ProgressionPicker'
import { ProgressionBadge } from '@/components/codex/ProgressionBadge'
import { QuickCreateCodexDialog } from '@/components/codex/QuickCreateCodexDialog'
import { GenerationPanel } from './GenerationPanel'
import {
  OPEN_PROGRESSION_PICKER_EVENT,
  OPEN_QUICK_CREATE_CODEX_EVENT,
  OPEN_GENERATION_PANEL_EVENT,
  type GenerationPanelEventDetail,
} from './extensions/slash-menu'
import { useUIStore } from '@/stores/ui-store'
import type { Editor as TiptapEditor } from '@tiptap/core'
import { PenLine } from 'lucide-react'
import type { useEditor } from '@tiptap/react'

export type SceneDividerStyle = 'line' | 'asterisks' | 'blank' | 'custom'

interface MultiSceneViewProps {
  novelId: string
  chapterId: string
  dividerStyle?: SceneDividerStyle
  dividerCustomText?: string
  activeSceneId: string | null
  onSceneActive?: (sceneId: string) => void
  onWordCountChange?: (sceneId: string, count: number) => void
}

function SceneDivider({ style, customText }: { style: SceneDividerStyle; customText?: string }) {
  if (style === 'blank') return <div className="my-8" />
  if (style === 'line') return <hr className="border-border my-8" />
  if (style === 'asterisks') {
    return (
      <div className="text-muted-foreground my-8 select-none text-center">* * *</div>
    )
  }
  return (
    <div className="text-muted-foreground my-8 select-none text-center">
      {customText ?? '—'}
    </div>
  )
}

export function MultiSceneView({
  novelId,
  chapterId,
  dividerStyle = 'asterisks',
  dividerCustomText,
  onSceneActive,
  onWordCountChange,
}: MultiSceneViewProps) {
  const scenes = useScenesByChapter(chapterId) ?? []
  const activeScenes = scenes.filter(s => !s.archived)
  const trackedEntries = useTrackedEntries(novelId)
  const { setActivePanel } = useUIStore()
  const [activeSceneForProgression, setActiveSceneForProgression] = useState<string | null>(null)
  const [progressionPickerOpen, setProgressionPickerOpen] = useState(false)
  const [quickCreateOpen, setQuickCreateOpen] = useState(false)

  // Generation panel state
  const [generationPanelOpen, setGenerationPanelOpen] = useState(false)
  const [generationDetail, setGenerationDetail] = useState<GenerationPanelEventDetail | null>(null)
  // Map of sceneId → Tiptap editor instance (populated via onEditorReady)
  const editorsRef = useRef<Map<string, ReturnType<typeof useEditor>>>(new Map())

  // Open codex sidebar on entry click from hover card
  const openEntry = (id: string) => {
    setActivePanel('codex')
    void id
  }

  const hoverCard = useCodexHoverCard(openEntry)

  // Listen for slash menu "Codex Progression" command
  useEffect(() => {
    const handler = () => { setProgressionPickerOpen(true) }
    document.addEventListener(OPEN_PROGRESSION_PICKER_EVENT, handler)
    return () => document.removeEventListener(OPEN_PROGRESSION_PICKER_EVENT, handler)
  }, [])

  // Listen for slash menu "New Codex Entry" command
  useEffect(() => {
    const handler = () => { setQuickCreateOpen(true) }
    document.addEventListener(OPEN_QUICK_CREATE_CODEX_EVENT, handler)
    return () => document.removeEventListener(OPEN_QUICK_CREATE_CODEX_EVENT, handler)
  }, [])

  // Listen for generation panel open event
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<GenerationPanelEventDetail>).detail
      setGenerationDetail(detail)
      setGenerationPanelOpen(true)
    }
    document.addEventListener(OPEN_GENERATION_PANEL_EVENT, handler)
    return () => document.removeEventListener(OPEN_GENERATION_PANEL_EVENT, handler)
  }, [])

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
    <>
      {hoverCard}
      <div className="mx-auto w-full max-w-[70ch] px-4 py-8">
        {activeScenes.map((scene, index) => (
          <div
            key={scene.id}
            id={`scene-${scene.id}`}
            onClick={() => setActiveSceneForProgression(scene.id)}
          >
            <div
              className="text-muted-foreground hover:text-foreground mb-2 cursor-pointer text-xs font-medium"
              onClick={() => onSceneActive?.(scene.id)}
            >
              Scene {index + 1}{scene.title ? ` — ${scene.title}` : ''}
              <ProgressionBadge sceneId={scene.id} novelId={novelId} />
            </div>

            <Editor
              sceneId={scene.id}
              novelId={novelId}
              trackedEntries={trackedEntries}
              onWordCountChange={count => onWordCountChange?.(scene.id, count)}
              onEditorReady={ed => editorsRef.current.set(scene.id, ed)}
            />

            {index < activeScenes.length - 1 && (
              <SceneDivider style={dividerStyle} customText={dividerCustomText} />
            )}
          </div>
        ))}
      </div>

      {progressionPickerOpen && activeSceneForProgression && (
        <ProgressionPicker
          open={progressionPickerOpen}
          novelId={novelId}
          sceneId={activeSceneForProgression}
          onClose={() => setProgressionPickerOpen(false)}
        />
      )}

      <QuickCreateCodexDialog
        open={quickCreateOpen}
        novelId={novelId}
        sceneId={activeSceneForProgression}
        onClose={() => setQuickCreateOpen(false)}
      />

      {generationPanelOpen && generationDetail && (
        <GenerationPanel
          open={generationPanelOpen}
          onClose={() => {
            setGenerationPanelOpen(false)
            setGenerationDetail(null)
          }}
          novelId={novelId}
          sceneId={activeSceneForProgression ?? activeScenes[0]?.id ?? ''}
          mode={generationDetail.mode}
          sourceText={generationDetail.sourceText}
          editor={
            (activeSceneForProgression
              ? editorsRef.current.get(activeSceneForProgression)
              : editorsRef.current.values().next().value) as TiptapEditor | null
          }
          selectionRange={
            generationDetail.mode === 'replacement'
              ? { from: generationDetail.selectionFrom, to: generationDetail.selectionTo }
              : undefined
          }
        />
      )}
    </>
  )
}
