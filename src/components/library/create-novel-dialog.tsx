import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ImageUpload } from '@/components/ui/image-upload'
import { useCreateNovel } from '@/lib/db/hooks/novels'
import { useSeries } from '@/lib/db/hooks/novels'
import { useNavigate } from '@tanstack/react-router'
import { toast } from '@/components/ui/toast-provider'

interface CreateNovelDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateNovelDialog({ open, onOpenChange }: CreateNovelDialogProps) {
  const [title, setTitle] = useState('')
  const [seriesId, setSeriesId] = useState<string>('none')
  const [coverImage, setCoverImage] = useState<string>()
  const [loading, setLoading] = useState(false)

  const seriesList = useSeries()
  const createNovel = useCreateNovel()
  const navigate = useNavigate()

  function handleClose() {
    setTitle('')
    setSeriesId('none')
    setCoverImage(undefined)
    onOpenChange(false)
  }

  async function handleCreate() {
    if (!title.trim()) return
    setLoading(true)
    try {
      const id = await createNovel({
        title: title.trim(),
        seriesId: seriesId === 'none' ? undefined : seriesId,
        coverImage,
        archived: false,
        settings: {},
      })
      handleClose()
      navigate({ to: '/novel/$novelId/plan', params: { novelId: id } })
    } catch {
      toast.error('Failed to create novel.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>New Novel</DialogTitle>
        </DialogHeader>

        <div className="flex gap-4">
          <ImageUpload value={coverImage} onChange={setCoverImage} aspectRatio="portrait" />

          <div className="flex flex-1 flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="novel-title">Title</Label>
              <Input
                id="novel-title"
                placeholder="My Novel"
                value={title}
                onChange={e => setTitle(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
                autoFocus
              />
            </div>

            {seriesList && seriesList.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <Label>Series (optional)</Label>
                <Select value={seriesId} onValueChange={setSeriesId}>
                  <SelectTrigger>
                    <SelectValue placeholder="No series" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No series</SelectItem>
                    {seriesList.map(s => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={!title.trim() || loading}>
            {loading ? 'Creating…' : 'Create Novel'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
