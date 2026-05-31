import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useCodexEntry } from '@/lib/db/hooks'
import { CodexType } from '@/types'

const TYPE_COLORS: Record<CodexType, string> = {
  [CodexType.Character]: 'bg-blue-100 text-blue-800',
  [CodexType.Location]: 'bg-green-100 text-green-800',
  [CodexType.Object]: 'bg-amber-100 text-amber-800',
  [CodexType.Lore]: 'bg-purple-100 text-purple-800',
  [CodexType.Subplot]: 'bg-rose-100 text-rose-800',
  [CodexType.Other]: 'bg-zinc-100 text-zinc-800',
}

const TYPE_LABELS: Record<CodexType, string> = {
  [CodexType.Character]: 'Character',
  [CodexType.Location]: 'Location',
  [CodexType.Object]: 'Object',
  [CodexType.Lore]: 'Lore',
  [CodexType.Subplot]: 'Subplot',
  [CodexType.Other]: 'Other',
}

interface HoverState {
  entryId: string
  rect: DOMRect
}

interface CodexHoverCardProps {
  hovered: HoverState
  onOpenEntry: (id: string) => void
}

function HoverCardContent({ hovered, onOpenEntry }: CodexHoverCardProps) {
  const entry = useCodexEntry(hovered.entryId)
  const cardRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ top: 0, left: 0 })

  useEffect(() => {
    const card = cardRef.current
    if (!card) return
    const { rect } = hovered
    const vw = window.innerWidth
    const vh = window.innerHeight
    const cardH = card.offsetHeight || 120
    const cardW = card.offsetWidth || 240

    let top = rect.bottom + 8
    if (top + cardH > vh - 16) top = rect.top - cardH - 8

    let left = rect.left
    if (left + cardW > vw - 16) left = vw - cardW - 16
    if (left < 8) left = 8

    setPos({ top, left })
  }, [hovered])

  if (!entry) return null

  // Extract plain text from Tiptap JSON for excerpt
  const excerpt = extractPlainText(entry.description).slice(0, 140)

  return (
    <div
      ref={cardRef}
      className="bg-popover border-border shadow-lg pointer-events-none fixed z-50 w-60 rounded-lg border p-3 text-sm"
      style={{ top: pos.top, left: pos.left }}
    >
      <div className="mb-1 flex items-start justify-between gap-2">
        <span className="font-semibold leading-tight">{entry.name}</span>
        <span
          className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${TYPE_COLORS[entry.type]}`}
        >
          {TYPE_LABELS[entry.type]}
        </span>
      </div>
      {excerpt && (
        <p className="text-muted-foreground line-clamp-3 text-xs">
          {excerpt}
          {entry.description && extractPlainText(entry.description).length > 140 ? '…' : ''}
        </p>
      )}
      {entry.aliases.length > 0 && (
        <p className="text-muted-foreground mt-1 text-xs">
          Also: {entry.aliases.join(', ')}
        </p>
      )}
      <button
        className="text-primary pointer-events-auto mt-1.5 text-xs underline-offset-2 hover:underline"
        onMouseDown={e => {
          e.preventDefault()
          onOpenEntry(entry.id)
        }}
      >
        Open entry
      </button>
    </div>
  )
}

function extractPlainText(json: Record<string, unknown>): string {
  if (!json || !json.content) return ''
  const nodes = json.content as Array<{ type: string; text?: string; content?: unknown[] }>
  return nodes
    .map(n => {
      if (n.type === 'text') return n.text ?? ''
      if (n.content) return extractPlainText({ content: n.content } as Record<string, unknown>)
      return ''
    })
    .join(' ')
    .trim()
}

/**
 * Attaches global mouseover listener to `[data-entry-id]` elements
 * produced by the codex detection plugin decorations.
 */
export function useCodexHoverCard(onOpenEntry: (id: string) => void) {
  const [hovered, setHovered] = useState<HoverState | null>(null)
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const handleOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const el = target.closest('[data-entry-id]') as HTMLElement | null
      if (el) {
        if (hideTimer.current) {
          clearTimeout(hideTimer.current)
          hideTimer.current = null
        }
        const entryId = el.getAttribute('data-entry-id')!
        setHovered({ entryId, rect: el.getBoundingClientRect() })
      } else {
        // Small delay before hiding to avoid flicker when crossing element boundaries
        if (!hideTimer.current) {
          hideTimer.current = setTimeout(() => {
            setHovered(null)
            hideTimer.current = null
          }, 150)
        }
      }
    }

    document.addEventListener('mouseover', handleOver)
    return () => {
      document.removeEventListener('mouseover', handleOver)
      if (hideTimer.current) clearTimeout(hideTimer.current)
    }
  }, [])

  const card =
    hovered
      ? createPortal(
          <HoverCardContent hovered={hovered} onOpenEntry={onOpenEntry} />,
          document.body,
        )
      : null

  return card
}
