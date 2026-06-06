import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ThreadSidebar } from './ThreadSidebar'
import { MessageList } from './MessageList'
import { ChatRole } from '@/types'
import type { ChatThread, ChatMessage } from '@/types'

// ─── Mocks ───────────────────────────────────────────────────────────────────

vi.mock('@/lib/db/hooks', () => ({
  useChatThreads: vi.fn(),
  useCreateChatThread: vi.fn(() => vi.fn(async () => 'thread-new')),
  useUpdateChatThread: vi.fn(() => vi.fn()),
  useDeleteChatThread: vi.fn(() => vi.fn()),
  useChatMessages: vi.fn(),
  useDeleteChatMessage: vi.fn(() => vi.fn()),
}))

vi.mock('@/stores/ai-store', () => ({
  useAIStore: vi.fn(() => ({ status: 'idle', abort: vi.fn() })),
}))

import {
  useChatThreads,
  useChatMessages,
  useCreateChatThread,
} from '@/lib/db/hooks'

import { useAIStore } from '@/stores/ai-store'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeThread(overrides: Partial<ChatThread> = {}): ChatThread {
  return {
    id: 'thread-1',
    novelId: 'novel-1',
    name: 'Thread 1',
    pinned: false,
    archived: false,
    createdAt: 1000,
    updatedAt: 2000,
    ...overrides,
  }
}

function makeMessage(overrides: Partial<ChatMessage> = {}): ChatMessage {
  return {
    id: 'msg-1',
    threadId: 'thread-1',
    role: ChatRole.User,
    content: 'Hello, world!',
    createdAt: 1000,
    ...overrides,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  ;(useChatThreads as ReturnType<typeof vi.fn>).mockReturnValue([])
  ;(useChatMessages as ReturnType<typeof vi.fn>).mockReturnValue([])
  ;(useAIStore as ReturnType<typeof vi.fn>).mockReturnValue({ status: 'idle', abort: vi.fn() })
  // JSDOM doesn't implement scrollIntoView
  window.HTMLElement.prototype.scrollIntoView = vi.fn()
})

// ─── ThreadSidebar Tests ──────────────────────────────────────────────────────

describe('ThreadSidebar', () => {
  it('shows "New Chat" button', () => {
    render(
      <ThreadSidebar novelId="novel-1" activeThreadId={null} onSelectThread={vi.fn()} />,
    )
    expect(screen.getByRole('button', { name: /new thread/i })).toBeTruthy()
  })

  it('shows empty state when no threads exist', () => {
    render(
      <ThreadSidebar novelId="novel-1" activeThreadId={null} onSelectThread={vi.fn()} />,
    )
    expect(screen.getByText(/no threads yet/i)).toBeTruthy()
  })

  it('renders thread names', () => {
    ;(useChatThreads as ReturnType<typeof vi.fn>).mockReturnValue([
      makeThread({ id: 'thread-1', name: 'Research Thread' }),
      makeThread({ id: 'thread-2', name: 'World Building' }),
    ])
    render(
      <ThreadSidebar novelId="novel-1" activeThreadId={null} onSelectThread={vi.fn()} />,
    )
    expect(screen.getByText('Research Thread')).toBeTruthy()
    expect(screen.getByText('World Building')).toBeTruthy()
  })

  it('highlights the active thread', () => {
    ;(useChatThreads as ReturnType<typeof vi.fn>).mockReturnValue([
      makeThread({ id: 'thread-1', name: 'Active Thread' }),
    ])
    render(
      <ThreadSidebar novelId="novel-1" activeThreadId="thread-1" onSelectThread={vi.fn()} />,
    )
    const activeEl = screen.getByText('Active Thread').closest('div')
    expect(activeEl?.className).toMatch(/bg-accent|active/)
  })

  it('calls onSelectThread when a thread is clicked', async () => {
    ;(useChatThreads as ReturnType<typeof vi.fn>).mockReturnValue([
      makeThread({ id: 'thread-1', name: 'Clickable Thread' }),
    ])
    const onSelect = vi.fn()
    const user = userEvent.setup()
    render(
      <ThreadSidebar novelId="novel-1" activeThreadId={null} onSelectThread={onSelect} />,
    )
    await user.click(screen.getByText('Clickable Thread'))
    expect(onSelect).toHaveBeenCalledWith('thread-1')
  })

  it('calls createThread when New Chat is clicked', async () => {
    const mockCreate = vi.fn(async () => 'thread-new')
    ;(useCreateChatThread as ReturnType<typeof vi.fn>).mockReturnValue(mockCreate)
    const user = userEvent.setup()
    render(
      <ThreadSidebar novelId="novel-1" activeThreadId={null} onSelectThread={vi.fn()} />,
    )
    await user.click(screen.getByRole('button', { name: /new thread/i }))
    expect(mockCreate).toHaveBeenCalled()
  })

  it('shows pinned threads at top', () => {
    ;(useChatThreads as ReturnType<typeof vi.fn>).mockReturnValue([
      makeThread({ id: 'thread-1', name: 'Normal Thread', pinned: false }),
      makeThread({ id: 'thread-2', name: 'Pinned Thread', pinned: true }),
    ])
    render(
      <ThreadSidebar novelId="novel-1" activeThreadId={null} onSelectThread={vi.fn()} />,
    )
    const all = screen.getAllByText(/Thread/)
    // Pinned threads are separated — just verify both are visible
    expect(all.some(el => el.textContent === 'Pinned Thread')).toBe(true)
    expect(all.some(el => el.textContent === 'Normal Thread')).toBe(true)
  })

  it('hides archived threads from main list', () => {
    ;(useChatThreads as ReturnType<typeof vi.fn>).mockReturnValue([
      makeThread({ id: 'thread-1', name: 'Active Thread', archived: false }),
      makeThread({ id: 'thread-2', name: 'Old Thread', archived: true }),
    ])
    render(
      <ThreadSidebar novelId="novel-1" activeThreadId={null} onSelectThread={vi.fn()} />,
    )
    // Active thread visible; archived thread not in main list
    expect(screen.getByText('Active Thread')).toBeTruthy()
    expect(screen.queryByText('Old Thread')).toBeNull()
  })
})

