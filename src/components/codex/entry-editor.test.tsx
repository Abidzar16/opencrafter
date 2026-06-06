import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { EntryEditor } from './EntryEditor'
import { CodexType, AiContextMode, RevisionEntityType } from '@/types'
import type { CodexEntry, CodexRelation, CodexProgression } from '@/types'

// ─── Mocks ───────────────────────────────────────────────────────────────────

vi.mock('@/components/editor/ProseEditor', () => ({
  ProseEditor: ({ placeholder }: { placeholder?: string }) => (
    <div data-testid="prose-editor">{placeholder}</div>
  ),
}))

vi.mock('@/components/ui/image-upload', () => ({
  ImageUpload: () => <div data-testid="image-upload" />,
}))

vi.mock('@/components/ui/revision-history-modal', () => ({
  RevisionHistoryModal: () => <div data-testid="revision-modal" />,
}))

vi.mock('@/lib/hooks/use-revision', () => ({
  useRevision: () => vi.fn(),
}))

vi.mock('@/lib/hooks/use-debounced-save', () => ({
  useDebouncedSave: (fn: () => void) => fn,
}))

vi.mock('@/lib/db/hooks', () => ({
  useCodexEntry: vi.fn(),
  useCreateCodexEntry: vi.fn(() => vi.fn()),
  useUpdateCodexEntry: vi.fn(() => vi.fn()),
  useDeleteCodexEntry: vi.fn(() => vi.fn()),
  useCodexRelations: vi.fn(() => ({ outbound: [], inbound: [] })),
  useCodexProgressions: vi.fn(() => []),
  useCreateCodexRelation: vi.fn(() => vi.fn()),
  useDeleteCodexRelation: vi.fn(() => vi.fn()),
  useDeleteCodexProgression: vi.fn(() => vi.fn()),
  useUpdateCodexProgression: vi.fn(() => vi.fn()),
  useCodexEntries: vi.fn(() => []),
}))

import {
  useCodexEntry,
  useCodexRelations,
  useCodexProgressions,
} from '@/lib/db/hooks'

function makeEntry(overrides: Partial<CodexEntry> = {}): CodexEntry {
  return {
    id: 'entry-1',
    novelId: 'novel-1',
    type: CodexType.Character,
    name: 'Elara',
    aliases: ['El'],
    description: { type: 'doc', content: [] },
    notes: { type: 'doc', content: [] },
    details: [],
    tags: ['hero'],
    category: 'Protagonist',
    trackingSettings: { enabled: true, caseSensitive: false, exclusions: [] },
    aiContextMode: AiContextMode.IncludeWhenDetected,
    mentionCount: 3,
    createdAt: 1000,
    updatedAt: 2000,
    ...overrides,
  }
}

function makeRelation(overrides: Partial<CodexRelation> = {}): CodexRelation {
  return {
    id: 'rel-1',
    fromId: 'entry-1',
    toId: 'entry-2',
    relationType: 'ally of',
    novelId: 'novel-1',
    createdAt: 1000,
    ...overrides,
  }
}

function makeProgression(overrides: Partial<CodexProgression> = {}): CodexProgression {
  return {
    id: 'prog-1',
    entryId: 'entry-1',
    novelId: 'novel-1',
    sceneId: 'scene-1',
    mode: 'addition',
    content: 'Gets a scar',
    createdAt: 1000,
    updatedAt: 2000,
    ...overrides,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  ;(useCodexEntry as ReturnType<typeof vi.fn>).mockReturnValue(undefined)
  ;(useCodexRelations as ReturnType<typeof vi.fn>).mockReturnValue({ outbound: [], inbound: [] })
  ;(useCodexProgressions as ReturnType<typeof vi.fn>).mockReturnValue([])
})

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('EntryEditor — new entry form', () => {
  it('renders the new entry form when no entryId is provided', () => {
    render(
      <EntryEditor open novelId="novel-1" onClose={vi.fn()} />,
    )
    expect(screen.getByText('New Codex Entry')).toBeTruthy()
    expect(screen.getByPlaceholderText(/entry name/i)).toBeTruthy()
  })

  it('shows all type options in the new form', () => {
    render(<EntryEditor open novelId="novel-1" onClose={vi.fn()} />)
    // Type selector trigger shows default type
    expect(screen.getByText('Character')).toBeTruthy()
  })

  it('calls onClose when Cancel is clicked in new form', () => {
    const onClose = vi.fn()
    render(<EntryEditor open novelId="novel-1" onClose={onClose} />)
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }))
    expect(onClose).toHaveBeenCalled()
  })
})

