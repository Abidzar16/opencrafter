import { useState, useEffect } from 'react'
import { GripVertical, Plus, Trash2, ChevronDown } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { usePromptComponents, useModelConfigs } from '@/lib/db/hooks'
import type { Prompt, PromptInput, PromptInputType, ContextBlockConfig } from '@/types'
import { PromptType } from '@/types'

interface PromptEditorProps {
  prompt: Prompt
  onChange: (updates: Partial<Prompt>) => void
}

const PROMPT_TYPE_LABELS: Record<PromptType, string> = {
  [PromptType.BeatCompletion]: 'Beat Completion',
  [PromptType.Summarization]: 'Summarization',
  [PromptType.TextReplacement]: 'Text Replacement',
  [PromptType.WorkshopChat]: 'Workshop Chat',
}

const CONTEXT_BLOCK_LABELS: Record<ContextBlockConfig['blockType'], string> = {
  codex: 'Codex Context',
  scene_content: 'Scene Content',
  scene_summary: 'Scene Summary',
  beats: 'Beat List',
  prior_text: 'Prior Text',
  snippets: 'Snippets',
}

const PLACEHOLDER_VARS = [
  { key: '{{context}}', label: 'Full context section' },
  { key: '{{codex_context}}', label: 'Codex context only' },
  { key: '{{selected_text}}', label: 'Selected / source text' },
  { key: '{{prior_text}}', label: 'Text before cursor' },
  { key: '{{scene_id}}', label: 'Scene ID' },
  { key: '{{novel_id}}', label: 'Novel ID' },
]

// ─── General Tab ─────────────────────────────────────────────────────────────

