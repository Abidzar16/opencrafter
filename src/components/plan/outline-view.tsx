import { useState } from 'react'
import { ChevronDown, ChevronRight, BookOpen, ExternalLink } from 'lucide-react'
import { useActs, useChaptersByAct, useScenesByChapter, useUpdateScene } from '@/lib/db/hooks'
import { useEditorStore } from '@/stores/editor-store'
import { Textarea } from '@/components/ui/textarea'
import { EmptyState } from '@/components/ui/empty-state'
import { cn } from '@/lib/utils'
import type { Act, Chapter, Scene } from '@/types'

interface OutlineViewProps {
  novelId: string
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

interface OutlineSceneProps {
  scene: Scene
  search: string
}

function OutlineScene({ scene, search }: OutlineSceneProps) {
  const [beatsOpen, setBeatsOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [summary, setSummary] = useState(scene.summary ?? '')
  const updateScene = useUpdateScene()
  const { setActiveScene } = useEditorStore()

  if (!sceneMatchesSearch(scene, search)) return null

  function handleSummaryBlur() {
    setEditing(false)
    if (summary !== scene.summary) {
      updateScene(scene.id, { summary })
    }
  }

  return (
    <div className="group/scene ml-6 border-l border-border pl-3 py-0.5">
      <div className="flex items-start gap-1.5 rounded-md px-1 py-1 hover:bg-muted/30">
        <button
          className={cn(
            'mt-0.5 shrink-0 text-muted-foreground/50 hover:text-muted-foreground',
            scene.beats.length === 0 && 'invisible',
          )}
          onClick={() => setBeatsOpen(v => !v)}
          aria-label={beatsOpen ? 'Collapse beats' : 'Expand beats'}
        >
          {beatsOpen ? (
            <ChevronDown className="h-3.5 w-3.5" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5" />
          )}
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-medium truncate">{scene.title}</span>
            {scene.wordCount > 0 && (
              <span className="text-xs text-muted-foreground shrink-0">{scene.wordCount}w</span>
            )}
          </div>

          {/* Inline summary edit */}
          {editing ? (
            <Textarea
              className="mt-1 min-h-[60px] text-xs resize-none"
              value={summary}
              autoFocus
              onChange={e => setSummary(e.target.value)}
              onBlur={handleSummaryBlur}
            />
          ) : (
            <p
              className={cn(
                'mt-0.5 text-xs text-muted-foreground cursor-text',
                !scene.summary && 'italic text-muted-foreground/50',
              )}
              onClick={() => {
                setSummary(scene.summary ?? '')
                setEditing(true)
              }}
            >
              {scene.summary || 'Click to add summary…'}
            </p>
          )}

          {/* Beat list (read-only, expandable) */}
          {beatsOpen && scene.beats.length > 0 && (
            <ol className="mt-1.5 space-y-0.5 list-decimal list-inside pl-1">
              {scene.beats.map(beat => (
                <li key={beat.id} className="text-xs text-muted-foreground">
                  {beat.text}
                </li>
              ))}
            </ol>
          )}
        </div>

        <button
          className="shrink-0 opacity-0 group-hover/scene:opacity-100 text-muted-foreground hover:text-foreground transition-opacity"
          onClick={() => setActiveScene(scene.id)}
          aria-label="Open scene details"
          title="Open scene details"
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}

interface OutlineChapterProps {
  chapter: Chapter
  search: string
}

function OutlineChapter({ chapter, search }: OutlineChapterProps) {
  const [collapsed, setCollapsed] = useState(false)
  const scenes = useScenesByChapter(chapter.id)
  const activeScenes = scenes?.filter(s => !s.archived) ?? []

  const hasMatch = !search || activeScenes.some(s => sceneMatchesSearch(s, search))
  if (!hasMatch) return null

  return (
    <div className="ml-4 border-l border-border pl-3">
      <button
        className="flex w-full items-center gap-1.5 rounded-md px-1 py-1 text-left hover:bg-muted/30"
        onClick={() => setCollapsed(v => !v)}
      >
        {collapsed ? (
          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        )}
        <span className="text-sm font-medium">{chapter.title}</span>
        {chapter.subtitle && (
          <span className="text-xs text-muted-foreground italic truncate">— {chapter.subtitle}</span>
        )}
        <span className="ml-auto text-xs text-muted-foreground shrink-0">{activeScenes.length}s</span>
      </button>

      {!collapsed && (
        <div className="py-0.5">
          {activeScenes.map(scene => (
            <OutlineScene key={scene.id} scene={scene} search={search} />
          ))}
        </div>
      )}
    </div>
  )
}

interface OutlineActProps {
  act: Act
  search: string
}

function OutlineAct({ act, search }: OutlineActProps) {
  const [collapsed, setCollapsed] = useState(false)
  const chapters = useChaptersByAct(act.id)
  const activeChapters = chapters?.filter(c => !c.archived) ?? []

  return (
    <div className="mb-2">
      <button
        className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left hover:bg-muted/30"
        onClick={() => setCollapsed(v => !v)}
      >
        {collapsed ? (
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        )}
        <span className="text-sm font-semibold">{act.title}</span>
        <span className="ml-auto text-xs text-muted-foreground shrink-0">{activeChapters.length}ch</span>
      </button>

      {!collapsed && (
        <div className="py-0.5">
          {activeChapters.map(chapter => (
            <OutlineChapter key={chapter.id} chapter={chapter} search={search} />
          ))}
        </div>
      )}
    </div>
  )
}

export function OutlineView({ novelId, search }: OutlineViewProps) {
  const acts = useActs(novelId)
  const activeActs = acts?.filter(a => !a.archived) ?? []

  if (acts === undefined) return null

  if (activeActs.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <EmptyState
          icon={<BookOpen />}
          title="No structure yet"
          description="Switch to Board view to add acts, chapters, and scenes."
        />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-4">
      {activeActs.map(act => (
        <OutlineAct key={act.id} act={act} search={search} />
      ))}
    </div>
  )
}
