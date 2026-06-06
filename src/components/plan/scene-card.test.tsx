import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SceneCard } from './scene-card'
import type { Scene, Label } from '@/types'

// ─── Mocks ───────────────────────────────────────────────────────────────────

vi.mock('@/lib/db/hooks', () => ({
  useCodexEntry: vi.fn(() => undefined),
  useUpdateScene: vi.fn(() => vi.fn()),
  useDeleteScene: vi.fn(() => vi.fn()),
  useDuplicateScene: vi.fn(() => vi.fn()),
  useMoveScene: vi.fn(() => vi.fn()),
}))

vi.mock('@/stores/editor-store', () => ({
  useEditorStore: vi.fn(() => ({ setActiveScene: vi.fn() })),
}))

vi.mock('@/components/plan/move-dialog', () => ({
  MoveSceneDialog: () => null,
}))

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeScene(overrides: Partial<Scene> = {}): Scene {
  return {
    id: 's1',
    novelId: 'n1',
    chapterId: 'ch1',
    title: 'The Awakening',
    subtitle: '',
    summary: '',
    beats: [],
    order: 0,
    archived: false,
    wordCount: 0,
    labels: [],
    codexAssociations: [],
    createdAt: 0,
    updatedAt: 0,
    ...overrides,
  }
}

const defaultConfig = {
  width: 200,
  height: 120,
  showSummary: true,
  showWordCount: true,
  showPov: true,
  showLabels: true,
  showCodexAssociations: true,
}

beforeEach(() => {
  vi.clearAllMocks()
})

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('SceneCard', () => {
  it('renders the scene title', () => {
    render(
      <SceneCard
        scene={makeScene()}
        novelId="n1"
        config={defaultConfig}
        labels={[]}
      />,
    )
    expect(screen.getByText('The Awakening')).toBeTruthy()
  })

  it('renders summary when showSummary is enabled', () => {
    render(
      <SceneCard
        scene={makeScene({ summary: 'A storm approaches the village.' })}
        novelId="n1"
        config={defaultConfig}
        labels={[]}
      />,
    )
    expect(screen.getByText('A storm approaches the village.')).toBeTruthy()
  })

  it('hides summary when showSummary is false', () => {
    render(
      <SceneCard
        scene={makeScene({ summary: 'Hidden summary.' })}
        novelId="n1"
        config={{ ...defaultConfig, showSummary: false }}
        labels={[]}
      />,
    )
    expect(screen.queryByText('Hidden summary.')).toBeNull()
  })

  it('shows word count badge when showWordCount is enabled and count > 0', () => {
    render(
      <SceneCard
        scene={makeScene({ wordCount: 342 })}
        novelId="n1"
        config={defaultConfig}
        labels={[]}
      />,
    )
    expect(screen.getByText('342w')).toBeTruthy()
  })

  it('hides word count badge when count is 0', () => {
    render(
      <SceneCard
        scene={makeScene({ wordCount: 0 })}
        novelId="n1"
        config={defaultConfig}
        labels={[]}
      />,
    )
    expect(screen.queryByText(/0w/)).toBeNull()
  })

  it('shows label chips for assigned labels', () => {
    const labels: Label[] = [
      { id: 'l1', novelId: 'n1', name: 'Action', color: '#ff0000', createdAt: 0 },
      { id: 'l2', novelId: 'n1', name: 'Romance', color: '#ff69b4', createdAt: 0 },
    ]
    render(
      <SceneCard
        scene={makeScene({ labels: ['l1'] })}
        novelId="n1"
        config={defaultConfig}
        labels={labels}
      />,
    )
    expect(screen.getByText('Action')).toBeTruthy()
    expect(screen.queryByText('Romance')).toBeNull()
  })

  it('shows codex association count badge', () => {
    render(
      <SceneCard
        scene={makeScene({ codexAssociations: ['e1', 'e2', 'e3'] })}
        novelId="n1"
        config={defaultConfig}
        labels={[]}
      />,
    )
    expect(screen.getByText('3')).toBeTruthy()
  })

  it('applies custom card dimensions via style', () => {
    const { container } = render(
      <SceneCard
        scene={makeScene()}
        novelId="n1"
        config={{ ...defaultConfig, width: 300, height: 180 }}
        labels={[]}
      />,
    )
    const card = container.querySelector('[style*="300px"]') ?? container.querySelector('[style*="300"]')
    expect(card).toBeTruthy()
  })
})
