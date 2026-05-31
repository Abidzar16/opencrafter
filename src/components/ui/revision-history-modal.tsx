import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { useRevisions } from '@/lib/db/hooks/revisions'
import type { RevisionEntityType } from '@/types'
import { RotateCcw } from 'lucide-react'

interface RevisionHistoryModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  entityType: RevisionEntityType
  entityId: string
  onRestore: (content: string) => void
}

export function RevisionHistoryModal({
  open,
  onOpenChange,
  entityType,
  entityId,
  onRestore,
}: RevisionHistoryModalProps) {
  const revisions = useRevisions(entityType, entityId)
  const [selected, setSelected] = useState<string>()

  const selectedRevision = revisions?.find(r => r.id === selected)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Version History</DialogTitle>
        </DialogHeader>
        <div className="flex gap-4" style={{ height: 400 }}>
          <ScrollArea className="w-48 shrink-0 rounded-md border">
            <div className="p-2">
              {!revisions?.length && (
                <p className="text-muted-foreground p-2 text-sm">No revisions yet.</p>
              )}
              {revisions?.map(rev => (
                <button
                  key={rev.id}
                  onClick={() => setSelected(rev.id)}
                  className={`w-full rounded px-2 py-1.5 text-left text-sm transition-colors ${
                    selected === rev.id
                      ? 'bg-accent text-accent-foreground'
                      : 'hover:bg-muted'
                  }`}
                >
                  {new Date(rev.createdAt).toLocaleString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </button>
              ))}
            </div>
          </ScrollArea>
          <Separator orientation="vertical" />
          <div className="flex flex-1 flex-col gap-3">
            <ScrollArea className="flex-1 rounded-md border p-3">
              {selectedRevision ? (
                <pre className="text-sm whitespace-pre-wrap">{selectedRevision.content}</pre>
              ) : (
                <p className="text-muted-foreground text-sm">Select a version to preview.</p>
              )}
            </ScrollArea>
            {selectedRevision && (
              <Button
                size="sm"
                onClick={() => {
                  onRestore(selectedRevision.content)
                  onOpenChange(false)
                }}
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Restore this version
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
