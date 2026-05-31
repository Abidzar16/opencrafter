export interface TrackedEntry {
  entryId: string
  name: string
  aliases: string[]
  trackingSettings: {
    enabled: boolean
    caseSensitive: boolean
    exclusions: string[]
  }
}

export interface DetectionMatch {
  start: number
  end: number
  entryId: string
  matchedText: string
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function getPlurals(word: string): string[] {
  const w = word.toLowerCase()
  if (
    w.endsWith('s') ||
    w.endsWith('x') ||
    w.endsWith('z') ||
    w.endsWith('ch') ||
    w.endsWith('sh')
  ) {
    return [word, word + 'es']
  }
  if (w.length > 1 && w.endsWith('y') && !'aeiou'.includes(w[w.length - 2])) {
    return [word, word.slice(0, -1) + 'ies']
  }
  return [word, word + 's']
}

/**
 * Detects all codex entry mentions in a plain-text string.
 * Returns non-overlapping matches sorted by start position.
 */
export function detect(text: string, entries: TrackedEntry[]): DetectionMatch[] {
  if (!text || !entries.length) return []

  const allMatches: DetectionMatch[] = []

  for (const entry of entries) {
    if (!entry.trackingSettings.enabled) continue

    const terms = [entry.name, ...entry.aliases].flatMap(getPlurals)
    const unique = [...new Set(terms)].sort((a, b) => b.length - a.length)
    if (!unique.length) continue

    const flags = entry.trackingSettings.caseSensitive ? 'g' : 'gi'
    const pattern = unique.map(escapeRegex).join('|')
    // Use lookahead/lookbehind for word boundaries to avoid \b Unicode issues
    const regex = new RegExp(`(?<![a-zA-Z0-9_])(?:${pattern})(?![a-zA-Z0-9_])`, flags)

    let m: RegExpExecArray | null
    while ((m = regex.exec(text)) !== null) {
      const start = m.index
      const end = start + m[0].length

      // Skip if the match overlaps any excluded phrase in the text
      const excluded = entry.trackingSettings.exclusions.some(excl => {
        if (!excl.trim()) return false
        const exclRe = new RegExp(escapeRegex(excl.trim()), 'gi')
        let em: RegExpExecArray | null
        while ((em = exclRe.exec(text)) !== null) {
          // Overlaps: exclusion starts before match ends AND ends after match starts
          if (em.index < end && em.index + em[0].length > start) return true
        }
        return false
      })
      if (excluded) continue

      allMatches.push({ start, end, entryId: entry.entryId, matchedText: m[0] })
    }
  }

  // Sort: ascending start, then descending end (prefer longer match at same start)
  allMatches.sort((a, b) => {
    if (a.start !== b.start) return a.start - b.start
    return b.end - a.end
  })

  // Remove overlaps: once a match is kept, skip any that start before its end
  const result: DetectionMatch[] = []
  let lastEnd = -1
  for (const m of allMatches) {
    if (m.start >= lastEnd) {
      result.push(m)
      lastEnd = m.end
    }
  }

  return result
}

/**
 * Counts mentions per entryId across a list of matches.
 */
export function countMentions(matches: DetectionMatch[]): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const m of matches) {
    counts[m.entryId] = (counts[m.entryId] ?? 0) + 1
  }
  return counts
}
