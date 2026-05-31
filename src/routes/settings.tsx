import { createFileRoute } from '@tanstack/react-router'
import { EmptyState } from '@/components/ui/empty-state'
import { Settings } from 'lucide-react'

export const Route = createFileRoute('/settings')({
  component: SettingsPage,
})

function SettingsPage() {
  return (
    <div className="container mx-auto max-w-3xl py-12">
      <EmptyState
        icon={<Settings />}
        title="Settings"
        description="API keys, model collections, and prompt library coming in Phase 4–5."
      />
    </div>
  )
}