describe('EntryEditor — edit mode tabs', () => {
  beforeEach(() => {
    ;(useCodexEntry as ReturnType<typeof vi.fn>).mockReturnValue(makeEntry())
  })

  it('renders all four tabs when an entry is loaded', () => {
    render(<EntryEditor open novelId="novel-1" entryId="entry-1" onClose={vi.fn()} />)
    expect(screen.getByRole('tab', { name: /general/i })).toBeTruthy()
    expect(screen.getByRole('tab', { name: /relations/i })).toBeTruthy()
    expect(screen.getByRole('tab', { name: /tracking/i })).toBeTruthy()
    expect(screen.getByRole('tab', { name: /progressions/i })).toBeTruthy()
  })

  it('shows entry name in the sheet header', () => {
    render(<EntryEditor open novelId="novel-1" entryId="entry-1" onClose={vi.fn()} />)
    expect(screen.getByText('Elara')).toBeTruthy()
  })

  it('General tab: renders name input, type selector, and prose editors', () => {
    render(<EntryEditor open novelId="novel-1" entryId="entry-1" onClose={vi.fn()} />)
    // General tab is default — name field should show entry name
    expect(screen.getByDisplayValue('Elara')).toBeTruthy()
    // ProseEditor stubs should be present (description + notes)
    const editors = screen.getAllByTestId('prose-editor')
    expect(editors.length).toBeGreaterThanOrEqual(2)
  })

  it('General tab: shows alias chip', () => {
    render(<EntryEditor open novelId="novel-1" entryId="entry-1" onClose={vi.fn()} />)
    expect(screen.getByText('El')).toBeTruthy()
  })

  it('General tab: shows tag chip', () => {
    render(<EntryEditor open novelId="novel-1" entryId="entry-1" onClose={vi.fn()} />)
    expect(screen.getByText('hero')).toBeTruthy()
  })

  it('Relations tab: shows empty state when no relations', async () => {
    const user = userEvent.setup()
    render(<EntryEditor open novelId="novel-1" entryId="entry-1" onClose={vi.fn()} />)
    await user.click(screen.getByRole('tab', { name: /relations/i }))
    expect(screen.getByText(/no relations yet/i)).toBeTruthy()
  })

  it('Relations tab: renders an existing relation', async () => {
    ;(useCodexRelations as ReturnType<typeof vi.fn>).mockReturnValue({
      outbound: [makeRelation()],
      inbound: [],
    })
    const user = userEvent.setup()
    render(<EntryEditor open novelId="novel-1" entryId="entry-1" onClose={vi.fn()} />)
    await user.click(screen.getByRole('tab', { name: /relations/i }))
    // relationType is displayed as " — ally of"
    expect(screen.getByText(/ally of/i)).toBeTruthy()
  })

  it('Tracking tab: shows tracking toggles', async () => {
    const user = userEvent.setup()
    render(<EntryEditor open novelId="novel-1" entryId="entry-1" onClose={vi.fn()} />)
    await user.click(screen.getByRole('tab', { name: /tracking/i }))
    expect(screen.getByText(/enable tracking/i)).toBeTruthy()
    expect(screen.getByText(/case sensitive/i)).toBeTruthy()
  })

  it('Tracking tab: shows AI context mode selector', async () => {
    const user = userEvent.setup()
    render(<EntryEditor open novelId="novel-1" entryId="entry-1" onClose={vi.fn()} />)
    await user.click(screen.getByRole('tab', { name: /tracking/i }))
    expect(screen.getByText(/AI context mode/i)).toBeTruthy()
  })

  it('Tracking tab: shows NeverInclude warning badge when mode is never_include', async () => {
    ;(useCodexEntry as ReturnType<typeof vi.fn>).mockReturnValue(
      makeEntry({ aiContextMode: AiContextMode.NeverInclude }),
    )
    const user = userEvent.setup()
    render(<EntryEditor open novelId="novel-1" entryId="entry-1" onClose={vi.fn()} />)
    await user.click(screen.getByRole('tab', { name: /tracking/i }))
    expect(screen.getAllByText(/never include/i).length).toBeGreaterThan(0)
  })

  it('Progressions tab: shows empty state when no progressions', async () => {
    const user = userEvent.setup()
    render(<EntryEditor open novelId="novel-1" entryId="entry-1" onClose={vi.fn()} />)
    await user.click(screen.getByRole('tab', { name: /progressions/i }))
    expect(screen.getByText(/no progressions yet/i)).toBeTruthy()
  })

  it('Progressions tab: renders an existing progression', async () => {
    ;(useCodexProgressions as ReturnType<typeof vi.fn>).mockReturnValue([makeProgression()])
    const user = userEvent.setup()
    render(<EntryEditor open novelId="novel-1" entryId="entry-1" onClose={vi.fn()} />)
    await user.click(screen.getByRole('tab', { name: /progressions/i }))
    expect(screen.getByText('Gets a scar')).toBeTruthy()
  })

  it('calls onClose when the sheet close button is activated', () => {
    const onClose = vi.fn()
    render(<EntryEditor open novelId="novel-1" entryId="entry-1" onClose={onClose} />)
    // ESC key on document closes Sheet
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalled()
  })
})

describe('EntryEditor — closed state', () => {
  it('renders nothing when open=false', () => {
    render(<EntryEditor open={false} novelId="novel-1" onClose={vi.fn()} />)
    expect(screen.queryByText('New Codex Entry')).toBeNull()
  })
})
