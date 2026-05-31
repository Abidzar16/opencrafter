import { describe, it, expect } from 'vitest'
import { detect, countMentions } from './index'
import type { TrackedEntry } from './index'

function entry(
  entryId: string,
  name: string,
  overrides: Partial<TrackedEntry> = {},
): TrackedEntry {
  return {
    entryId,
    name,
    aliases: [],
    trackingSettings: { enabled: true, caseSensitive: false, exclusions: [] },
    ...overrides,
  }
}

describe('detect', () => {
  it('matches a simple name', () => {
    const matches = detect('Gandalf walked in.', [entry('e1', 'Gandalf')])
    expect(matches).toHaveLength(1)
    expect(matches[0]).toMatchObject({ entryId: 'e1', start: 0, matchedText: 'Gandalf' })
  })

  it('returns empty for no entries', () => {
    expect(detect('hello world', [])).toEqual([])
  })

  it('returns empty for empty text', () => {
    expect(detect('', [entry('e1', 'Jon')])).toEqual([])
  })

  it('matches multiple occurrences', () => {
    const matches = detect('Jon met Jon again.', [entry('e1', 'Jon')])
    expect(matches).toHaveLength(2)
  })

  it('is case-insensitive by default', () => {
    const matches = detect('frodo and FRODO and Frodo', [entry('e1', 'Frodo')])
    expect(matches).toHaveLength(3)
  })

  it('is case-sensitive when set', () => {
    const matches = detect('frodo and FRODO and Frodo', [
      entry('e1', 'Frodo', {
        trackingSettings: { enabled: true, caseSensitive: true, exclusions: [] },
      }),
    ])
    expect(matches).toHaveLength(1)
    expect(matches[0].matchedText).toBe('Frodo')
  })

  it('matches aliases', () => {
    const matches = detect('Jonathan greeted Jon.', [
      entry('e1', 'Jon', { aliases: ['Jonathan'] }),
    ])
    expect(matches).toHaveLength(2)
    expect(matches.map(m => m.matchedText).sort()).toEqual(['Jon', 'Jonathan'])
  })

  it('matches simple plural forms', () => {
    const matches = detect('The hobbits met a hobbit.', [entry('e1', 'hobbit')])
    expect(matches).toHaveLength(2)
    expect(matches.some(m => m.matchedText.toLowerCase() === 'hobbits')).toBe(true)
    expect(matches.some(m => m.matchedText.toLowerCase() === 'hobbit')).toBe(true)
  })

  it('does not match partial words (word boundaries)', () => {
    const matches = detect('Jonathan arrived.', [entry('e1', 'Jon')])
    // "Jon" inside "Jonathan" should NOT match due to word boundary
    expect(matches).toHaveLength(0)
  })

  it('skips disabled entries', () => {
    const matches = detect('Sauron is coming.', [
      entry('e1', 'Sauron', {
        trackingSettings: { enabled: false, caseSensitive: false, exclusions: [] },
      }),
    ])
    expect(matches).toHaveLength(0)
  })

  it('applies exclusion list', () => {
    const matches = detect(
      'The King of the North arrived. The King bowed.',
      [
        entry('e1', 'King', {
          trackingSettings: {
            enabled: true,
            caseSensitive: false,
            exclusions: ['King of the North'],
          },
        }),
      ],
    )
    // Only the standalone "King" should match
    expect(matches).toHaveLength(1)
    expect(matches[0].matchedText.toLowerCase()).toBe('king')
  })

  it('prefers longer match at same start position', () => {
    // "Jonathan" and "Jon" both start at 0 — Jonathan should win
    const matches = detect('Jonathan arrived.', [
      entry('e1', 'Jon'),
      entry('e2', 'Jonathan'),
    ])
    expect(matches).toHaveLength(1)
    expect(matches[0].entryId).toBe('e2')
    expect(matches[0].matchedText).toBe('Jonathan')
  })

  it('handles overlapping matches by keeping first', () => {
    const matches = detect('ab cd', [entry('e1', 'ab'), entry('e2', 'cd')])
    expect(matches).toHaveLength(2)
    expect(matches[0].matchedText).toBe('ab')
    expect(matches[1].matchedText).toBe('cd')
  })

  it('handles multiple entries simultaneously', () => {
    const matches = detect('Frodo met Gandalf and Aragorn.', [
      entry('e1', 'Frodo'),
      entry('e2', 'Gandalf'),
      entry('e3', 'Aragorn'),
    ])
    expect(matches).toHaveLength(3)
    expect(matches.map(m => m.entryId).sort()).toEqual(['e1', 'e2', 'e3'])
  })

  it('ies plural: city → cities', () => {
    const matches = detect('The cities were vast. A city burned.', [entry('e1', 'city')])
    expect(matches).toHaveLength(2)
  })

  it('es plural: church → churches', () => {
    const matches = detect('The churches and a church.', [entry('e1', 'church')])
    expect(matches).toHaveLength(2)
  })
})

describe('countMentions', () => {
  it('counts per entryId', () => {
    const matches = detect('Frodo met Gandalf and Frodo again.', [
      entry('e1', 'Frodo'),
      entry('e2', 'Gandalf'),
    ])
    const counts = countMentions(matches)
    expect(counts['e1']).toBe(2)
    expect(counts['e2']).toBe(1)
  })
})
