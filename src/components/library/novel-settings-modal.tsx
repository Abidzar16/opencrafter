import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { ImageUpload } from '@/components/ui/image-upload'
import { useUpdateNovel } from '@/lib/db/hooks/novels'
import type { Novel } from '@/types'
import { toast } from '@/components/ui/toast-provider'

interface NovelSettingsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  novel: Novel
}

export function NovelSettingsModal({ open, onOpenChange, novel }: NovelSettingsModalProps) {
  const [title, setTitle] = useState(novel.title)
  const [description, setDescription] = useState(novel.description ?? '')
  const [coverImage, setCoverImage] = useState(novel.coverImage)
  const [loading, setLoading] = useState(false)

  const updateNovel = useUpdateNovel()

  useEffect(() => {
    setTitle(novel.title)
    setDescription(novel.description ?? '')
    setCoverImage(novel.coverImage)
  }, [novel])

  async function handleSave() {
    if (!title.trim()) return
    setLoading(true)
    try {
      await updateNovel(novel.id, {
        title: title.trim(),
        description: description.trim() || undefined,
        coverImage,
      })
      onOpenChange(false)
      toast.success('Novel settings saved.')
    } catch {
      toast.error('Failed to save settings.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Novel Settings</DialogTitle>
        </DialogHeader>

        <div className="flex gap-4">
          <ImageUpload value={coverImage} onChange={setCoverImage} aspectRatio="portrait" />

          <div className="flex flex-1 flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="settings-title">Title</Label>
              <Input
                id="settings-title"
                value={title}
                onChange={e => setTitle(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="settings-description">Description</Label>
              <Textarea
                id="settings-description"
                rows={3}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Optional description…"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!title.trim() || loading}>
            {loading ? 'Saving…' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
