import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { usePrompts, usePromptPersonas } from '@/lib/db/hooks'
import { PromptType } from '@/types'

const NONE = '__none__'

interface DefaultSelectorProps {
  label: string
  description?: string
  type: PromptType
  value: string | undefined
  onChange: (id: string | undefined) => void
}

function DefaultSelector({ label, description, type, value, onChange }: DefaultSelectorProps) {
  const allPrompts = usePrompts() ?? []
  const typed = allPrompts.filter(p => p.type === type)

  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
      <Select
        value={value ?? NONE}
        onValueChange={v => onChange(v === NONE ? undefined : v)}
      >
        <SelectTrigger>
          <SelectValue placeholder="None" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NONE}>None</SelectItem>
          {typed.map(p => (
            <SelectItem key={p.id} value={p.id}>
              {p.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

interface DefaultsTabProps {
  /** Account-level defaults stored in app settings (localStorage) */
  defaults: AccountDefaults
  onChange: (next: AccountDefaults) => void
}

export interface AccountDefaults {
  defaultBeatCompletionPromptId?: string
  defaultSummarizationPromptId?: string
  defaultTextReplacementPromptId?: string
  defaultChatPromptId?: string
  defaultPersonaId?: string
}

export function DefaultsTab({ defaults, onChange }: DefaultsTabProps) {
  const personas = usePromptPersonas() ?? []

  return (
    <div className="space-y-6 p-4">
      <div>
        <h3 className="font-semibold text-sm">Account-level Defaults</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          These apply globally. Individual novels can override them in Novel Settings.
        </p>
      </div>

      <div className="space-y-4">
        <DefaultSelector
          label="Beat Completion Prompt"
          description="Default prompt used when generating prose from a beat."
          type={PromptType.BeatCompletion}
          value={defaults.defaultBeatCompletionPromptId}
          onChange={id => onChange({ ...defaults, defaultBeatCompletionPromptId: id })}
        />

        <DefaultSelector
          label="Summarization Prompt"
          description="Default prompt used for scene summarization."
          type={PromptType.Summarization}
          value={defaults.defaultSummarizationPromptId}
          onChange={id => onChange({ ...defaults, defaultSummarizationPromptId: id })}
        />

        <DefaultSelector
          label="Text Replacement Prompt"
          description="Default prompt used for the Rewrite selection feature."
          type={PromptType.TextReplacement}
          value={defaults.defaultTextReplacementPromptId}
          onChange={id => onChange({ ...defaults, defaultTextReplacementPromptId: id })}
        />

        <DefaultSelector
          label="Workshop Chat Prompt"
          description="Default prompt used in the Chat module."
          type={PromptType.WorkshopChat}
          value={defaults.defaultChatPromptId}
          onChange={id => onChange({ ...defaults, defaultChatPromptId: id })}
        />
      </div>

      <Separator />

      <div className="space-y-1.5">
        <Label>Default AI Persona</Label>
        <p className="text-xs text-muted-foreground">
          Applied to all novels unless overridden in Novel Settings.
        </p>
        <Select
          value={defaults.defaultPersonaId ?? NONE}
          onValueChange={v =>
            onChange({ ...defaults, defaultPersonaId: v === NONE ? undefined : v })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="None" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE}>None</SelectItem>
            {personas.map(p => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
