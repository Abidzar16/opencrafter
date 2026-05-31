import { createFileRoute } from '@tanstack/react-router'
import { EmptyState } from '@/components/ui/empty-state'
import { PenLine } from 'lucide-react'

export const Route = createFileRoute('/novel/$novelId/write')({
  component: WritePage,
})

function WritePage() {
  return (
    <EmptyState
      icon={<PenLine />}
      title="Write"
      description="Tiptap editor coming in Phase 2."
    />
  )
}
