import { useState, useMemo } from 'react'
import { Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { useLiveQuery } from 'dexie-react-hooks'
import db from '@/lib/db/db'
import { CodexType } from '@/types'
import type { CodexEntry } from '@/types'

interface ExtractModalProps {
  open: boolean
  onClose: () => void
  content: string
  novelId: string
}

// --- Codex parser: `Name (alias1, alias2) [tag1, tag2]: Description` ---
interface ParsedCodexEntry {
  name: string
  aliases: string[]
  tags: string[]
  description: string
  selected: boolean
}

function parseCodexEntries(text: string): ParsedCodexEntry[] {
  const lines = text.split('\n').filter(l => l.trim())
  const results: ParsedCodexEntry[] = []

  for (const line of lines) {
    // Try `Name (aliases) [tags]: Description`
    const match = line.match(/^([^([:\n]+?)(?:\s*\(([^)]*)\))?(?:\s*\[([^\]]*)\])?\s*:\s*(.+)$/)
    if (match) {
      const [, name, aliasStr, tagStr, desc] = match
      const aliases = aliasStr ? aliasStr.split(',').map(s => s.trim()).filter(Boolean) : []
      const tags = tagStr ? tagStr.split(',').map(s => s.trim()).filter(Boolean) : []
      results.push({ name: name.trim(), aliases, tags, description: desc.trim(), selected: true })
    }
  }

  return results
}

// --- Plan parser: `#` → act, `##` → chapter, plain text → scene ---
interface ParsedStructure {
  acts: Array<{
    title: string
    chapters: Array<{
      title: string
      scenes: string[]
    }>
  }>
}

function parsePlanStructure(text: string): ParsedStructure {
  const lines = text.split('\n')
  const result: ParsedStructure = { acts: [] }
  let currentAct: ParsedStructure['acts'][0] | null = null
  let currentChapter: ParsedStructure['acts'][0]['chapters'][0] | null = null

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue

    if (trimmed.startsWith('# ')) {
      currentAct = { title: trimmed.slice(2).trim(), chapters: [] }
      result.acts.push(currentAct)
      currentChapter = null
    } else if (trimmed.startsWith('## ')) {
      if (!currentAct) {
        currentAct = { title: 'Act 1', chapters: [] }
        result.acts.push(currentAct)
      }
      currentChapter = { title: trimmed.slice(3).trim(), scenes: [] }
      currentAct.chapters.push(currentChapter)
    } else if (!trimmed.startsWith('#')) {
      if (!currentAct) {
        currentAct = { title: 'Act 1', chapters: [] }
        result.acts.push(currentAct)
      }
      if (!currentChapter) {
        currentChapter = { title: 'Chapter 1', scenes: [] }
        currentAct.chapters.push(currentChapter)
      }
      currentChapter.scenes.push(trimmed)
    }
  }

  return result
}