function GeneralTab({ prompt, onChange }: PromptEditorProps) {
  const modelConfigs = useModelConfigs() ?? []

  const assignedIds: string[] = (prompt as Prompt & { modelConfigIds?: string[] }).modelConfigIds ?? []

  function toggleModelConfig(id: string) {
    const next = assignedIds.includes(id)
      ? assignedIds.filter(x => x !== id)
      : [...assignedIds, id]
    onChange({ modelConfigIds: next } as Partial<Prompt>)
  }

  return (
    <div className="space-y-4 p-4">
      <div className="space-y-1.5">
        <Label htmlFor="prompt-name">Name</Label>
        <Input
          id="prompt-name"
          value={prompt.name}
          onChange={e => onChange({ name: e.target.value })}
          disabled={prompt.readOnly}
          placeholder="Prompt name"
        />
      </div>

      <div className="space-y-1.5">
        <Label>Type</Label>
        <div className="flex items-center gap-2">
          <Badge variant="outline">{PROMPT_TYPE_LABELS[prompt.type]}</Badge>
          <span className="text-xs text-muted-foreground">locked after creation</span>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="prompt-description">Description</Label>
        <Textarea
          id="prompt-description"
          value={prompt.description ?? ''}
          onChange={e => onChange({ description: e.target.value })}
          disabled={prompt.readOnly}
          placeholder="Shown to users in the generation UI…"
          rows={2}
          className="resize-none text-sm"
        />
      </div>

      <div className="space-y-1.5">
        <Label>Assigned Model Configs</Label>
        <p className="text-xs text-muted-foreground">
          Limit which model configs are offered when using this prompt.
        </p>
        {modelConfigs.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            No model configs. Add them in Model Collections.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2 mt-1">
            {modelConfigs.map(mc => {
              const active = assignedIds.includes(mc.id)
              return (
                <button
                  key={mc.id}
                  type="button"
                  onClick={() => !prompt.readOnly && toggleModelConfig(mc.id)}
                  className={[
                    'px-2.5 py-1 rounded-full text-xs font-medium border transition-colors',
                    active
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-border hover:border-primary/50',
                    prompt.readOnly ? 'opacity-50 cursor-default' : 'cursor-pointer',
                  ].join(' ')}
                >
                  {mc.name}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {prompt.readOnly && (
        <p className="text-xs text-muted-foreground bg-muted rounded px-3 py-2">
          This is a built-in prompt. Duplicate it to make changes.
        </p>
      )}
    </div>
  )
}

// ─── Instructions Tab ─────────────────────────────────────────────────────────

function InstructionsTab({ prompt, onChange }: PromptEditorProps) {
  const components = usePromptComponents() ?? []
  const [insertOpen, setInsertOpen] = useState(false)

  function insertAtCursor(text: string) {
    const el = document.getElementById('prompt-instructions') as HTMLTextAreaElement | null
    if (!el) {
      onChange({ instructions: prompt.instructions + text })
      return
    }
    const start = el.selectionStart
    const end = el.selectionEnd
    const next =
      prompt.instructions.slice(0, start) + text + prompt.instructions.slice(end)
    onChange({ instructions: next })
    requestAnimationFrame(() => {
      el.focus()
      el.setSelectionRange(start + text.length, start + text.length)
    })
  }

  return (
    <div className="space-y-3 p-4">
      <div className="flex items-center justify-between">
        <Label htmlFor="prompt-instructions">System Prompt</Label>
        <div className="flex gap-2">
          <Popover open={insertOpen} onOpenChange={setInsertOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-7 text-xs" disabled={prompt.readOnly}>
                Insert variable
                <ChevronDown className="ml-1 h-3 w-3" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-64 p-1">
              <p className="text-xs font-medium text-muted-foreground px-2 py-1">Variables</p>
              {PLACEHOLDER_VARS.map(v => (
                <button
                  key={v.key}
                  type="button"
                  className="w-full text-left px-2 py-1.5 text-xs rounded hover:bg-accent"
                  onClick={() => { insertAtCursor(v.key); setInsertOpen(false) }}
                >
                  <span className="font-mono text-primary">{v.key}</span>
                  <span className="ml-2 text-muted-foreground">{v.label}</span>
                </button>
              ))}
              {components.length > 0 && (
                <>
                  <Separator className="my-1" />
                  <p className="text-xs font-medium text-muted-foreground px-2 py-1">Components</p>
                  {components.map(c => (
                    <button
                      key={c.id}
                      type="button"
                      className="w-full text-left px-2 py-1.5 text-xs rounded hover:bg-accent"
                      onClick={() => {
                        insertAtCursor(`{{component:${c.name}}}`)
                        setInsertOpen(false)
                      }}
                    >
                      <span className="font-mono text-primary">{`{{component:${c.name}}}`}</span>
                    </button>
                  ))}
                </>
              )}
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <Textarea
        id="prompt-instructions"
        value={prompt.instructions}
        onChange={e => onChange({ instructions: e.target.value })}
        disabled={prompt.readOnly}
        placeholder="Write your system prompt here. Use {{variable}} for placeholders…"
        rows={16}
        className="font-mono text-sm resize-none"
      />

      <p className="text-xs text-muted-foreground">
        Use <code className="bg-muted px-1 rounded">{'{{context}}'}</code> to embed the full
        assembled context, or individual block variables. If omitted, context is appended automatically.
      </p>
    </div>
  )
}

// ─── Context Tab ──────────────────────────────────────────────────────────────

function ContextTab({ prompt, onChange }: PromptEditorProps) {
  const blocks = [...prompt.contextConfig].sort((a, b) => a.order - b.order)

  function toggleBlock(blockType: ContextBlockConfig['blockType']) {
    const next = prompt.contextConfig.map(b =>
      b.blockType === blockType ? { ...b, enabled: !b.enabled } : b,
    )
    onChange({ contextConfig: next })
  }

  function moveBlock(blockType: ContextBlockConfig['blockType'], direction: 'up' | 'down') {
    const sorted = [...prompt.contextConfig].sort((a, b) => a.order - b.order)
    const idx = sorted.findIndex(b => b.blockType === blockType)
    if (direction === 'up' && idx === 0) return
    if (direction === 'down' && idx === sorted.length - 1) return

    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    const newOrder = sorted.map((b, i) => {
      if (i === idx) return { ...b, order: sorted[swapIdx].order }
      if (i === swapIdx) return { ...b, order: sorted[idx].order }
      return b
    })
    onChange({ contextConfig: newOrder })
  }

  return (
    <div className="p-4 space-y-3">
      <p className="text-xs text-muted-foreground">
        Choose which context blocks to include and their order. Enabled blocks are assembled and
        injected into the prompt.
      </p>

      <div className="border rounded-md divide-y">
        {blocks.map((block, idx) => (
          <div key={block.blockType} className="flex items-center gap-3 px-3 py-2.5">
            <div className="flex flex-col gap-0.5">
              <button
                type="button"
                onClick={() => !prompt.readOnly && moveBlock(block.blockType, 'up')}
                disabled={idx === 0 || prompt.readOnly}
                className="h-3 w-3 text-muted-foreground hover:text-foreground disabled:opacity-30"
                aria-label="Move up"
              >
                ▲
              </button>
              <button
                type="button"
                onClick={() => !prompt.readOnly && moveBlock(block.blockType, 'down')}
                disabled={idx === blocks.length - 1 || prompt.readOnly}
                className="h-3 w-3 text-muted-foreground hover:text-foreground disabled:opacity-30"
                aria-label="Move down"
              >
                ▼
              </button>
            </div>

            <GripVertical className="h-4 w-4 text-muted-foreground/50 shrink-0" />

            <span className="flex-1 text-sm">{CONTEXT_BLOCK_LABELS[block.blockType]}</span>

            <Switch
              checked={block.enabled}
              onCheckedChange={() => !prompt.readOnly && toggleBlock(block.blockType)}
              disabled={prompt.readOnly}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Inputs Tab ───────────────────────────────────────────────────────────────

function InputsTab({ prompt, onChange }: PromptEditorProps) {
  const [editingInput, setEditingInput] = useState<PromptInput | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  function openNew() {
    setEditingInput({
      id: crypto.randomUUID(),
      key: '',
      label: '',
      type: 'text',
      defaultValue: '',
      required: false,
    })
    setDialogOpen(true)
  }

  function openEdit(input: PromptInput) {
    setEditingInput({ ...input })
    setDialogOpen(true)
  }

  function saveInput(input: PromptInput) {
    const existing = prompt.inputs.find(i => i.id === input.id)
    const next = existing
      ? prompt.inputs.map(i => (i.id === input.id ? input : i))
      : [...prompt.inputs, input]
    onChange({ inputs: next })
    setDialogOpen(false)
  }

  function deleteInput(id: string) {
    onChange({ inputs: prompt.inputs.filter(i => i.id !== id) })
  }

  const INPUT_TYPE_LABELS: Record<PromptInputType, string> = {
    text: 'Short text',
    textarea: 'Long text',
    dropdown: 'Dropdown',
    toggle: 'Toggle',
  }

  return (
    <div className="p-4 space-y-3">
      <p className="text-xs text-muted-foreground">
        Define user-facing input fields. Each field is exposed as{' '}
        <code className="bg-muted px-1 rounded">{'{{key}}'}</code> in the instructions.
      </p>

      {prompt.inputs.length === 0 ? (
        <div className="text-center py-8 text-sm text-muted-foreground">
          No input fields defined.
        </div>
      ) : (
        <div className="border rounded-md divide-y">
          {prompt.inputs.map(input => (
            <div key={input.id} className="flex items-center gap-3 px-3 py-2.5">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{input.label || '(unlabeled)'}</span>
                  <Badge variant="outline" className="text-xs">
                    {INPUT_TYPE_LABELS[input.type]}
                  </Badge>
                  {input.required && (
                    <Badge variant="secondary" className="text-xs">required</Badge>
                  )}
                </div>
                <span className="text-xs text-muted-foreground font-mono">{'{{' + input.key + '}}'}</span>
              </div>
              {!prompt.readOnly && (
                <div className="flex gap-1 shrink-0">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(input)}>
                    <GripVertical className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={() => deleteInput(input.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {!prompt.readOnly && (
        <Button variant="outline" size="sm" onClick={openNew}>
          <Plus className="mr-2 h-4 w-4" />
          Add input field
        </Button>
      )}

      <InputFieldDialog
        open={dialogOpen}
        input={editingInput}
        onSave={saveInput}
        onClose={() => setDialogOpen(false)}
      />
    </div>
  )
}

interface InputFieldDialogProps {
  open: boolean
  input: PromptInput | null
  onSave: (input: PromptInput) => void
  onClose: () => void
}

function InputFieldDialog({ open, input, onSave, onClose }: InputFieldDialogProps) {
  const [form, setForm] = useState<PromptInput>({
    id: '',
    key: '',
    label: '',
    type: 'text',
    defaultValue: '',
    required: false,
  })
  const [optionsText, setOptionsText] = useState('')

  useEffect(() => {
    if (input) {
      setForm(input)
      setOptionsText(input.options?.map(o => `${o.label}=${o.value}`).join('\n') ?? '')
    }
  }, [input])

  function handleSave() {
    if (!form.key.trim() || !form.label.trim()) return
    const options =
      form.type === 'dropdown'
        ? optionsText
            .split('\n')
            .map(line => line.trim())
            .filter(Boolean)
            .map(line => {
              const [label, value] = line.split('=')
              return { label: label?.trim() ?? line, value: value?.trim() ?? label?.trim() ?? line }
            })
        : undefined
    onSave({ ...form, key: form.key.trim(), label: form.label.trim(), options })
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{form.id && form.key ? 'Edit Input Field' : 'New Input Field'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="input-label">Label</Label>
              <Input
                id="input-label"
                value={form.label}
                onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
                placeholder="e.g. Writing tone"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="input-key">Key (placeholder)</Label>
              <Input
                id="input-key"
                value={form.key}
                onChange={e =>
                  setForm(f => ({ ...f, key: e.target.value.replace(/\s+/g, '_') }))
                }
                placeholder="e.g. writing_tone"
                className="font-mono"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Type</Label>
            <Select
              value={form.type}
              onValueChange={v => setForm(f => ({ ...f, type: v as PromptInputType }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">Short text</SelectItem>
                <SelectItem value="textarea">Long text</SelectItem>
                <SelectItem value="dropdown">Dropdown</SelectItem>
                <SelectItem value="toggle">Toggle</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {form.type === 'dropdown' && (
            <div className="space-y-1.5">
              <Label htmlFor="input-options">Options (one per line, Label=value)</Label>
              <Textarea
                id="input-options"
                value={optionsText}
                onChange={e => setOptionsText(e.target.value)}
                rows={4}
                className="font-mono text-sm resize-none"
                placeholder={'Formal=formal\nCasual=casual\nPoetic=poetic'}
              />
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="input-default">Default value</Label>
            <Input
              id="input-default"
              value={form.defaultValue ?? ''}
              onChange={e => setForm(f => ({ ...f, defaultValue: e.target.value }))}
              placeholder="Optional"
            />
          </div>

          <div className="flex items-center gap-2">
            <Switch
              id="input-required"
              checked={form.required}
              onCheckedChange={v => setForm(f => ({ ...f, required: v }))}
            />
            <Label htmlFor="input-required">Required</Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={!form.key.trim() || !form.label.trim()}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Model Settings Tab ───────────────────────────────────────────────────────

function ModelSettingsTab({ prompt, onChange }: PromptEditorProps) {
  const settings = prompt.modelSettings

  return (
    <div className="p-4 space-y-4">
      <p className="text-xs text-muted-foreground">
        Override model collection defaults for this specific prompt. Leave blank to use the
        model collection&apos;s settings.
      </p>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="ms-temperature">Temperature</Label>
          <Input
            id="ms-temperature"
            type="number"
            min={0}
            max={2}
            step={0.1}
            value={settings.temperature ?? ''}
            onChange={e =>
              onChange({
                modelSettings: {
                  ...settings,
                  temperature: e.target.value === '' ? undefined : Number(e.target.value),
                },
              })
            }
            disabled={prompt.readOnly}
            placeholder="e.g. 0.8"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="ms-max-tokens">Max tokens</Label>
          <Input
            id="ms-max-tokens"
            type="number"
            min={1}
            step={1}
            value={settings.maxTokens ?? ''}
            onChange={e =>
              onChange({
                modelSettings: {
                  ...settings,
                  maxTokens: e.target.value === '' ? undefined : Number(e.target.value),
                },
              })
            }
            disabled={prompt.readOnly}
            placeholder="e.g. 2000"
          />
        </div>
      </div>
    </div>
  )
}

// ─── Main PromptEditor ────────────────────────────────────────────────────────

export function PromptEditor({ prompt, onChange }: PromptEditorProps) {
  return (
    <Tabs defaultValue="general" className="flex flex-col h-full">
      <TabsList className="mx-4 mt-3 shrink-0 justify-start">
        <TabsTrigger value="general">General</TabsTrigger>
        <TabsTrigger value="instructions">Instructions</TabsTrigger>
        <TabsTrigger value="context">Context</TabsTrigger>
        <TabsTrigger value="inputs">Inputs</TabsTrigger>
        <TabsTrigger value="model">Model Settings</TabsTrigger>
      </TabsList>

      <div className="flex-1 overflow-y-auto">
        <TabsContent value="general" className="mt-0">
          <GeneralTab prompt={prompt} onChange={onChange} />
        </TabsContent>
        <TabsContent value="instructions" className="mt-0">
          <InstructionsTab prompt={prompt} onChange={onChange} />
        </TabsContent>
        <TabsContent value="context" className="mt-0">
          <ContextTab prompt={prompt} onChange={onChange} />
        </TabsContent>
        <TabsContent value="inputs" className="mt-0">
          <InputsTab prompt={prompt} onChange={onChange} />
        </TabsContent>
        <TabsContent value="model" className="mt-0">
          <ModelSettingsTab prompt={prompt} onChange={onChange} />
        </TabsContent>
      </div>
    </Tabs>
  )
}
