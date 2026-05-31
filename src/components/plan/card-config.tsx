import { useState, useCallback } from 'react'
import { Settings2 } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'

const STORAGE_KEY = 'opencrafter:plan-card-config'

export interface CardConfig {
  width: number
  height: number
  showWordCount: boolean
  showPov: boolean
  showLabels: boolean
  showSummary: boolean
}

const DEFAULT_CONFIG: CardConfig = {
  width: 240,
  height: 160,
  showWordCount: true,
  showPov: true,
  showLabels: true,
  showSummary: true,
}

function loadConfig(): CardConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return { ...DEFAULT_CONFIG, ...JSON.parse(raw) }
  } catch {
    // ignore
  }
  return DEFAULT_CONFIG
}

function saveConfig(config: CardConfig) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
  } catch {
    // ignore
  }
}

export function useCardConfig(): [CardConfig, (patch: Partial<CardConfig>) => void] {
  const [config, setConfig] = useState<CardConfig>(loadConfig)

  const update = useCallback((patch: Partial<CardConfig>) => {
    setConfig(prev => {
      const next = { ...prev, ...patch }
      saveConfig(next)
      return next
    })
  }, [])

  return [config, update]
}

interface SliderRowProps {
  label: string
  value: number
  min: number
  max: number
  unit: string
  onChange: (v: number) => void
}

function SliderRow({ label, value, min, max, unit, onChange }: SliderRowProps) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{value}{unit}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full accent-primary h-1.5"
      />
    </div>
  )
}

interface ToggleRowProps {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}

function ToggleRow({ label, checked, onChange }: ToggleRowProps) {
  return (
    <label className="flex items-center justify-between cursor-pointer">
      <span className="text-xs text-muted-foreground">{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        className="accent-primary"
      />
    </label>
  )
}

interface CardConfigPopoverProps {
  config: CardConfig
  onUpdate: (patch: Partial<CardConfig>) => void
}

export function CardConfigPopover({ config, onUpdate }: CardConfigPopoverProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5 h-8">
          <Settings2 className="h-3.5 w-3.5" />
          <span className="hidden sm:inline text-xs">Card size</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-3 space-y-3" align="end">
        <p className="text-xs font-semibold">Card appearance</p>
        <SliderRow
          label="Width"
          value={config.width}
          min={180}
          max={360}
          unit="px"
          onChange={v => onUpdate({ width: v })}
        />
        <SliderRow
          label="Height"
          value={config.height}
          min={100}
          max={280}
          unit="px"
          onChange={v => onUpdate({ height: v })}
        />
        <Separator />
        <div className="border-t border-border" />
        <p className="text-xs font-semibold">Visible fields</p>
        <div className="space-y-2">
          <ToggleRow label="Summary" checked={config.showSummary} onChange={v => onUpdate({ showSummary: v })} />
          <ToggleRow label="Word count" checked={config.showWordCount} onChange={v => onUpdate({ showWordCount: v })} />
          <ToggleRow label="POV character" checked={config.showPov} onChange={v => onUpdate({ showPov: v })} />
          <ToggleRow label="Labels" checked={config.showLabels} onChange={v => onUpdate({ showLabels: v })} />
        </div>
      </PopoverContent>
    </Popover>
  )
}
