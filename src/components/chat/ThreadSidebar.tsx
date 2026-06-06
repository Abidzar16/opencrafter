import { useState, useRef, useEffect } from 'react'
import { Pin, PinOff, Archive, Trash2, MoreHorizontal, Plus, ChevronDown, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import {
  useChatThreads,
  useCreateChatThread,
  useUpdateChatThread,
  useDeleteChatThread,
} from '@/lib/db/hooks'
import type { ChatThread } from '@/types'

interface ThreadSidebarProps {
  novelId: string
  activeThreadId: string | null
  onSelectThread: (id: string) => void
}

export function ThreadSidebar({ novelId, activeThreadId, onSelectThread }: ThreadSidebarProps) {
  const threads = useChatThreads(novelId) ?? []
  const createThread = useCreateChatThread()
  const updateThread = useUpdateChatThread()
  const deleteThread = useDeleteChatThread()

  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)
  const [archivedOpen, setArchivedOpen] = useState(false)
  const renameInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (renamingId && renameInputRef.current) {
      renameInputRef.current.focus()
      renameInputRef.current.select()
    }
  }, [renamingId])

  const active = threads.filter(t => !t.archived)
  const archived = threads.filter(t => t.archived)
  const pinned = active.filter(t => t.pinned).sort((a, b) => b.updatedAt - a.updatedAt)
  const unpinned = active.filter(t => !t.pinned).sort((a, b) => b.updatedAt - a.updatedAt)
  const sorted = [...pinned, ...unpinned]

  async function handleNew() {
    const name = `Thread ${active.length + 1}`
    const id = await createThread({ novelId, name, pinned: false, archived: false })
    onSelectThread(id)
  }

  function startRename(thread: ChatThread) {
    setRenamingId(thread.id)
    setRenameValue(thread.name)
  }

  async function commitRename(id: string) {
    const val = renameValue.trim()
    if (val) await updateThread(id, { name: val })
    setRenamingId(null)
  }

  function handleRenameKey(e: React.KeyboardEvent, id: string) {
    if (e.key === 'Enter') commitRename(id)
    if (e.key === 'Escape') setRenamingId(null)
  }

  async function handlePin(thread: ChatThread) {
    await updateThread(thread.id, { pinned: !thread.pinned })
  }

  async function handleArchive(thread: ChatThread) {
    await updateThread(thread.id, { archived: true })
    if (activeThreadId === thread.id) onSelectThread('')
  }

  async function handleRestore(thread: ChatThread) {
    await updateThread(thread.id, { archived: false })
  }

  async function confirmDelete() {
    if (!deleteTargetId) return
    await deleteThread(deleteTargetId)
    if (activeThreadId === deleteTargetId) onSelectThread('')
    setDeleteTargetId(null)
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b p-3">
        <span className="text-sm font-medium">Threads</span>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleNew}>
          <Plus className="h-4 w-4" />
          <span className="sr-only">New thread</span>
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-0.5">
          {sorted.length === 0 && (
            <p className="text-muted-foreground px-2 py-4 text-center text-xs">
              No threads yet. Click + to start.
            </p>
          )}
          {sorted.map(thread => (
            <ThreadItem
              key={thread.id}
              thread={thread}
              isActive={activeThreadId === thread.id}
              isRenaming={renamingId === thread.id}
              renameValue={renameValue}
              renameInputRef={renameInputRef}
              onSelect={() => onSelectThread(thread.id)}
              onRenameChange={setRenameValue}
              onRenameKey={e => handleRenameKey(e, thread.id)}
              onRenameBlur={() => commitRename(thread.id)}
              onStartRename={() => startRename(thread)}
              onPin={() => handlePin(thread)}
              onArchive={() => handleArchive(thread)}
              onDelete={() => setDeleteTargetId(thread.id)}
            />
          ))}
        </div>

        {/* Archived section */}
        {archived.length > 0 && (
          <div className="border-t p-2">
            <button
              onClick={() => setArchivedOpen(v => !v)}
              className="text-muted-foreground hover:text-foreground flex w-full items-center gap-1.5 px-2 py-1 text-xs font-medium"
            >
              {archivedOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              Archived ({archived.length})
            </button>
            {archivedOpen && (
              <div className="mt-1 space-y-0.5">
                {archived.sort((a, b) => b.updatedAt - a.updatedAt).map(thread => (
                  <div key={thread.id} className="flex items-center gap-1 rounded px-2 py-1">
                    <span className="text-muted-foreground min-w-0 flex-1 truncate text-sm">
                      {thread.name}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 shrink-0"
                      onClick={() => handleRestore(thread)}
                      title="Restore"
                    >
                      <Archive className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive h-6 w-6 shrink-0"
                      onClick={() => setDeleteTargetId(thread.id)}
                      title="Delete permanently"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </ScrollArea>

      <ConfirmDialog
        open={!!deleteTargetId}
        onOpenChange={v => !v && setDeleteTargetId(null)}
        title="Delete thread"
        description="This will permanently delete the thread and all its messages. This cannot be undone."
        confirmLabel="Delete"
        destructive
        onConfirm={confirmDelete}
      />
    </div>
  )
}

interface ThreadItemProps {
  thread: ChatThread
  isActive: boolean
  isRenaming: boolean
  renameValue: string
  renameInputRef: React.RefObject<HTMLInputElement | null>
  onSelect: () => void
  onRenameChange: (v: string) => void
  onRenameKey: (e: React.KeyboardEvent) => void
  onRenameBlur: () => void
  onStartRename: () => void
  onPin: () => void
  onArchive: () => void
  onDelete: () => void
}

function ThreadItem({
  thread,
  isActive,
  isRenaming,
  renameValue,
  renameInputRef,
  onSelect,
  onRenameChange,
  onRenameKey,
  onRenameBlur,
  onStartRename,
  onPin,
  onArchive,
  onDelete,
}: ThreadItemProps) {
  return (
    <div
      className={cn(
        'group flex items-center gap-1 rounded-md px-2 py-1.5 cursor-pointer',
        isActive ? 'bg-accent' : 'hover:bg-accent/50',
      )}
      onClick={onSelect}
    >
      {thread.pinned && <Pin className="text-primary h-3 w-3 shrink-0" />}
      {isRenaming ? (
        <input
          ref={renameInputRef}
          value={renameValue}
          onChange={e => onRenameChange(e.target.value)}
          onKeyDown={onRenameKey}
          onBlur={onRenameBlur}
          onClick={e => e.stopPropagation()}
          className="bg-background min-w-0 flex-1 rounded border px-1 py-0 text-sm outline-none"
        />
      ) : (
        <span
          className="min-w-0 flex-1 truncate text-sm"
          onDoubleClick={e => { e.stopPropagation(); onStartRename() }}
        >
          {thread.name}
        </span>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100"
            onClick={e => e.stopPropagation()}
          >
            <MoreHorizontal className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem onClick={e => { e.stopPropagation(); onStartRename() }}>
            Rename
          </DropdownMenuItem>
          <DropdownMenuItem onClick={e => { e.stopPropagation(); onPin() }}>
            {thread.pinned ? (
              <><PinOff className="mr-2 h-3.5 w-3.5" /> Unpin</>
            ) : (
              <><Pin className="mr-2 h-3.5 w-3.5" /> Pin</>
            )}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={e => { e.stopPropagation(); onArchive() }}>
            <Archive className="mr-2 h-3.5 w-3.5" /> Archive
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={e => { e.stopPropagation(); onDelete() }}
          >
            <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
