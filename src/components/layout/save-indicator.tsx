import { useUIStore } from '@/stores/ui-store'
import { cn } from '@/lib/utils'
import { Check, Loader2, AlertCircle } from 'lucide-react'

export function SaveIndicator() {
  const status = useUIStore(s => s.saveStatus)

  if (status === 'idle') return null

  return (
    <span
      className={cn(
        'flex items-center gap-1.5 text-xs',
        status === 'saved' && 'text-muted-foreground',
        status === 'saving' && 'text-muted-foreground',
        status === 'error' && 'text-destructive',
      )}
    >
      {status === 'saving' && <Loader2 className="h-3 w-3 animate-spin" />}
      {status === 'saved' && <Check className="h-3 w-3" />}
      {status === 'error' && <AlertCircle className="h-3 w-3" />}
      {status === 'saving' && 'Saving…'}
      {status === 'saved' && 'Saved'}
      {status === 'error' && 'Save failed'}
    </span>
  )
}
