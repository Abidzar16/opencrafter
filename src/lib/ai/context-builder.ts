import db from '@/lib/db/db'
import { detect } from '@/lib/codex-detector'
import { AiContextMode } from '@/types'
import type { CodexEntry, CodexProgression } from '@/types'

export interface ContextBlock {
  type: 'codex_entry'
  entryId: string
  name: string
  entryType: string
  descriptionText: string
  appliedProgressions: CodexProgression[]
}

/**
 * Assembles the codex context for an AI call.
 *
 * Rules (in order):
 * 1. Hard-filter: NeverInclude entries are excluded unconditionally.
 * 2. AlwaysInclude entries are always in.
 * 3. IncludeWhenDetected: include if the entry's name/alias appears in selectedText.
 * 4. NotWhenDetected: include if the entry's name/alias does NOT appear in selectedText.
 * 5. manualEntryIds: always included (unless NeverInclude).
 * 6. Progressions: for each included entry, only progressions anchored at scenes
 *    with order ≤ the current scene's order are applied.
 */
export async function buildAIContext(
  novelId: string,
  sceneId: string | null,
  selectedText: string,
  manualEntryIds: string[] = [],
): Promise<ContextBlock[]> {
  const allEntries = await db.codex_entries.where('novelId').equals(novelId).toArray()

  // Hard filter: NeverInclude
  const eligible: CodexEntry[] = allEntries.filter(
    e => e.aiContextMode !== AiContextMode.NeverInclude,
  )

  // Run detector on selected text for IncludeWhenDetected / NotWhenDetected logic
  const trackedEntries = eligible
    .filter(e => e.trackingSettings.enabled)
    .map(e => ({
      entryId: e.id,
      name: e.name,
      aliases: e.aliases,
      trackingSettings: e.trackingSettings,
    }))

  const detectedIds = new Set(
    selectedText.trim()
      ? detect(selectedText, trackedEntries).map(m => m.entryId)
      : [],
  )

  const manualSet = new Set(manualEntryIds)

  const included = eligible.filter(e => {
    if (manualSet.has(e.id)) return true
    switch (e.aiContextMode) {
      case AiContextMode.AlwaysInclude:
        return true
      case AiContextMode.IncludeWhenDetected:
        return detectedIds.has(e.id)
      case AiContextMode.NotWhenDetected:
        return !detectedIds.has(e.id)
      default:
        return false
    }
  })

  if (included.length === 0) return []

  // Determine scene order for progression filtering
  let currentSceneOrder = Infinity
  if (sceneId) {
    const scene = await db.scenes.get(sceneId)
    currentSceneOrder = scene?.order ?? Infinity
  }

  // Fetch progressions and scene order map in parallel
  const [allProgressions, allScenes] = await Promise.all([
    db.codex_progressions.where('novelId').equals(novelId).toArray(),
    db.scenes.where('novelId').equals(novelId).toArray(),
  ])

  const sceneOrderMap = new Map(allScenes.map(s => [s.id, s.order]))

  // Build context blocks
  const blocks: ContextBlock[] = included.map(entry => {
    const progressions = allProgressions
      .filter(p => p.entryId === entry.id)
      .filter(p => (sceneOrderMap.get(p.sceneId) ?? Infinity) <= currentSceneOrder)
      .sort((a, b) => (sceneOrderMap.get(a.sceneId) ?? 0) - (sceneOrderMap.get(b.sceneId) ?? 0))

    return {
      type: 'codex_entry',
      entryId: entry.id,
      name: entry.name,
      entryType: entry.type,
      descriptionText: extractPlainText(entry.description),
      appliedProgressions: progressions,
    }
  })

  return blocks
}

/**
 * Renders context blocks into a formatted string suitable for injection
 * into an AI system prompt.
 */
export function renderContextBlocks(blocks: ContextBlock[]): string {
  if (!blocks.length) return ''

  return blocks
    .map(b => {
      const lines: string[] = [`## ${b.name} (${b.entryType})`]
      if (b.descriptionText) lines.push(b.descriptionText)
      for (const p of b.appliedProgressions) {
        const prefix = p.mode === 'replacement' ? '[Update]' : '[Addition]'
        lines.push(`${prefix} ${p.content}`)
      }
      return lines.join('\n')
    })
    .join('\n\n')
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
