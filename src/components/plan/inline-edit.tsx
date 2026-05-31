import { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface InlineEditProps {
  value: string
  onSave: (value: string) => void
  className?: string
  inputClassName?: string
  placeholder?: string
}

export function InlineEdit({ value, onSave, className, inputClassName, placeholder }: InlineEditProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) {
      setDraft(value)
      inputRef.current?.select()
    }
  }, [editing, value])

  function commit() {
    const trimmed = draft.trim()
    if (trimmed && trimmed !== value) onSave(trimmed)
    setEditing(false)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') commit()
    if (e.key === 'Escape') setEditing(false)
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={cn(
          'bg-background border-input focus:ring-ring w-full rounded border px-1 py-0.5 text-sm focus:outline-none focus:ring-1',
          inputClassName,
        )}
        autoFocus
      />
    )
  }

  return (
    <span
      role="button"
      tabIndex={0}
      onDoubleClick={() => setEditing(true)}
      onKeyDown={e => e.key === 'Enter' && setEditing(true)}
      className={cn('cursor-text select-none', className)}
      title="Double-click to rename"
    >
      {value || placeholder}
    </span>
  )
}
