import { createFileRoute } from '@tanstack/react-router'
import { EmptyState } from '@/components/ui/empty-state'
import { MessageSquare } from 'lucide-react'

export const Route = createFileRoute('/novel/$novelId/chat')({
  component: ChatPage,
})

function ChatPage() {
  return (
    <EmptyState
      icon={<MessageSquare />}
      title="Workshop Chat"
      description="AI chat coming in Phase 6."
    />
  )
}
