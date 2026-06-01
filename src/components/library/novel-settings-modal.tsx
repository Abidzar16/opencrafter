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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { ImageUpload } from '@/components/ui/image-upload'
import { useUpdateNovel } from '@/lib/db/hooks/novels'
import { usePromptPersonas, usePrompts } from '@/lib/db/hooks'
import { PromptType } from '@/types'
import type { Novel } from '@/types'
import { toast } from '@/components/ui/toast-provider'

const NONE = '__none__'

interface NovelSettingsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  novel: Novel
}

export function NovelSettingsModal({ open, onOpenChange, novel }: NovelSettingsModalProps) {
  const [title, setTitle] = useState(novel.title)
  const [description, setDescription] = useState(novel.description ?? '')
  const [coverImage, setCoverImage] = useState(novel.coverImage)
  const [personaId, setPersonaId] = useState(novel.settings?.defaultPersonaId ?? NONE)
  const [beatPromptId, setBeatPromptId] = useState(novel.settings?.defaultBeatCompletionPromptId ?? NONE)
  const [loading, setLoading] = useState(false)

  const updateNovel = useUpdateNovel()
  const personas = usePromptPersonas() ?? []
  const allPrompts = usePrompts() ?? []
  const beatPrompts = allPrompts.filter(p => p.type === PromptType.BeatCompletion)
  const summaryPrompts = allPrompts.filter(p => p.type === PromptType.Summarization)
  const replacePrompts = allPrompts.filter(p => p.type === PromptType.TextReplacement)
  const chatPrompts = allPrompts.filter(p => p.type === PromptType.WorkshopChat)

  const [summaryPromptId, setSummaryPromptId] = useState(novel.settings?.defaultSummarizationPromptId ?? NONE)
  const [replacePromptId, setReplacePromptId] = useState(novel.settings?.defaultTextReplacementPromptId ?? NONE)
  const [chatPromptId, setChatPromptId] = useState(novel.settings?.defaultChatPromptId ?? NONE)

  useEffect(() => {
    setTitle(novel.title)
    setDescription(novel.description ?? '')
    setCoverImage(novel.coverImage)
    setPersonaId(novel.settings?.defaultPersonaId ?? NONE)
    setBeatPromptId(novel.settings?.defaultBeatCompletionPromptId ?? NONE)
    setSummaryPromptId(novel.settings?.defaultSummarizationPromptId ?? NONE)
    setReplacePromptId(novel.settings?.defaultTextReplacementPromptId ?? NONE)
    setChatPromptId(novel.settings?.defaultChatPromptId ?? NONE)
  }, [novel])

  async function handleSave() {
    if (!title.trim()) return
    setLoading(true)
    try {
      await updateNovel(novel.id, {
        title: title.trim(),
        description: description.trim() || undefined,
        coverImage,
        settings: {
          ...novel.settings,
          defaultPersonaId: personaId === NONE ? undefined : personaId,
          defaultBeatCompletionPromptId: beatPromptId === NONE ? undefined : beatPromptId,
          defaultSummarizationPromptId: summaryPromptId === NONE ? undefined : summaryPromptId,
          defaultTextReplacementPromptId: replacePromptId === NONE ? undefined : replacePromptId,
          defaultChatPromptId: chatPromptId === NONE ? undefined : chatPromptId,
        },
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
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Novel Settings</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 max-h-[70vh] overflow-y-auto py-1 pr-1">
          {/* Cover + basic info */}
          <div className="flex gap-4">
            <ImageUpload value={coverImage} onChange={setCoverImage} aspectRatio="portrait" />
            <div className="flex flex-1 flex-col gap-3">
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

          <Separator />

          {/* AI Persona */}
          <div className="space-y-1.5">
            <Label>AI Persona</Label>
            <p className="text-xs text-muted-foreground">
              Prepended to all system prompts for this novel. Overrides the account default.
            </p>
            <Select value={personaId} onValueChange={setPersonaId}>
              <SelectTrigger>
                <SelectValue placeholder="None" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>None (use account default)</SelectItem>
                {personas.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Default Prompts */}
          <div className="space-y-3">
            <div>
              <h4 className="text-sm font-medium">Default Prompts</h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                Override account defaults for this novel.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Beat Completion</Label>
              <Select value={beatPromptId} onValueChange={setBeatPromptId}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="Account default" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>Account default</SelectItem>
                  {beatPrompts.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Summarization</Label>
              <Select value={summaryPromptId} onValueChange={setSummaryPromptId}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="Account default" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>Account default</SelectItem>
                  {summaryPrompts.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Text Replacement</Label>
              <Select value={replacePromptId} onValueChange={setReplacePromptId}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="Account default" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>Account default</SelectItem>
                  {replacePrompts.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Workshop Chat</Label>
              <Select value={chatPromptId} onValueChange={setChatPromptId}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="Account default" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>Account default</SelectItem>
                  {chatPrompts.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
