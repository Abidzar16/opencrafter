import { useState, useEffect, useCallback, useMemo } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import type { Editor as TiptapEditor } from '@tiptap/core'
import { useChapters } from '@/lib/db/hooks'
import { useEditorStore } from '@/stores/editor-store'
import { useUIStore } from '@/stores/ui-store'
import { ChapterSwitcher } from '@/components/editor/ChapterSwitcher'
import { MultiSceneView } from '@/components/editor/MultiSceneView'
import { EditorToolbar } from '@/components/editor/EditorToolbar'
import { SceneInfoPanel } from '@/components/editor/SceneInfoPanel'
import { StoryTimeline } from '@/components/editor/StoryTimeline'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { PanelRight, PanelRightClose } from 'lucide-react'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/novel/$novelId/write')({
  component: WritePage,
})

function WritePage() {
  const { novelId } = Route.useParams()
  const rawChapters = useChapters(novelId)
  const chapters = useMemo(() => rawChapters ?? [], [rawChapters])

  const { activeChapterId, setActiveChapter, activeSceneId, setActiveScene } = useEditorStore()
  const { focusMode, setFocusMode } = useUIStore()

  const [wordCounts, setWordCounts] = useState<Record<string, number>>({})
  const [infoPanelOpen, setInfoPanelOpen] = useState(true)
  const [activeEditor] = useState<TiptapEditor | null>(null)

  // Auto-select first chapter on load
  useEffect(() => {
    const active = chapters.find(c => !c.archived)
    if (!activeChapterId && active) {
      setActiveChapter(active.id)
    }
  }, [chapters, activeChapterId, setActiveChapter])

  // Esc exits focus mode
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && focusMode) setFocusMode(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [focusMode, setFocusMode])

  const handleWordCountChange = useCallback((sceneId: string, count: number) => {
    setWordCounts(prev => ({ ...prev, [sceneId]: count }))
  }, [])

  const handleSceneActive = useCallback(
    (sceneId: string) => {
      setActiveScene(sceneId)
    },
    [setActiveScene],
  )

  const handleChapterChange = useCallback(
    (chapterId: string) => {
      setActiveChapter(chapterId)
      setActiveScene(null)
    },
    [setActiveChapter, setActiveScene],
  )

  return (
    <div className={cn('flex h-full flex-col', focusMode && 'bg-background')}>
      {/* Format toolbar (hidden in focus mode) */}
      {!focusMode && (
        <EditorToolbar
          editor={activeEditor}
          focusMode={focusMode}
          onToggleFocusMode={() => setFocusMode(!focusMode)}
        />
      )}

      {/* Main content row */}
      <div className="flex flex-1 overflow-hidden">
        {/* Editor area */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Chapter switcher bar */}
          {!focusMode && (
            <div className="bg-background/80 border-border flex h-10 shrink-0 items-center gap-2 border-b px-4 backdrop-blur">
              <ChapterSwitcher
                novelId={novelId}
                activeChapterId={activeChapterId}
                onChapterChange={handleChapterChange}
              />

              <div className="flex-1" />

              {/* Info panel toggle */}
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setInfoPanelOpen(v => !v)}
              >
                {infoPanelOpen ? (
                  <PanelRightClose className="h-3.5 w-3.5" />
                ) : (
                  <PanelRight className="h-3.5 w-3.5" />
                )}
              </Button>
            </div>
          )}

          {/* Scrollable editor content */}
          <div className="flex flex-1 overflow-hidden">
            <div
              className={cn(
                'flex-1 overflow-y-auto',
                focusMode && 'mx-auto max-w-[75ch] px-8 py-16',
              )}
            >
              {activeChapterId ? (
                <MultiSceneView
                  chapterId={activeChapterId}
                  activeSceneId={activeSceneId}
                  onSceneActive={handleSceneActive}
                  onWordCountChange={handleWordCountChange}
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <p className="text-muted-foreground text-sm">
                    {chapters.length === 0
                      ? 'Add acts and chapters in the Plan module first.'
                      : 'Select a chapter to start writing.'}
                  </p>
                </div>
              )}
            </div>

            {/* Story timeline */}
            {!focusMode && (
              <StoryTimeline
                chapterId={activeChapterId}
                activeSceneId={activeSceneId}
                onSceneClick={handleSceneActive}
              />
            )}
          </div>
        </div>

        {/* Right info panel */}
        {!focusMode && infoPanelOpen && (
          <>
            <Separator orientation="vertical" />
            <div className="w-64 shrink-0 overflow-hidden">
              <SceneInfoPanel
                novelId={novelId}
                sceneId={activeSceneId}
                wordCounts={wordCounts}
                chapterId={activeChapterId}
              />
            </div>
          </>
        )}
      </div>

      {/* Focus mode: minimal toolbar strip at top */}
      {focusMode && (
        <EditorToolbar
          editor={activeEditor}
          focusMode={focusMode}
          onToggleFocusMode={() => setFocusMode(false)}
        />
      )}
    </div>
  )
}
