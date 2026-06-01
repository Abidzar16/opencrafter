import { useState } from 'react'
import { Plus, Trash2, CheckCircle, XCircle, Loader2, Pencil, ExternalLink } from 'lucide-react'
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
  useApiKeys,
  useCreateApiKey,
  useUpdateApiKey,
  useDeleteApiKey,
} from '@/lib/db/hooks'
import { Provider } from '@/types'
import type { ApiKey } from '@/types'

interface ProviderMeta {
  provider: Provider
  label: string
  needsKey: boolean
  needsBaseUrl: boolean
  defaultBaseUrl?: string
  docsUrl?: string
}

const PROVIDERS: ProviderMeta[] = [
  {
    provider: Provider.OpenAI,
    label: 'OpenAI',
    needsKey: true,
    needsBaseUrl: false,
    docsUrl: 'https://platform.openai.com/api-keys',
  },
  {
    provider: Provider.Anthropic,
    label: 'Anthropic',
    needsKey: true,
    needsBaseUrl: false,
    docsUrl: 'https://console.anthropic.com/settings/keys',
  },
  {
    provider: Provider.Groq,
    label: 'Groq',
    needsKey: true,
    needsBaseUrl: false,
    docsUrl: 'https://console.groq.com/keys',
  },
  {
    provider: Provider.OpenRouter,
    label: 'OpenRouter',
    needsKey: true,
    needsBaseUrl: false,
    docsUrl: 'https://openrouter.ai/keys',
  },
  {
    provider: Provider.Ollama,
    label: 'Ollama (local)',
    needsKey: false,
    needsBaseUrl: true,
    defaultBaseUrl: 'http://localhost:11434',
  },
  {
    provider: Provider.LmStudio,
    label: 'LM Studio (local)',
    needsKey: false,
    needsBaseUrl: true,
    defaultBaseUrl: 'http://localhost:1234/v1',
  },
  {
    provider: Provider.Generic,
    label: 'Generic (OpenAI-compatible)',
    needsKey: true,
    needsBaseUrl: true,
  },
]

type TestStatus = 'idle' | 'testing' | 'ok' | 'error'

