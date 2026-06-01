import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AIConnectionsTab } from '@/components/settings/AIConnectionsTab'
import { ModelCollectionsTab } from '@/components/settings/ModelCollectionsTab'
import { PromptLibraryTab } from '@/components/settings/PromptLibraryTab'
import { DefaultsTab } from '@/components/settings/DefaultsTab'
import { Settings } from 'lucide-react'
import type { AccountDefaults } from '@/components/settings/DefaultsTab'

const DEFAULTS_KEY = 'opencrafter:account-defaults'

function loadDefaults(): AccountDefaults {
  try {
    const raw = localStorage.getItem(DEFAULTS_KEY)
    return raw ? (JSON.parse(raw) as AccountDefaults) : {}
  } catch {
    return {}
  }
}

function saveDefaults(d: AccountDefaults) {
  localStorage.setItem(DEFAULTS_KEY, JSON.stringify(d))
}

export const Route = createFileRoute('/settings')({
  component: SettingsPage,
})

function SettingsPage() {
  const [defaults, setDefaults] = useState<AccountDefaults>(loadDefaults)

  function handleDefaultsChange(next: AccountDefaults) {
    setDefaults(next)
    saveDefaults(next)
  }

  return (
    <div className="h-screen flex flex-col">
      <div className="shrink-0 px-8 pt-6 pb-0">
        <div className="mb-4 flex items-center gap-3">
          <Settings className="text-muted-foreground h-6 w-6" />
          <h1 className="text-2xl font-bold">Settings</h1>
        </div>

        <Tabs defaultValue="ai-connections" className="flex flex-col h-full">
          <TabsList className="justify-start">
            <TabsTrigger value="ai-connections">AI Connections</TabsTrigger>
            <TabsTrigger value="model-collections">Model Collections</TabsTrigger>
            <TabsTrigger value="prompt-library">Prompt Library</TabsTrigger>
            <TabsTrigger value="defaults">Defaults</TabsTrigger>
          </TabsList>

          <div className="flex-1 min-h-0 pt-6 overflow-hidden">
            <TabsContent value="ai-connections" className="mt-0 h-full overflow-y-auto">
              <div className="max-w-3xl">
                <AIConnectionsTab />
              </div>
            </TabsContent>

            <TabsContent value="model-collections" className="mt-0 h-full overflow-y-auto">
              <div className="max-w-3xl">
                <ModelCollectionsTab />
              </div>
            </TabsContent>

            <TabsContent value="prompt-library" className="mt-0 h-full overflow-hidden">
              <div className="h-full border rounded-lg overflow-hidden">
                <PromptLibraryTab />
              </div>
            </TabsContent>

            <TabsContent value="defaults" className="mt-0 h-full overflow-y-auto">
              <div className="max-w-2xl">
                <DefaultsTab defaults={defaults} onChange={handleDefaultsChange} />
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  )
}