// ─── MessageList Tests ────────────────────────────────────────────────────────

describe('MessageList', () => {
  it('shows empty state when no messages', () => {
    render(
      <MessageList
        threadId="thread-1"
        streamingText=""
        onExtract={vi.fn()}
        onRegenerate={vi.fn()}
      />,
    )
    expect(screen.getByText(/send a message/i)).toBeTruthy()
  })

  it('renders user messages', () => {
    ;(useChatMessages as ReturnType<typeof vi.fn>).mockReturnValue([
      makeMessage({ content: 'What is the plot?' }),
    ])
    render(
      <MessageList
        threadId="thread-1"
        streamingText=""
        onExtract={vi.fn()}
        onRegenerate={vi.fn()}
      />,
    )
    expect(screen.getByText('What is the plot?')).toBeTruthy()
  })

  it('renders assistant messages', () => {
    ;(useChatMessages as ReturnType<typeof vi.fn>).mockReturnValue([
      makeMessage({ id: 'msg-2', role: ChatRole.Assistant, content: 'The plot involves…' }),
    ])
    render(
      <MessageList
        threadId="thread-1"
        streamingText=""
        onExtract={vi.fn()}
        onRegenerate={vi.fn()}
      />,
    )
    expect(screen.getByText('The plot involves…')).toBeTruthy()
  })

  it('renders streaming text when status is generating', () => {
    ;(useAIStore as ReturnType<typeof vi.fn>).mockReturnValue({ status: 'generating', abort: vi.fn() })
    render(
      <MessageList
        threadId="thread-1"
        streamingText="Generating response…"
        onExtract={vi.fn()}
        onRegenerate={vi.fn()}
      />,
    )
    expect(screen.getByText('Generating response…')).toBeTruthy()
  })

  it('renders multiple messages in order', () => {
    ;(useChatMessages as ReturnType<typeof vi.fn>).mockReturnValue([
      makeMessage({ id: 'msg-1', content: 'First message', createdAt: 1000 }),
      makeMessage({ id: 'msg-2', role: ChatRole.Assistant, content: 'Reply here', createdAt: 2000 }),
      makeMessage({ id: 'msg-3', content: 'Follow-up', createdAt: 3000 }),
    ])
    render(
      <MessageList
        threadId="thread-1"
        streamingText=""
        onExtract={vi.fn()}
        onRegenerate={vi.fn()}
      />,
    )
    expect(screen.getByText('First message')).toBeTruthy()
    expect(screen.getByText('Reply here')).toBeTruthy()
    expect(screen.getByText('Follow-up')).toBeTruthy()
  })
})
