import { useState, useRef, useMemo } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useActs, useChaptersByAct, useScenes, useUpdateScene } from '@/lib/db/hooks'
import { useCodexEntries } from '@/lib/db/hooks'
import { useLabels } from '@/lib/db/hooks'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { EmptyState } from '@/components/ui/empty-state'
import { TableProperties } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CodexType } from '@/types'
import type { Scene, CodexEntry, Label } from '@/types'

type RowType = 'codex' | 'pov' | 'labels' | 'subplots'

interface MatrixViewProps {
  novelId: string
}

const LABEL_COL_WIDTH = 180
const CELL_WIDTH = 120
const ROW_HEIGHT = 36
const HEADER_HEIGHT = 52

export function MatrixView({ novelId }: MatrixViewProps) {
  const [rowType, setRowType] = useState<RowType>('codex')

  const acts = useActs(novelId) ?? []
  const allScenes = useScenes(novelId) ?? []
  const codexEntries = useCodexEntries(novelId) ?? []
  const labels = useLabels(novelId) ?? []
  const updateScene = useUpdateScene()

  // Flatten acts/chapters to get ordered scenes
  // (useScenes returns by novelId+order which is per-scene order, not cross-chapter)
  // Use acts → chapters → scenes for ordered traversal
  const { orderedScenes } = useOrderedScenes(novelId, allScenes, acts)

  const rows = useMemo((): MatrixRow[] => {
    if (rowType === 'codex') {
      return codexEntries
        .filter(e => e.type !== CodexType.Subplot)
        .map(e => ({ id: e.id, label: e.name, type: 'codex', entry: e }))
    }
    if (rowType === 'subplots') {
      return codexEntries
        .filter(e => e.type === CodexType.Subplot)
        .map(e => ({ id: e.id, label: e.name, type: 'subplot', entry: e }))
    }
    if (rowType === 'pov') {
      return [{ id: 'pov', label: 'POV Character', type: 'pov' }]
    }
    if (rowType === 'labels') {
      return labels.map(l => ({ id: l.id, label: l.name, type: 'label', labelObj: l }))
    }
    return []
  }, [rowType, codexEntries, labels])

  const scrollRef = useRef<HTMLDivElement>(null)

  const colVirtualizer = useVirtualizer({
    count: orderedScenes.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => CELL_WIDTH,
    horizontal: true,
    overscan: 5,
  })

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 5,
  })

  if (orderedScenes.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <EmptyState
          icon={<TableProperties className="h-8 w-8" />}
          title="No scenes yet"
          description="Create acts, chapters, and scenes in Board or Outline view first."
        />
      </div>
    )
  }

  const totalWidth = LABEL_COL_WIDTH + colVirtualizer.getTotalSize()
  const totalHeight = HEADER_HEIGHT + rowVirtualizer.getTotalSize()

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Toolbar */}
      <div className="flex shrink-0 items-center gap-2 border-b px-4 py-2">
        <span className="text-muted-foreground text-sm">Rows:</span>
        <Select value={rowType} onValueChange={v => setRowType(v as RowType)}>
          <SelectTrigger className="h-7 w-44 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="codex">Codex Entries</SelectItem>
            <SelectItem value="subplots">Subplots</SelectItem>
            <SelectItem value="pov">POV</SelectItem>
            <SelectItem value="labels">Labels</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-muted-foreground ml-auto text-xs">
          {orderedScenes.length} scenes · {rows.length} rows
        </span>
      </div>

      {/* Matrix grid */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-auto"
        style={{ position: 'relative' }}
      >
        {/* Total size placeholder */}
        <div style={{ width: totalWidth, height: totalHeight, position: 'relative' }}>
          {/* Frozen header row + frozen label column intersection */}
          <div
            className="bg-background border-border sticky left-0 top-0 z-20 flex items-center border-b border-r px-3"
            style={{ width: LABEL_COL_WIDTH, height: HEADER_HEIGHT, position: 'sticky' }}
          />

          {/* Scene header (sticky top, scrolls horizontally) */}
          <div
            className="bg-background border-border sticky top-0 z-10 border-b"
            style={{
              position: 'absolute',
              top: 0,
              left: LABEL_COL_WIDTH,
              height: HEADER_HEIGHT,
              width: colVirtualizer.getTotalSize(),
            }}
          >
            {colVirtualizer.getVirtualItems().map(vCol => {
              const scene = orderedScenes[vCol.index]
              return (
                <div
                  key={vCol.key}
                  className="border-border absolute flex flex-col justify-center overflow-hidden border-r px-2"
                  style={{
                    left: vCol.start,
                    width: vCol.size,
                    height: HEADER_HEIGHT,
                    top: 0,
                  }}
                >
                  <span className="truncate text-xs font-medium">{scene.title}</span>
                  <span className="text-muted-foreground text-[10px]">{scene.wordCount}w</span>
                </div>
              )
            })}
          </div>

          {/* Row labels (sticky left) */}
          <div
            className="bg-background sticky left-0 z-10"
            style={{
              position: 'absolute',
              top: HEADER_HEIGHT,
              left: 0,
              width: LABEL_COL_WIDTH,
              height: rowVirtualizer.getTotalSize(),
            }}
          >
            {rowVirtualizer.getVirtualItems().map(vRow => {
              const row = rows[vRow.index]
              return (
                <div
                  key={vRow.key}
                  className="border-border bg-background absolute flex items-center border-b border-r px-3"
                  style={{ top: vRow.start, height: vRow.size, width: LABEL_COL_WIDTH }}
                >
                  <span className="truncate text-sm font-medium">{row.label}</span>
                </div>
              )
            })}
          </div>

          {/* Cells */}
          <div
            style={{
              position: 'absolute',
              top: HEADER_HEIGHT,
              left: LABEL_COL_WIDTH,
              width: colVirtualizer.getTotalSize(),
              height: rowVirtualizer.getTotalSize(),
            }}
          >
            {rowVirtualizer.getVirtualItems().map(vRow => {
              const row = rows[vRow.index]
              return colVirtualizer.getVirtualItems().map(vCol => {
                const scene = orderedScenes[vCol.index]
                return (
                  <MatrixCell
                    key={`${vRow.key}-${vCol.key}`}
                    row={row}
                    scene={scene}
                    labels={labels}
                    codexEntries={codexEntries}
                    rowType={rowType}
                    style={{
                      position: 'absolute',
                      left: vCol.start,
                      top: vRow.start,
                      width: vCol.size,
                      height: vRow.size,
                    }}
                    onUpdate={data => updateScene(scene.id, data)}
                  />
                )
              })
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

// --- Types ---

interface MatrixRow {
  id: string
  label: string
  type: string
  entry?: CodexEntry
  labelObj?: Label
}

// --- Cell ---

function MatrixCell({
  row,
  scene,
  labels,
  codexEntries,
  rowType,
  style,
  onUpdate,
}: {
  row: MatrixRow
  scene: Scene
  labels: Label[]
  codexEntries: CodexEntry[]
  rowType: RowType
  style: React.CSSProperties
  onUpdate: (data: Partial<Scene>) => void
}) {
  if (rowType === 'codex' || rowType === 'subplots') {
    const active = scene.codexAssociations.includes(row.id)
    return (
      <button
        className={cn(
          'border-border absolute flex items-center justify-center border-b border-r transition-colors',
          active ? 'bg-primary/10 hover:bg-primary/20' : 'hover:bg-muted',
        )}
        style={style}
        onClick={() => {
          const next = active
            ? scene.codexAssociations.filter(id => id !== row.id)
            : [...scene.codexAssociations, row.id]
          onUpdate({ codexAssociations: next })
        }}
      >
        {active && <span className="bg-primary h-2.5 w-2.5 rounded-full" />}
      </button>
    )
  }

  if (rowType === 'pov') {
    const povEntry = codexEntries.find(e => e.id === scene.povCharacterId)
    const chars = codexEntries.filter(e => e.type === CodexType.Character)
    return (
      <div className="border-border absolute flex items-center justify-center border-b border-r" style={style}>
        <Select
          value={scene.povCharacterId ?? 'none'}
          onValueChange={v => onUpdate({ povCharacterId: v === 'none' ? undefined : v })}
        >
          <SelectTrigger className="h-6 w-full border-0 bg-transparent px-1 text-[11px] shadow-none focus:ring-0">
            <SelectValue placeholder="—">
              {povEntry ? <span className="truncate">{povEntry.name}</span> : <span className="text-muted-foreground">—</span>}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            {chars.map(c => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    )
  }

  if (rowType === 'labels') {
    const active = scene.labels.includes(row.id)
    const label = row.labelObj
    return (
      <button
        className={cn(
          'border-border absolute flex items-center justify-center border-b border-r transition-colors',
          active ? 'hover:bg-muted/50' : 'hover:bg-muted',
        )}
        style={style}
        onClick={() => {
          const next = active
            ? scene.labels.filter(id => id !== row.id)
            : [...scene.labels, row.id]
          onUpdate({ labels: next })
        }}
      >
        {active && label && (
          <Badge
            className="h-4 px-1 text-[10px]"
            style={{ backgroundColor: label.color, color: '#fff', border: 'none' }}
          >
            {label.name.slice(0, 6)}
          </Badge>
        )}
      </button>
    )
  }

  return <div className="border-border absolute border-b border-r" style={style} />
}

// --- Ordered scenes helper ---

function useOrderedScenes(novelId: string, allScenes: Scene[], acts: ReturnType<typeof useActs>) {
  const chapters0 = useChaptersByAct((acts ?? [])[0]?.id)
  const chapters1 = useChaptersByAct((acts ?? [])[1]?.id)
  const chapters2 = useChaptersByAct((acts ?? [])[2]?.id)
  const chapters3 = useChaptersByAct((acts ?? [])[3]?.id)
  const chapters4 = useChaptersByAct((acts ?? [])[4]?.id)
  const chapters5 = useChaptersByAct((acts ?? [])[5]?.id)
  const chapters6 = useChaptersByAct((acts ?? [])[6]?.id)
  const chapters7 = useChaptersByAct((acts ?? [])[7]?.id)
  const chapters8 = useChaptersByAct((acts ?? [])[8]?.id)
  const chapters9 = useChaptersByAct((acts ?? [])[9]?.id)

  return useMemo(() => {
    const sceneMap = new Map(allScenes.map(s => [s.id, s]))
    const allChapters = [
      ...(chapters0 ?? []),
      ...(chapters1 ?? []),
      ...(chapters2 ?? []),
      ...(chapters3 ?? []),
      ...(chapters4 ?? []),
      ...(chapters5 ?? []),
      ...(chapters6 ?? []),
      ...(chapters7 ?? []),
      ...(chapters8 ?? []),
      ...(chapters9 ?? []),
    ]
    const chapterMap = new Map(allChapters.map(c => [c.id, c]))

    const orderedScenes: Scene[] = []
    for (const act of (acts ?? []).sort((a, b) => a.order - b.order)) {
      const actChapters = allChapters
        .filter(c => c.actId === act.id)
        .sort((a, b) => a.order - b.order)
      for (const chapter of actChapters) {
        const chScenes = allScenes
          .filter(s => s.chapterId === chapter.id)
          .sort((a, b) => a.order - b.order)
        orderedScenes.push(...chScenes)
      }
    }
    return { orderedScenes, chapterMap }
  }, [allScenes, acts, chapters0, chapters1, chapters2, chapters3, chapters4, chapters5, chapters6, chapters7, chapters8, chapters9])
}
