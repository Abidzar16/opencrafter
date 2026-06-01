import { useState } from 'react'
import { Plus, Trash2, Pencil, AlertTriangle, ChevronDown, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { toast } from 'sonner'
import {
  useModelConfigs,
  useCreateModelConfig,
  useUpdateModelConfig,
  useDeleteModelConfig,
  useApiKeys,
} from '@/lib/db/hooks'
import { Provider } from '@/types'
import type { ModelConfig, ApiKey } from '@/types'

const PROVIDER_OPTIONS = [
  { value: Provider.OpenAI, label: 'OpenAI' },
  { value: Provider.Anthropic, label: 'Anthropic' },
  { value: Provider.Groq, label: 'Groq' },
  { value: Provider.OpenRouter, label: 'OpenRouter' },
  { value: Provider.Ollama, label: 'Ollama (local)' },
  { value: Provider.LmStudio, label: 'LM Studio (local)' },
  { value: Provider.Generic, label: 'Generic (OpenAI-compatible)' },
]

// Well-known model suggestions per provider
const MODEL_SUGGESTIONS: Record<string, string[]> = {
  [Provider.OpenAI]: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'],
  [Provider.Anthropic]: [
    'claude-opus-4-8',
    'claude-sonnet-4-6',
    'claude-haiku-4-5-20251001',
  ],
  [Provider.Groq]: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768'],
  [Provider.OpenRouter]: ['openai/gpt-4o', 'anthropic/claude-sonnet-4', 'meta-llama/llama-3.3-70b-instruct'],
}

// ─── Form ───────────────────────────────────────────────────────────────────

interface ModelConfigFormProps {
  initial?: ModelConfig
  apiKeys: ApiKey[]
  open: boolean
  onClose: () => void
}

function ModelConfigForm({ initial, apiKeys, open, onClose }: ModelConfigFormProps) {
  const create = useCreateModelConfig()
  const update = useUpdateModelConfig()

  const [name, setName] = useState(initial?.name ?? '')
  const [provider, setProvider] = useState<string>(initial?.provider ?? Provider.OpenAI)
  const [modelId, setModelId] = useState(initial?.modelId ?? '')
  const [apiKeyRef, setApiKeyRef] = useState(initial?.apiKeyRef ?? '')
  const [temperature, setTemperature] = useState(String(initial?.temperature ?? ''))
  const [topP, setTopP] = useState(String(initial?.topP ?? ''))
  const [maxTokens, setMaxTokens] = useState(String(initial?.maxTokens ?? ''))
  const [thinking, setThinking] = useState(initial?.thinking ?? false)
  const [thinkingBudget, setThinkingBudget] = useState(String(initial?.thinkingBudgetTokens ?? '8000'))
  const [saving, setSaving] = useState(false)

  const providerKeys = apiKeys.filter(k => k.provider === provider)
  const suggestions = MODEL_SUGGESTIONS[provider] ?? []
  const isEditing = !!initial

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Name required')
      return
    }
    if (!modelId.trim()) {
      toast.error('Model ID required')
      return
    }
    setSaving(true)
    try {
      const data: Omit<ModelConfig, 'id'> = {
        name: name.trim(),
        provider,
        modelId: modelId.trim(),
        apiKeyRef: apiKeyRef || undefined,
        temperature: temperature ? Number(temperature) : undefined,
        topP: topP ? Number(topP) : undefined,
        maxTokens: maxTokens ? Number(maxTokens) : undefined,
        thinking: thinking || undefined,
        thinkingBudgetTokens: thinking && thinkingBudget ? Number(thinkingBudget) : undefined,
      }
      if (isEditing) {
        await update(initial.id, data)
        toast.success('Model config updated')
      } else {
        await create(data)
        toast.success('Model config created')
      }
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit model config' : 'New model config'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1.5">
              <label className="text-sm font-medium">Name</label>
              <Input
                placeholder="e.g. GPT-4o Creative"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Provider</label>
              <Select value={provider} onValueChange={setProvider}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROVIDER_OPTIONS.map(p => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Model ID</label>
              <Input
                placeholder={suggestions[0] ?? 'model-id'}
                value={modelId}
                onChange={e => setModelId(e.target.value)}
                list={`model-suggestions-${provider}`}
              />
              <datalist id={`model-suggestions-${provider}`}>
                {suggestions.map(s => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            </div>

            <div className="col-span-2 space-y-1.5">
              <label className="text-sm font-medium">API Key</label>
              <Select value={apiKeyRef} onValueChange={setApiKeyRef}>
                <SelectTrigger>
                  <SelectValue placeholder="Select API key…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None (local provider)</SelectItem>
                  {providerKeys.map(k => (
                    <SelectItem key={k.id} value={k.id}>
                      ••••{k.key.slice(-4)}
                      {k.baseUrl ? ` — ${k.baseUrl}` : ''}
                    </SelectItem>
                  ))}
                  {providerKeys.length === 0 && (
                    <SelectItem value="" disabled>
                      No {provider} keys configured
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Temperature</label>
              <Input
                type="number"
                min="0"
                max="2"
                step="0.05"
                placeholder="default"
                value={temperature}
                onChange={e => setTemperature(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Top P</label>
              <Input
                type="number"
                min="0"
                max="1"
                step="0.05"
                placeholder="default"
                value={topP}
                onChange={e => setTopP(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Max tokens</label>
              <Input
                type="number"
                min="1"
                placeholder="default"
                value={maxTokens}
                onChange={e => setMaxTokens(e.target.value)}
              />
            </div>
          </div>

          {provider === Provider.Anthropic && (
            <div className="space-y-3 rounded-lg border p-3">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={thinking}
                  onChange={e => setThinking(e.target.checked)}
                  className="h-4 w-4"
                />
                <span className="text-sm font-medium">Enable extended thinking</span>
              </label>
              {thinking && (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Thinking budget (tokens)</label>
                  <Input
                    type="number"
                    min="1024"
                    max="32000"
                    value={thinkingBudget}
                    onChange={e => setThinkingBudget(e.target.value)}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {isEditing ? 'Save' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Config row ──────────────────────────────────────────────────────────────

function ConfigRow({
  config,
  apiKeys,
  onEdit,
}: {
  config: ModelConfig
  apiKeys: ApiKey[]
  onEdit: (c: ModelConfig) => void
}) {
  const deleteConfig = useDeleteModelConfig()
  const [expanded, setExpanded] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const referencedKey = apiKeys.find(k => k.id === config.apiKeyRef)
  const missingKey = config.apiKeyRef && !referencedKey

  const handleDelete = async () => {
    await deleteConfig(config.id)
    toast.success('Model config deleted')
  }

  return (
    <div className="rounded-lg border">
      <div className="flex items-center gap-3 px-3 py-2">
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={() => setExpanded(v => !v)}
        >
          {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        </Button>
        <span className="flex-1 text-sm font-medium">{config.name}</span>
        <Badge variant="outline" className="text-muted-foreground text-xs">
          {config.provider}
        </Badge>
        <code className="text-muted-foreground text-xs">{config.modelId}</code>
        {missingKey && (
          <span title="Referenced API key not found">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </span>
        )}
        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => onEdit(config)}>
          <Pencil className="h-3 w-3" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="text-destructive hover:text-destructive h-7 w-7 p-0"
          onClick={() => setConfirmOpen(true)}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>

      {expanded && (
        <div className="border-t px-4 py-3">
          <dl className="text-muted-foreground grid grid-cols-2 gap-x-4 gap-y-1 text-xs sm:grid-cols-3">
            {config.temperature !== undefined && (
              <>
                <dt>Temperature</dt>
                <dd>{config.temperature}</dd>
              </>
            )}
            {config.topP !== undefined && (
              <>
                <dt>Top P</dt>
                <dd>{config.topP}</dd>
              </>
            )}
            {config.maxTokens !== undefined && (
              <>
                <dt>Max tokens</dt>
                <dd>{config.maxTokens}</dd>
              </>
            )}
            {config.thinking && (
              <>
                <dt>Thinking</dt>
                <dd>enabled ({config.thinkingBudgetTokens ?? 8000} tokens)</dd>
              </>
            )}
            <dt>API key</dt>
            <dd>
              {missingKey ? (
                <span className="text-amber-500">Missing (ref: {config.apiKeyRef})</span>
              ) : referencedKey ? (
                `••••${referencedKey.key.slice(-4)}`
              ) : (
                'None (local)'
              )}
            </dd>
          </dl>
        </div>
      )}

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Delete model config"
        description={`Delete "${config.name}"? Prompts referencing it will fall back to defaults.`}
        confirmLabel="Delete"
        destructive
        onConfirm={handleDelete}
      />
    </div>
  )
}

// ─── Main tab ────────────────────────────────────────────────────────────────

export function ModelCollectionsTab() {
  const configs = useModelConfigs() ?? []
  const apiKeys = useApiKeys() ?? []
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<ModelConfig | undefined>()

  const openEdit = (c: ModelConfig) => {
    setEditing(c)
    setDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Model Collections</h2>
          <p className="text-muted-foreground text-sm">
            Saved model configurations used by prompts and generation.
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => {
            setEditing(undefined)
            setDialogOpen(true)
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          New model config
        </Button>
      </div>

      {configs.length === 0 ? (
        <div className="text-muted-foreground rounded-lg border border-dashed p-8 text-center text-sm">
          No model configs yet. Add one to start generating.
        </div>
      ) : (
        <div className="space-y-2">
          {configs.map(c => (
            <ConfigRow key={c.id} config={c} apiKeys={apiKeys} onEdit={openEdit} />
          ))}
        </div>
      )}

      <ModelConfigForm
        open={dialogOpen}
        initial={editing}
        apiKeys={apiKeys}
        onClose={() => {
          setDialogOpen(false)
          setEditing(undefined)
        }}
      />
    </div>
  )
}
