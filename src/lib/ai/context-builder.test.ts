import { describe, it, expect, vi, beforeEach } from 'vitest'
import { filterNeverIncludeEntries, buildAIContext, debugBuildAIContext } from './context-builder'
import { AiContextMode, CodexType } from '@/types'
import type { CodexEntry } from '@/types'

// ─── Helpers ────────────────────────────────────────────────────────────────

function makeEntry(
  id: string,
  name: string,
  mode: AiContextMode = AiContextMode.AlwaysInclude,
  overrides: Partial<CodexEntry> = {},
): CodexEntry {
  return {
    id,
    novelId: 'novel-1',
    name,
    type: CodexType.Character,
    aliases: [],
    tags: [],
    details: [],
    description: {},
    notes: {},
    aiContextMode: mode,
    trackingSettings: { enabled: false, caseSensitive: false, exclusions: [] },
    mentionCount: 0,
    createdAt: 0,
    updatedAt: 0,
    ...overrides,
  }
}

// ─── filterNeverIncludeEntries — pure function, no mock needed ───────────────

describe('filterNeverIncludeEntries', () => {
  it('removes entries with NeverInclude mode', () => {
    const entries = [
      makeEntry('e1', 'Alice', AiContextMode.AlwaysInclude),
      makeEntry('e2', 'Secret', AiContextMode.NeverInclude),
      makeEntry('e3', 'Bob', AiContextMode.IncludeWhenDetected),
    ]
    const result = filterNeverIncludeEntries(entries)
    expect(result).toHaveLength(2)
    expect(result.map(e => e.id)).not.toContain('e2')
  })

  it('returns all entries when none are NeverInclude', () => {
    const entries = [
      makeEntry('e1', 'Alice', AiContextMode.AlwaysInclude),
      makeEntry('e2', 'Bob', AiContextMode.IncludeWhenDetected),
    ]
    expect(filterNeverIncludeEntries(entries)).toHaveLength(2)
  })

  it('returns empty array when all are NeverInclude', () => {
    const entries = [
      makeEntry('e1', 'Hidden', AiContextMode.NeverInclude),
      makeEntry('e2', 'Shadow', AiContextMode.NeverInclude),
    ]
    expect(filterNeverIncludeEntries(entries)).toHaveLength(0)
  })

  it('returns empty array for empty input', () => {
    expect(filterNeverIncludeEntries([])).toEqual([])
  })

  it('never includes a NeverInclude entry regardless of manual override logic', () => {
    const entries = [makeEntry('e1', 'TopSecret', AiContextMode.NeverInclude)]
    const filtered = filterNeverIncludeEntries(entries)
    expect(filtered.some(e => e.id === 'e1')).toBe(false)
  })
})

// ─── buildAIContext — mocks Dexie ────────────────────────────────────────────

vi.mock('@/lib/db/db', () => ({
  default: {
    codex_entries: { where: vi.fn() },
    codex_progressions: { where: vi.fn() },
    scenes: { get: vi.fn(), where: vi.fn() },
  },
}))

import db from '@/lib/db/db'

const mockDb = db as {
  codex_entries: { where: ReturnType<typeof vi.fn> }
  codex_progressions: { where: ReturnType<typeof vi.fn> }
  scenes: { get: ReturnType<typeof vi.fn>; where: ReturnType<typeof vi.fn> }
}

