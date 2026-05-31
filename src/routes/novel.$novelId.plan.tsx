import { createFileRoute } from '@tanstack/react-router'
import { PlanBoard } from '@/components/plan/plan-board'

export const Route = createFileRoute('/novel/$novelId/plan')({
  component: PlanPage,
})

function PlanPage() {
  const { novelId } = Route.useParams()
  return <PlanBoard novelId={novelId} />
}
