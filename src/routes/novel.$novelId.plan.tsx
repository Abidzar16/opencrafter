import { createFileRoute } from '@tanstack/react-router'
import { EmptyState } from '@/components/ui/empty-state'
import { LayoutGrid } from 'lucide-react'

export const Route = createFileRoute('/novel/$novelId/plan')({
  component: PlanPage,
})

function PlanPage() {
  return (
    <EmptyState
      icon={<LayoutGrid />}
      title="Plan"
      description="Story structure board coming in Phase 1."
    />
  )
}