async function testConnection(
  provider: Provider,
  apiKey: string,
  baseUrl?: string,
): Promise<{ ok: boolean; message: string }> {
  try {
    const openaiBase = (url?: string) => url?.replace(/\/$/, '') ?? resolveDefaultBase(provider)

    if (provider === Provider.Ollama) {
      const base = (baseUrl ?? 'http://localhost:11434').replace(/\/$/, '')
      const res = await fetch(`${base}/api/tags`, { signal: AbortSignal.timeout(5000) })
      if (!res.ok) return { ok: false, message: `HTTP ${res.status}` }
      return { ok: true, message: 'Connected' }
    }

    if (provider === Provider.Anthropic) {
      const base = (baseUrl ?? 'https://api.anthropic.com').replace(/\/$/, '')
      const res = await fetch(`${base}/v1/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 1,
          messages: [{ role: 'user', content: 'Hi' }],
        }),
        signal: AbortSignal.timeout(10000),
      })
      if (res.status === 401) return { ok: false, message: 'Invalid API key' }
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        const msg = (err as Record<string, unknown>)?.['error']
        return { ok: false, message: typeof msg === 'object' ? JSON.stringify(msg) : `HTTP ${res.status}` }
      }
      return { ok: true, message: 'Connected' }
    }

    // OpenAI-compatible: list models
    const base = openaiBase(baseUrl)
    const res = await fetch(`${base}/models`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(8000),
    })
    if (res.status === 401) return { ok: false, message: 'Invalid API key' }
    if (!res.ok) return { ok: false, message: `HTTP ${res.status}` }
    return { ok: true, message: 'Connected' }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    if (msg.includes('Failed to fetch') || msg.includes('CORS'))
      return { ok: false, message: 'Network error (possible CORS block)' }
    return { ok: false, message: msg }
  }
}

function resolveDefaultBase(provider: Provider): string {
  switch (provider) {
    case Provider.Groq:
      return 'https://api.groq.com/openai/v1'
    case Provider.OpenRouter:
      return 'https://openrouter.ai/api/v1'
    default:
      return 'https://api.openai.com/v1'
  }
}

// ─── Key row ───────────────────────────────────────────────────────────────

function KeyRow({
  apiKey,
  meta,
  onEdit,
}: {
  apiKey: ApiKey
  meta: ProviderMeta
  onEdit: (key: ApiKey) => void
}) {
  const deleteKey = useDeleteApiKey()
  const [testStatus, setTestStatus] = useState<TestStatus>('idle')
  const [testMsg, setTestMsg] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)

  const handleTest = async () => {
    setTestStatus('testing')
    setTestMsg('')
    const result = await testConnection(apiKey.provider, apiKey.key, apiKey.baseUrl)
    setTestStatus(result.ok ? 'ok' : 'error')
    setTestMsg(result.message)
  }

  const handleDelete = async () => {
    await deleteKey(apiKey.id)
    toast.success('Connection removed')
  }

  const displayValue = meta.needsKey
    ? `••••••••${apiKey.key.slice(-4)}`
    : (apiKey.baseUrl ?? '(no URL set)')

  return (
    <>
      <div className="flex items-center gap-3 rounded-lg border px-3 py-2">
        <code className="text-muted-foreground flex-1 truncate text-xs">{displayValue}</code>

        {testStatus === 'ok' && (
          <span className="flex items-center gap-1 text-xs text-green-600">
            <CheckCircle className="h-3 w-3" /> {testMsg}
          </span>
        )}
        {testStatus === 'error' && (
          <span className="flex items-center gap-1 text-xs text-red-500">
            <XCircle className="h-3 w-3" /> {testMsg}
          </span>
        )}

        <Button
          size="sm"
          variant="ghost"
          className="h-7 px-2 text-xs"
          onClick={handleTest}
          disabled={testStatus === 'testing'}
        >
          {testStatus === 'testing' ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            'Test'
          )}
        </Button>
        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => onEdit(apiKey)}>
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

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Delete connection"
        description={`Remove this ${meta.label} connection? Any model configs referencing it will show a warning.`}
        confirmLabel="Delete"
        destructive
        onConfirm={handleDelete}
      />
    </>
  )
}

// ─── Add / Edit dialog ──────────────────────────────────────────────────────

interface EditDialogProps {
  initial?: ApiKey
  defaultProvider?: Provider
  open: boolean
  onClose: () => void
}

function EditDialog({ initial, defaultProvider, open, onClose }: EditDialogProps) {
  const createKey = useCreateApiKey()
  const updateKey = useUpdateApiKey()

  const [provider, setProvider] = useState<Provider>(
    initial?.provider ?? defaultProvider ?? Provider.OpenAI,
  )
  const [key, setKey] = useState(initial?.key ?? '')
  const [baseUrl, setBaseUrl] = useState(initial?.baseUrl ?? '')
  const [testStatus, setTestStatus] = useState<TestStatus>('idle')
  const [testMsg, setTestMsg] = useState('')
  const [saving, setSaving] = useState(false)

  const meta = PROVIDERS.find(p => p.provider === provider)!
  const isEditing = !!initial

  const handleTest = async () => {
    setTestStatus('testing')
    setTestMsg('')
    const result = await testConnection(provider, key, baseUrl || undefined)
    setTestStatus(result.ok ? 'ok' : 'error')
    setTestMsg(result.message)
  }

  const handleSave = async () => {
    if (meta.needsKey && !key.trim()) {
      toast.error('API key required')
      return
    }
    if (meta.needsBaseUrl && provider !== Provider.Generic && provider !== Provider.OpenAI && !baseUrl.trim()) {
      // For local providers, use default if blank
    }
    setSaving(true)
    try {
      const effectiveBaseUrl = baseUrl.trim() || meta.defaultBaseUrl
      if (isEditing) {
        await updateKey(initial.id, {
          key: meta.needsKey ? key.trim() : '',
          baseUrl: effectiveBaseUrl,
        })
        toast.success('Connection updated')
      } else {
        await createKey({
          provider,
          key: meta.needsKey ? key.trim() : '',
          baseUrl: effectiveBaseUrl,
        })
        toast.success('Connection added')
      }
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit connection' : 'Add connection'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {!isEditing && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Provider</label>
              <Select value={provider} onValueChange={v => setProvider(v as Provider)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROVIDERS.map(p => (
                    <SelectItem key={p.provider} value={p.provider}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {meta.needsKey && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">API Key</label>
                {meta.docsUrl && (
                  <a
                    href={meta.docsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs"
                  >
                    Get key <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
              <Input
                type="password"
                placeholder={isEditing ? '(unchanged)' : 'sk-...'}
                value={key}
                onChange={e => setKey(e.target.value)}
                autoComplete="off"
              />
            </div>
          )}

          {(meta.needsBaseUrl || meta.defaultBaseUrl) && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                Base URL{!meta.needsBaseUrl && ' (optional)'}
              </label>
              <Input
                type="url"
                placeholder={meta.defaultBaseUrl ?? 'https://...'}
                value={baseUrl}
                onChange={e => setBaseUrl(e.target.value)}
              />
              {meta.defaultBaseUrl && !baseUrl && (
                <p className="text-muted-foreground text-xs">
                  Defaults to {meta.defaultBaseUrl}
                </p>
              )}
            </div>
          )}

          {(testStatus === 'ok' || testStatus === 'error') && (
            <div
              className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm ${
                testStatus === 'ok'
                  ? 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300'
                  : 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300'
              }`}
            >
              {testStatus === 'ok' ? (
                <CheckCircle className="h-4 w-4 shrink-0" />
              ) : (
                <XCircle className="h-4 w-4 shrink-0" />
              )}
              {testMsg}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleTest} disabled={testStatus === 'testing'}>
            {testStatus === 'testing' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Test connection
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? 'Save' : 'Add'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Main tab ───────────────────────────────────────────────────────────────

export function AIConnectionsTab() {
  const allKeys = useApiKeys() ?? []
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<ApiKey | undefined>()
  const [addingForProvider, setAddingForProvider] = useState<Provider | undefined>()

  const keysByProvider = allKeys.reduce<Record<string, ApiKey[]>>((acc, k) => {
    ;(acc[k.provider] ??= []).push(k)
    return acc
  }, {})

  const openAdd = (provider?: Provider) => {
    setEditing(undefined)
    setAddingForProvider(provider)
    setDialogOpen(true)
  }

  const openEdit = (key: ApiKey) => {
    setEditing(key)
    setAddingForProvider(undefined)
    setDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">AI Connections</h2>
          <p className="text-muted-foreground text-sm">
            API keys are stored locally in your browser. They never leave your device.
          </p>
        </div>
        <Button size="sm" onClick={() => openAdd()}>
          <Plus className="mr-2 h-4 w-4" />
          Add connection
        </Button>
      </div>

      <div className="space-y-4">
        {PROVIDERS.map(meta => {
          const keys = keysByProvider[meta.provider] ?? []
          return (
            <div key={meta.provider} className="rounded-lg border p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{meta.label}</span>
                  {keys.length > 0 ? (
                    <Badge variant="secondary" className="text-xs">
                      {keys.length} configured
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground text-xs">
                      Not configured
                    </Badge>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2 text-xs"
                  onClick={() => openAdd(meta.provider)}
                >
                  <Plus className="mr-1 h-3 w-3" />
                  Add
                </Button>
              </div>

              {keys.length > 0 && (
                <div className="space-y-2">
                  {keys.map(k => (
                    <KeyRow key={k.id} apiKey={k} meta={meta} onEdit={openEdit} />
                  ))}
                </div>
              )}

              {keys.length === 0 && (
                <p className="text-muted-foreground text-xs">
                  {meta.needsKey
                    ? 'No API key configured.'
                    : `No endpoint configured. Default: ${meta.defaultBaseUrl}`}
                </p>
              )}
            </div>
          )
        })}
      </div>

      <EditDialog
        open={dialogOpen}
        initial={editing}
        defaultProvider={addingForProvider}
        onClose={() => {
          setDialogOpen(false)
          setEditing(undefined)
          setAddingForProvider(undefined)
        }}
      />
    </div>
  )
}
