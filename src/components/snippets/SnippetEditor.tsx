import { useState, useEffect, useCallback } from 'react'
import { X, Trash2, History, Tag, Scissors } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { RevisionHistoryModal } from '@/components/ui/revision-history-modal'
import { ExtractModal } from '@/components/chat/ExtractModal'
import { ProseEditor } from '@/components/editor/ProseEditor'
import { useSnippet, useUpdateSnippet, useDeleteSnippet } from '@/lib/db/hooks'
import { useRevision } from '@/lib/hooks/use-revision'
import { useDebouncedSave } from '@/lib/hooks/use-debounced-save'
import { RevisionEntityType } from '@/types'

function extractPlainText(node: Record<string, unknown>): string {
  if (node.type === 'text') return (node.text as string) ?? ''
  const children = (node.content as Record<string, unknown>[]) ?? []
  const childText = children.map(extractPlainText).join('')
  if (node.type === 'paragraph' || node.type === 'heading') {
    return childText ? childText + '\n' : '\n'
  }
  return childText
}

interface SnippetEditorProps {
  open: boolean
  snippetId?: string
  novelId: string
  onClose: () => void
}

export function SnippetEditor({ open, snippetId, novelId, onClose }: SnippetEditorProps) {
  const snippet = useSnippet(snippetId)
  const updateSnippet = useUpdateSnippet()
  const deleteSnippet = useDeleteSnippet()

  const [name, setName] = useState('')
  const [content, setContent] = useState<Record<string, unknown>>({})
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [revHistoryOpen, setRevHistoryOpen] = useState(false)
  const [extractOpen, setExtractOpen] = useState(false)

  const saveRevision = useRevision(RevisionEntityType.SnippetContent, snippetId)

  useEffect(() => {
    if (snippet) {
      setName(snippet.name)
      setContent(snippet.content)
      setTags(snippet.tags)
    }
  }, [snippet?.id]) // only reset on snippet identity change, not every update

  const saveName = useCallback(async () => {
    if (!snippetId) return
    await updateSnippet(snippetId, { name })
  }, [snippetId, name, updateSnippet])

  const saveContent = useCallback(async () => {
    if (!snippetId || !snippet) return
    const prev = JSON.stringify(snippet.content)
    if (prev && prev !== '{}') await saveRevision(prev)
    await updateSnippet(snippetId, { content })
  }, [snippetId, snippet, content, saveRevision, updateSnippet])

  const debouncedSaveName = useDebouncedSave(saveName, 600)
  const debouncedSaveContent = useDebouncedSave(saveContent, 800)

  const handleNameChange = (v: string) => {
    setName(v)
    debouncedSaveName()
  }

  const handleContentChange = (v: Record<string, unknown>) => {
    setContent(v)
    debouncedSaveContent()
  }

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
      e.preventDefault()
      const newTag = tagInput.trim().toLowerCase()
      if (!tags.includes(newTag)) {
        const next = [...tags, newTag]
        setTags(next)
        if (snippetId) updateSnippet(snippetId, { tags: next })
      }
      setTagInput('')
    } else if (e.key === 'Backspace' && !tagInput && tags.length > 0) {
      const next = tags.slice(0, -1)
      setTags(next)
      if (snippetId) updateSnippet(snippetId, { tags: next })
    }
  }

  const removeTag = (tag: string) => {
    const next = tags.filter(t => t !== tag)
    setTags(next)
    if (snippetId) updateSnippet(snippetId, { tags: next })
  }

  const handleDelete = async () => {
    if (!snippetId) return
    await deleteSnippet(snippetId)
    setDeleteOpen(false)
    onClose()
  }

  const handleRestoreRevision = async (revContent: string) => {
    if (!snippetId) return
    try {
      const parsed = JSON.parse(revContent) as Record<string, unknown>
      setContent(parsed)
      await updateSnippet(snippetId, { content: parsed })
    } catch {
      // content was stored as plain text in older format
    }
  }

  if (!snippet && open) return null

  return (
    <>
      <Sheet open={open} onOpenChange={v => !v && onClose()}>
        <SheetContent side="right" className="flex w-[480px] flex-col gap-0 p-0 sm:max-w-[480px]">
          <SheetHeader className="flex flex-row items-center gap-2 border-b px-4 py-3">
            <SheetTitle className="sr-only">Edit snippet</SheetTitle>
            <Input
              value={name}
              onChange={e => handleNameChange(e.target.value)}
              placeholder="Snippet name…"
              className="h-8 flex-1 border-0 bg-transparent px-0 text-sm font-semibold shadow-none focus-visible:ring-0"
            />
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={() => setExtractOpen(true)}
              title="Extract content"
            >
              <Scissors className="h-3.5 w-3.5" />
              <span className="sr-only">Extract content</span>
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={() => setRevHistoryOpen(true)}
              title="Version history"
            >
              <History className="h-3.5 w-3.5" />
              <span className="sr-only">Version history</span>
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="text-destructive hover:text-destructive h-7 w-7"
              onClick={() => setDeleteOpen(true)}
              title="Delete snippet"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span className="sr-only">Delete snippet</span>
            </Button>
            <Separator orientation="vertical" className="h-5" />
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onClose}>
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </SheetHeader>

          {/* Tags */}
          <div className="shrink-0 border-b px-4 py-2">
            <div className="flex flex-wrap items-center gap-1">
              <Tag className="text-muted-foreground h-3.5 w-3.5 shrink-0" />
              {tags.map(tag => (
                <Badge key={tag} variant="secondary" className="gap-1 pr-1 text-xs">
                  {tag}
                  <button
                    onClick={() => removeTag(tag)}
                    className="hover:text-destructive ml-0.5 transition-colors"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </Badge>
              ))}
              <Input
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                placeholder={tags.length === 0 ? 'Add tags…' : ''}
                className="h-6 min-w-[80px] flex-1 border-0 bg-transparent px-1 text-xs shadow-none focus-visible:ring-0"
              />
            </div>
            <p className="text-muted-foreground mt-0.5 text-[11px]">
              Press Enter or comma to add a tag
            </p>
          </div>

          {/* Content editor */}
          <div className="flex-1 overflow-auto p-4">
            <ProseEditor
              content={content}
              onChange={handleContentChange}
              placeholder="Write your snippet content here…"
              minHeight="200px"
              className="h-full"
            />
          </div>
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete snippet?"
        description="This snippet will be permanently deleted and cannot be recovered."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        destructive
      />

      {snippetId && (
        <RevisionHistoryModal
          open={revHistoryOpen}
          onOpenChange={setRevHistoryOpen}
          entityType={RevisionEntityType.SnippetContent}
          entityId={snippetId}
          onRestore={handleRestoreRevision}
        />
      )}

      <ExtractModal
        open={extractOpen}
        onClose={() => setExtractOpen(false)}
        content={extractPlainText(content as Record<string, unknown>)}
        novelId={novelId}
      />
    </>
  )
}
