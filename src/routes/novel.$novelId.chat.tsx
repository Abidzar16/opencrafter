import { createFileRoute } from '@tanstack/react-router'
import { ChatView } from '@/components/chat/ChatView'

export const Route = createFileRoute('/novel/$novelId/chat')({
  component: ChatPage,
})

function ChatPage() {
  const { novelId } = Route.useParams()
  return <ChatView novelId={novelId} />
}
