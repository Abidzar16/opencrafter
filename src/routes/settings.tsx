import { createFileRoute } from '@tanstack/react-router'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AIConnectionsTab } from '@/components/settings/AIConnectionsTab'
import { ModelCollectionsTab } from '@/components/settings/ModelCollectionsTab'
import { Settings } from 'lucide-react'

export const Route = createFileRoute('/settings')({
  component: SettingsPage,
})

function SettingsPage() {
  return (
    <div className="container mx-auto max-w-3xl py-8">
      <div className="mb-6 flex items-center gap-3">
        <Settings className="text-muted-foreground h-6 w-6" />
        <h1 className="text-2xl font-bold">Settings</h1>
      </div>

      <Tabs defaultValue="ai-connections">
        <TabsList className="mb-6">
          <TabsTrigger value="ai-connections">AI Connections</TabsTrigger>
          <TabsTrigger value="model-collections">Model Collections</TabsTrigger>
          <TabsTrigger value="prompt-library" disabled>
            Prompt Library
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ai-connections">
          <AIConnectionsTab />
        </TabsContent>

        <TabsContent value="model-collections">
          <ModelCollectionsTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
