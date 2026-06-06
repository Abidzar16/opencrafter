import { useState, useCallback, useEffect, useRef } from 'react'
import { Download, Copy, PanelRight, PanelLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { toast } from 'sonner'
import { ThreadSidebar } from './ThreadSidebar'
import { MessageList } from './MessageList'
import { MessageBar } from './MessageBar'
import { ExtractModal } from './ExtractModal'
import { useChatThreads, useAddChatMessage } from '@/lib/db/hooks'
import { useGenerateStream } from '@/lib/hooks/use-generate-stream'
import { useUIStore } from '@/stores/ui-store'
import { resolveChatSystemPrompt, buildChatContext } from '@/lib/ai/chat-context'
import { cn } from '@/lib/utils'
import { ChatRole, Provider } from '@/types'
import type { ContextAttachment } from '@/types'
import type { ChatMessage } from '@/types/chat'
import db from '@/lib/db/db'

interface ChatViewProps {
  novelId: string
}

export function ChatView({ novelId }: ChatViewProps) {
  const threads = useChatThreads(novelId) ?? []
  const addMessage = useAddChatMessage()
  const { chatSelectedPromptId, chatSelectedConfigId, chatSplitView, setChatSplitView } = useUIStore()

  const [activeThreadId, setActiveThreadId] = useState<string | null>(null)
  const [streamingText, setStreamingText] = useState('')
  const [context, setContext] = useState<ContextAttachment[]>([])
  const [extractContent, setExtractContent] = useState<string | null>(null)

  // Refs for streaming accumulation (avoid closure staleness)
  const accumulatedRef = useRef('')
  const pendingThreadRef = useRef<string | null>(null)

  // Auto-select first non-archived thread on mount / when threads change
  useEffect(() => {
    if (!activeThreadId) {
      const first = threads.find(t => !t.archived)
      if (first) setActiveThreadId(first.id)
    }
  }, [threads, activeThreadId])

  const { run, abort } = useGenerateStream({
    onChunk: useCallback((text: string) => {
      accumulatedRef.current += text
      setStreamingText(prev => prev + text)
    }, []),
    onDone: useCallback(() => {
      const text = accumulatedRef.current
      const threadId = pendingThreadRef.current
      accumulatedRef.current = ''
      pendingThreadRef.current = null
      setStreamingText('')
      if (text && threadId) {
        addMessage({ threadId, role: ChatRole.Assistant, content: text }).catch(console.error)
      }
    }, [addMessage]),
    onError: useCallback((err: Error) => {
      accumulatedRef.current = ''
      pendingThreadRef.current = null
      setStreamingText('')
      toast.error(`Chat error: ${err.message}`)
    }, []),
  })

  async function buildSystemMessage(attachments: ContextAttachment[], inputValues?: Record<string, string>): Promise<string> {
    if (chatSelectedPromptId) {
      const prompt = await db.prompts.get(chatSelectedPromptId)
      if (prompt) {
        let persona: string | undefined
        try {
          const novel = await db.novels.get(novelId)
          const personaId = novel?.settings?.defaultPersonaId
          if (personaId) {
            const p = await db.prompt_personas.get(personaId)
            persona = p?.instructions
          }
        } catch { /* ignore */ }
        return resolveChatSystemPrompt(prompt.instructions, attachments, persona, inputValues)
      }
    }
    let base = 'You are a helpful creative writing assistant.'
    if (attachments.length > 0) {
      const ctx = await buildChatContext(attachments)
      if (ctx) base += `\n\n## Provided Context\n\n${ctx}`
    }
    return base
  }

  async function handleSend(text: string, inputValues?: Record<string, string>) {
    if (!activeThreadId) { toast.error('Select or create a thread first'); return }
    if (!chatSelectedConfigId) { toast.error('Select a model in the message bar'); return }

    const config = await db.model_configs.get(chatSelectedConfigId)
    if (!config) { toast.error('Model config not found'); return }

    // Save user message first
    await addMessage({
      threadId: activeThreadId,
      role: ChatRole.User,
      content: text,
      contextSnapshot: context.length > 0 ? context : undefined,
    })

    const systemContent = await buildSystemMessage(context, inputValues)

    // Load all messages (including the one just saved)
    const allMessages: ChatMessage[] = await db.chat_messages
      .where('threadId').equals(activeThreadId).sortBy('createdAt') as ChatMessage[]

    const apiMessages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }> = [
      { role: 'system', content: systemContent },
      ...allMessages.map(m => ({
        role: m.role === ChatRole.User ? ('user' as const) : ('assistant' as const),
        content: m.content,
      })),
    ]

    accumulatedRef.current = ''
    setStreamingText('')
    pendingThreadRef.current = activeThreadId

    await run({
      messages: apiMessages,
      provider: config.provider as Provider,
      modelId: config.modelId,
      apiKeyRef: config.apiKeyRef,
      temperature: config.temperature,
      topP: config.topP,
      maxTokens: config.maxTokens,
      stream: true,
    })
  }

  async function handleRegenerate(messageId: string) {
    if (!activeThreadId || !chatSelectedConfigId) return
    const config = await db.model_configs.get(chatSelectedConfigId)
    if (!config) return

    // Delete that AI message, re-run with remaining history
    await db.chat_messages.delete(messageId)
    const remaining: ChatMessage[] = await db.chat_messages
      .where('threadId').equals(activeThreadId).sortBy('createdAt') as ChatMessage[]

    const systemContent = await buildSystemMessage(context)
    const apiMessages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }> = [
      { role: 'system', content: systemContent },
      ...remaining.map(m => ({
        role: m.role === ChatRole.User ? ('user' as const) : ('assistant' as const),
        content: m.content,
      })),
    ]

    accumulatedRef.current = ''
    setStreamingText('')
    pendingThreadRef.current = activeThreadId

    await run({
      messages: apiMessages,
      provider: config.provider as Provider,
      modelId: config.modelId,
      apiKeyRef: config.apiKeyRef,
      temperature: config.temperature,
      topP: config.topP,
      maxTokens: config.maxTokens,
      stream: true,
    })
  }

  function exportThread(format: 'md' | 'txt') {
    if (!activeThreadId) { toast.error('No thread selected'); return }
    const thread = threads.find(t => t.id === activeThreadId)
    // We'll export from DB on-demand
    db.chat_messages.where('threadId').equals(activeThreadId).sortBy('createdAt').then(msgs => {
      if (!msgs.length) { toast.error('No messages to export'); return }
      const lines = (msgs as ChatMessage[]).map(m => {
        const role = m.role === ChatRole.User ? 'User' : 'Assistant'
        const ts = new Date(m.createdAt).toLocaleString()
        return format === 'md'
          ? `## ${role} — ${ts}\n\n${m.content}\n`
          : `[${role}] ${ts}\n${m.content}\n`
      })
      const content = lines.join('\n---\n\n')
      const blob = new Blob([content], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${thread?.name ?? 'thread'}.${format}`
      a.click()
      URL.revokeObjectURL(url)
      toast.success(`Exported as .${format}`)
    })
  }

  function copyConversation() {
    db.chat_messages.where('threadId').equals(activeThreadId ?? '').sortBy('createdAt').then(msgs => {
      if (!msgs.length) { toast.error('No messages to copy'); return }
      const text = (msgs as ChatMessage[])
        .map(m => `${m.role === ChatRole.User ? 'User' : 'Assistant'}:\n${m.content}`)
        .join('\n\n---\n\n')
      navigator.clipboard.writeText(text).catch(() => null)
      toast.success('Conversation copied')
    })
  }

  function handleSelectThread(id: string) {
    abort()
    accumulatedRef.current = ''
    pendingThreadRef.current = null
    setStreamingText('')
    setActiveThreadId(id || null)
  }

  const activeThread = threads.find(t => t.id === activeThreadId)

  const [threadSidebarOpen, setThreadSidebarOpen] = useState(true)

  return (
    <div className="flex h-full">
      {/* Thread sidebar — hidden at < 640px, toggle button in top bar */}
      <aside
        className={cn(
          'border-border bg-sidebar shrink-0 border-r transition-all',
          threadSidebarOpen ? 'w-56' : 'w-0 overflow-hidden',
          'max-sm:hidden',
        )}
      >
        <ThreadSidebar
          novelId={novelId}
          activeThreadId={activeThreadId}
          onSelectThread={handleSelectThread}
        />
      </aside>

      {/* Chat main area */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <div className="border-border flex h-10 shrink-0 items-center justify-between border-b px-4">
          <div className="flex items-center gap-2">
            {/* Thread sidebar toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setThreadSidebarOpen(v => !v)}
              aria-label="Toggle thread list"
            >
              <PanelLeft className="h-3.5 w-3.5" />
            </Button>
            <span className="truncate text-sm font-medium">
              {activeThread?.name ?? 'Select a thread'}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={copyConversation}>
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Copy conversation</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => exportThread('md')}>
                  <Download className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Export as .md</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={chatSplitView ? 'secondary' : 'ghost'}
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setChatSplitView(!chatSplitView)}
                >
                  <PanelRight className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Toggle split view</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {activeThreadId ? (
          <>
            <MessageList
              threadId={activeThreadId}
              streamingText={streamingText}
              onExtract={setExtractContent}
              onRegenerate={handleRegenerate}
            />
            <MessageBar
              novelId={novelId}
              context={context}
              onContextChange={setContext}
              onSend={handleSend}
            />
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-muted-foreground text-sm">
              Create a new thread or select one from the sidebar.
            </p>
          </div>
        )}
      </div>

      <ExtractModal
        open={!!extractContent}
        onClose={() => setExtractContent(null)}
        content={extractContent ?? ''}
        novelId={novelId}
      />
    </div>
  )
}
