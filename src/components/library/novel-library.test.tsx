import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NovelLibrary } from './novel-library'
import type { Novel } from '@/types'

// ─── Mocks ───────────────────────────────────────────────────────────────────

vi.mock('@/lib/db/hooks/novels', () => ({
  useNovels: vi.fn(),
  useSeries: vi.fn(() => []),
  useDeleteNovel: vi.fn(() => vi.fn()),
  useUpdateNovel: vi.fn(() => vi.fn()),
  useCreateSeries: vi.fn(() => vi.fn()),
}))

vi.mock('@/components/library/create-novel-dialog', () => ({
  CreateNovelDialog: ({ open }: { open: boolean }) =>
    open ? <div data-testid="create-dialog">Create Dialog</div> : null,
}))

vi.mock('@/components/library/novel-settings-modal', () => ({
  NovelSettingsModal: () => <div data-testid="settings-modal">Settings Modal</div>,
}))

vi.mock('@/components/ui/toast-provider', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, ...props }: { children: React.ReactNode; to: string }) => (
    <a href={props.to}>{children}</a>
  ),
}))

import { useNovels } from '@/lib/db/hooks/novels'

function makeNovel(id: string, title: string, overrides: Partial<Novel> = {}): Novel {
  return {
    id,
    title,
    archived: false,
    seriesId: undefined,
    coverImage: undefined,
    description: '',
    settings: {},
    createdAt: 0,
    updatedAt: Date.now(),
    ...overrides,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('NovelLibrary', () => {
  it('shows a loading spinner while novels are undefined', () => {
    ;(useNovels as ReturnType<typeof vi.fn>).mockReturnValue(undefined)
    render(<NovelLibrary />)
    expect(document.querySelector('[class*="animate"]')).toBeTruthy()
  })

  it('shows an empty state when no novels exist', () => {
    ;(useNovels as ReturnType<typeof vi.fn>).mockReturnValue([])
    render(<NovelLibrary />)
    expect(screen.getByText(/No novels yet/i)).toBeTruthy()
  })

  it('renders novel titles from the list', () => {
    ;(useNovels as ReturnType<typeof vi.fn>).mockReturnValue([
      makeNovel('n1', 'The Midnight Garden'),
      makeNovel('n2', 'Stormborn'),
    ])
    render(<NovelLibrary />)
    expect(screen.getByText('The Midnight Garden')).toBeTruthy()
    expect(screen.getByText('Stormborn')).toBeTruthy()
  })

  it('opens the create dialog when the header "New Novel" button is clicked', () => {
    ;(useNovels as ReturnType<typeof vi.fn>).mockReturnValue([])
    render(<NovelLibrary />)
    // Use the first match (header button)
    fireEvent.click(screen.getAllByRole('button', { name: /New Novel/i })[0])
    expect(screen.getByTestId('create-dialog')).toBeTruthy()
  })

  it('shows the library tab count', () => {
    ;(useNovels as ReturnType<typeof vi.fn>).mockReturnValue([
      makeNovel('n1', 'Book One'),
      makeNovel('n2', 'Book Two'),
    ])
    render(<NovelLibrary />)
    expect(screen.getByText(/Library \(2\)/i)).toBeTruthy()
  })

  it('shows archived count in tab label', () => {
    ;(useNovels as ReturnType<typeof vi.fn>).mockReturnValue([
      makeNovel('n1', 'Active'),
      makeNovel('n2', 'Archived', { archived: true }),
    ])
    render(<NovelLibrary />)
    expect(screen.getByText(/Archived \(1\)/i)).toBeTruthy()
  })
})