function setupMockDb(entries: CodexEntry[], scenes = [{ id: 's1', order: 1 }]) {
  mockDb.codex_entries.where.mockReturnValue({
    equals: vi.fn().mockReturnValue({ toArray: vi.fn().mockResolvedValue(entries) }),
  })
  mockDb.codex_progressions.where.mockReturnValue({
    equals: vi.fn().mockReturnValue({ toArray: vi.fn().mockResolvedValue([]) }),
  })
  mockDb.scenes.get.mockResolvedValue(scenes[0])
  mockDb.scenes.where.mockReturnValue({
    equals: vi.fn().mockReturnValue({ toArray: vi.fn().mockResolvedValue(scenes) }),
  })
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('buildAIContext — NeverInclude enforcement', () => {
  it('excludes NeverInclude entries from the context', async () => {
    setupMockDb([
      makeEntry('e1', 'Alice', AiContextMode.AlwaysInclude),
      makeEntry('e2', 'Secret', AiContextMode.NeverInclude),
    ])
    const blocks = await buildAIContext('novel-1', 's1', '')
    const ids = blocks.map(b => b.entryId)
    expect(ids).not.toContain('e2')
    expect(ids).toContain('e1')
  })

  it('excludes NeverInclude even when the entry would match the selected text', async () => {
    // "Secret" appears in selected text, but NeverInclude must still block it
    setupMockDb([
      makeEntry('e2', 'Secret', AiContextMode.NeverInclude, {
        trackingSettings: { enabled: true, caseSensitive: false, exclusions: [] },
      }),
    ])
    const blocks = await buildAIContext('novel-1', 's1', 'Secret plans are afoot')
    expect(blocks.map(b => b.entryId)).not.toContain('e2')
  })

  it('excludes NeverInclude even when listed in manualEntryIds', async () => {
    setupMockDb([makeEntry('e2', 'Hidden', AiContextMode.NeverInclude)])
    const blocks = await buildAIContext('novel-1', 's1', '', ['e2'])
    expect(blocks.map(b => b.entryId)).not.toContain('e2')
  })

  it('returns empty when all entries are NeverInclude', async () => {
    setupMockDb([
      makeEntry('e1', 'A', AiContextMode.NeverInclude),
      makeEntry('e2', 'B', AiContextMode.NeverInclude),
    ])
    const blocks = await buildAIContext('novel-1', 's1', '')
    expect(blocks).toHaveLength(0)
  })

  it('returns all AlwaysInclude entries when none are NeverInclude', async () => {
    setupMockDb([
      makeEntry('e1', 'Alice', AiContextMode.AlwaysInclude),
      makeEntry('e2', 'Bob', AiContextMode.AlwaysInclude),
    ])
    const blocks = await buildAIContext('novel-1', 's1', '')
    expect(blocks).toHaveLength(2)
  })
})

describe('debugBuildAIContext — excluded entry reporting', () => {
  it('reports NeverInclude entries as excluded with reason', async () => {
    setupMockDb([
      makeEntry('e1', 'Alice', AiContextMode.AlwaysInclude),
      makeEntry('e2', 'Secret', AiContextMode.NeverInclude),
    ])
    const result = await debugBuildAIContext('novel-1', 's1', '')
    expect(result.included.map(b => b.entryId)).not.toContain('e2')
    const excludedEntry = result.excluded.find(x => x.entryId === 'e2')
    expect(excludedEntry).toBeDefined()
    expect(excludedEntry?.reason).toMatch(/NeverInclude/i)
  })

  it('does not report AlwaysInclude entries as excluded', async () => {
    setupMockDb([makeEntry('e1', 'Alice', AiContextMode.AlwaysInclude)])
    const result = await debugBuildAIContext('novel-1', 's1', '')
    expect(result.excluded.some(x => x.entryId === 'e1')).toBe(false)
  })

  it('reports IncludeWhenDetected as excluded when name is not in selected text', async () => {
    setupMockDb([
      makeEntry('e1', 'Dragon', AiContextMode.IncludeWhenDetected, {
        trackingSettings: { enabled: true, caseSensitive: false, exclusions: [] },
      }),
    ])
    const result = await debugBuildAIContext('novel-1', 's1', 'The wizard cast a spell')
    const exc = result.excluded.find(x => x.entryId === 'e1')
    expect(exc).toBeDefined()
    expect(exc?.reason).toMatch(/IncludeWhenDetected/i)
  })
})