export function ExtractModal({ open, onClose, content, novelId }: ExtractModalProps) {
  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-2xl h-[70vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-5 pb-3 border-b">
          <DialogTitle>Extract from AI Response</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="codex" className="flex flex-1 flex-col min-h-0">
          <TabsList className="mx-6 mt-3 self-start">
            <TabsTrigger value="codex">Codex Entries</TabsTrigger>
            <TabsTrigger value="plan">Plan Chapters</TabsTrigger>
            <TabsTrigger value="beats">Scene Beats</TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 mt-2">
            <TabsContent value="codex" className="mt-0 p-4">
              <CodexExtractTab content={content} novelId={novelId} onDone={onClose} />
            </TabsContent>

            <TabsContent value="plan" className="mt-0 p-4">
              <PlanExtractTab content={content} novelId={novelId} onDone={onClose} />
            </TabsContent>

            <TabsContent value="beats" className="mt-0 p-4">
              <BeatsExtractTab content={content} onDone={onClose} />
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

// --- Codex Extract ---
function CodexExtractTab({ content, novelId, onDone }: { content: string; novelId: string; onDone: () => void }) {
  const [entries, setEntries] = useState<ParsedCodexEntry[]>(() => parseCodexEntries(content))
  const [creating, setCreating] = useState(false)

  const existing = useLiveQuery(
    () => db.codex_entries.where('novelId').equals(novelId).toArray(),
    [novelId],
  ) ?? []

  const existingNames = new Set(existing.map((e: CodexEntry) => e.name.toLowerCase()))

  function toggleEntry(i: number) {
    setEntries(prev => prev.map((e, idx) => idx === i ? { ...e, selected: !e.selected } : e))
  }

  async function handleCreate() {
    const toCreate = entries.filter(e => e.selected)
    if (!toCreate.length) return
    setCreating(true)
    try {
      const now = Date.now()
      for (const entry of toCreate) {
        await db.codex_entries.add({
          id: crypto.randomUUID(),
          novelId,
          type: CodexType.Other,
          name: entry.name,
          aliases: entry.aliases,
          description: {
            type: 'doc',
            content: [{ type: 'paragraph', content: [{ type: 'text', text: entry.description }] }],
          },
          notes: { type: 'doc', content: [] },
          details: [],
          tags: entry.tags,
          trackingSettings: { enabled: true, caseSensitive: false, exclusions: [] },
          aiContextMode: 'include_when_detected',
          mentionCount: 0,
          createdAt: now,
          updatedAt: now,
        })
      }
      toast.success(`Created ${toCreate.length} codex entr${toCreate.length === 1 ? 'y' : 'ies'}`)
      onDone()
    } catch {
      toast.error('Failed to create codex entries')
    } finally {
      setCreating(false)
    }
  }

  if (entries.length === 0) {
    return (
      <div className="space-y-3">
        <p className="text-muted-foreground text-sm">
          No entries detected. Expected format per line:
        </p>
        <pre className="bg-muted rounded p-3 text-xs">
          Name (alias1, alias2) [tag1, tag2]: Description
        </pre>
        <p className="text-muted-foreground text-xs">Parentheses and brackets are optional.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-muted-foreground text-sm">
        Select entries to create in the Codex:
      </p>
      <div className="space-y-2">
        {entries.map((entry, i) => {
          const isDuplicate = existingNames.has(entry.name.toLowerCase())
          return (
            <label
              key={i}
              className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 ${entry.selected ? 'border-primary bg-accent/30' : 'border-border'}`}
            >
              <input
                type="checkbox"
                checked={entry.selected}
                onChange={() => toggleEntry(i)}
                className="mt-0.5 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{entry.name}</span>
                  {isDuplicate && <Badge variant="outline" className="text-xs">exists</Badge>}
                  {entry.aliases.length > 0 && (
                    <span className="text-muted-foreground text-xs">({entry.aliases.join(', ')})</span>
                  )}
                  {entry.tags.map(t => (
                    <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>
                  ))}
                </div>
                <p className="text-muted-foreground mt-1 text-sm">{entry.description}</p>
              </div>
            </label>
          )
        })}
      </div>
      <Button
        onClick={handleCreate}
        disabled={creating || entries.every(e => !e.selected)}
        className="w-full"
      >
        Create {entries.filter(e => e.selected).length} Entr{entries.filter(e => e.selected).length === 1 ? 'y' : 'ies'}
      </Button>
    </div>
  )
}

// --- Plan Extract ---
function PlanExtractTab({ content, novelId, onDone }: { content: string; novelId: string; onDone: () => void }) {
  const structure = useMemo(() => parsePlanStructure(content), [content])
  const [appending, setAppending] = useState(false)

  const totalScenes = structure.acts.reduce((sum, a) =>
    sum + a.chapters.reduce((s2, c) => s2 + c.scenes.length, 0), 0)
  const totalChapters = structure.acts.reduce((sum, a) => sum + a.chapters.length, 0)

  async function handleAppend() {
    setAppending(true)
    try {
      const now = Date.now()

      // Find current max order for acts in this novel
      const existingActs = await db.acts.where('novelId').equals(novelId).sortBy('order')
      let actOrder = (existingActs[existingActs.length - 1]?.order ?? -1) + 1

      for (const act of structure.acts) {
        const actId = crypto.randomUUID()
        await db.acts.add({ id: actId, novelId, title: act.title, order: actOrder++, archived: false, createdAt: now, updatedAt: now })

        let chapterOrder = 0
        for (const ch of act.chapters) {
          const chapterId = crypto.randomUUID()
          await db.chapters.add({ id: chapterId, novelId, actId, title: ch.title, order: chapterOrder++, archived: false, createdAt: now, updatedAt: now })

          let sceneOrder = 0
          for (const sceneText of ch.scenes) {
            const sceneId = crypto.randomUUID()
            await db.scenes.add({
              id: sceneId,
              novelId,
              chapterId,
              title: sceneText.length > 60 ? sceneText.slice(0, 58) + '…' : sceneText,
              summary: sceneText,
              order: sceneOrder++,
              beats: [],
              wordCount: 0,
              labels: [],
              codexAssociations: [],
              archived: false,
              createdAt: now,
              updatedAt: now,
            })
          }
        }
      }
      toast.success(`Appended ${structure.acts.length} act(s), ${totalChapters} chapter(s), ${totalScenes} scene(s) to Plan`)
      onDone()
    } catch {
      toast.error('Failed to append structure')
    } finally {
      setAppending(false)
    }
  }

  if (structure.acts.length === 0) {
    return (
      <div className="space-y-3">
        <p className="text-muted-foreground text-sm">No structure detected. Expected format:</p>
        <pre className="bg-muted rounded p-3 text-xs">{`# Act One\n## Chapter 1\nScene summary here\n\n## Chapter 2\nAnother scene`}</pre>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-muted-foreground text-sm">
        Preview — will be appended to your current Plan:
      </p>
      <div className="bg-muted rounded-lg p-3 space-y-2">
        {structure.acts.map((act, ai) => (
          <div key={ai}>
            <p className="font-semibold text-sm">{act.title}</p>
            {act.chapters.map((ch, ci) => (
              <div key={ci} className="ml-3">
                <p className="text-sm">{ch.title}</p>
                {ch.scenes.map((sc, si) => (
                  <p key={si} className="text-muted-foreground ml-3 text-xs">– {sc.length > 80 ? sc.slice(0, 78) + '…' : sc}</p>
                ))}
              </div>
            ))}
          </div>
        ))}
      </div>
      <Button onClick={handleAppend} disabled={appending} className="w-full">
        Append to Plan
      </Button>
    </div>
  )
}

// --- Beats Extract ---
function BeatsExtractTab({ content, onDone }: { content: string; onDone: () => void }) {
  const [copied, setCopied] = useState(false)

  // Extract lines that look like beats (numbered or bulleted)
  const beatLines = content.split('\n').filter(l => {
    const t = l.trim()
    return t && (
      /^\d+[\.\)]\s/.test(t) ||
      /^[-*•]\s/.test(t) ||
      /^beat\s*\d*:/i.test(t)
    )
  })

  const beatText = beatLines.length > 0
    ? beatLines.map(l => l.trim()).join('\n')
    : content.trim()

  function handleCopy() {
    navigator.clipboard.writeText(beatText).catch(() => null)
    setCopied(true)
    toast.success('Beats copied to clipboard')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-3">
      <p className="text-muted-foreground text-sm">
        Copy the extracted beats to paste into the Write editor:
      </p>
      <pre className="bg-muted rounded-lg p-3 text-sm whitespace-pre-wrap max-h-64 overflow-y-auto">
        {beatText}
      </pre>
      <Button onClick={handleCopy} className="w-full">
        {copied ? (
          <><Check className="mr-2 h-4 w-4" /> Copied!</>
        ) : (
          <><Copy className="mr-2 h-4 w-4" /> Copy to Clipboard</>
        )}
      </Button>
    </div>
  )
}
