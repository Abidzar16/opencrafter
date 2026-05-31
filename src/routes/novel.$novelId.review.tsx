import { createFileRoute } from '@tanstack/react-router'
import { EmptyState } from '@/components/ui/empty-state'
import { ClipboardCheck } from 'lucide-react'

export const Route = createFileRoute('/novel/$novelId/review')({
  component: ReviewPage,
})

function ReviewPage() {
  return (
    <EmptyState
      icon={<ClipboardCheck />}
      title="Review"
      description="Review mode is coming soon."
    />
  )
}
