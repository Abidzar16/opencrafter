import { createFileRoute } from '@tanstack/react-router'
import { LayoutList, LayoutGrid, Kanban, Search } from 'lucide-react'
import { PlanBoard } from '@/components/plan/plan-board'
import { OutlineView } from '@/components/plan/outline-view'
import { GridView } from '@/components/plan/grid-view'
import { SceneDetailPanel } from '@/components/plan/scene-detail-panel'
import { CreateFromOutline } from '@/components/plan/create-from-outline'
import { CardConfigPopover, useCardConfig } from '@/components/plan/card-config'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useUIStore, type PlanView } from '@/stores/ui-store'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/novel/$novelId/plan')({
  component: PlanPage,
})

const VIEW_TABS: { key: PlanView; label: string; icon: React.ReactNode }[] = [
  { key: 'board', label: 'Board', icon: <Kanban className="h-3.5 w-3.5" /> },
  { key: 'outline', label: 'Outline', icon: <LayoutList className="h-3.5 w-3.5" /> },
  { key: 'grid', label: 'Grid', icon: <LayoutGrid className="h-3.5 w-3.5" /> },
]

function PlanPage() {
  const { novelId } = Route.useParams()
  const { planView, setPlanView, planSearch, setPlanSearch } = useUIStore()
  const [cardConfig, updateCardConfig] = useCardConfig()

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Plan toolbar */}
      <div className="flex shrink-0 items-center gap-2 border-b border-border px-4 py-2">
        {/* View switcher */}
        <div className="flex items-center gap-0.5 rounded-md border border-border p-0.5">
          {VIEW_TABS.map(tab => (
            <Button
              key={tab.key}
              variant={planView === tab.key ? 'secondary' : 'ghost'}
              size="sm"
              className={cn('h-7 gap-1.5 text-xs px-2', planView === tab.key && 'shadow-sm')}
              onClick={() => setPlanView(tab.key)}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
            </Button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-64">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search scenes…"
            value={planSearch}
            onChange={e => setPlanSearch(e.target.value)}
            className="h-8 pl-7 text-sm"
          />
        </div>

        <div className="ml-auto">
          {planView === 'grid' && (
            <CardConfigPopover config={cardConfig} onUpdate={updateCardConfig} />
          )}
        </div>
      </div>

      {/* Main view area */}
      <div className="flex-1 overflow-auto">
        {planView === 'board' && <PlanBoard novelId={novelId} />}
        {planView === 'outline' && <OutlineView novelId={novelId} search={planSearch} />}
        {planView === 'grid' && (
          <GridView novelId={novelId} config={cardConfig} search={planSearch} />
        )}
      </div>

      {/* Create from Outline panel (all views) */}
      <div className="shrink-0">
        <CreateFromOutline novelId={novelId} />
      </div>

      {/* Scene detail panel (sheet overlay) */}
      <SceneDetailPanel novelId={novelId} />
    </div>
  )
}
