import { useState, useMemo } from 'react'
import { Download, FileText, FileType, Archive, Loader2, Check } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { useActs } from '@/lib/db/hooks'
import { buildManuscript } from '@/lib/export/build-manuscript'
import { exportMarkdown, downloadText } from '@/lib/export/markdown-exporter'
import { exportDocx, downloadBlob } from '@/lib/export/docx-exporter'
import { exportScrivener } from '@/lib/export/scrivener-exporter'
import { toast } from '@/components/ui/toast-provider'
import type { ExportFormat } from '@/lib/export/types'
import { cn } from '@/lib/utils'

interface ExportPanelProps {
  open: boolean
  novelId: string
  onClose: () => void
}

const FORMAT_OPTIONS: { value: ExportFormat; label: string; icon: React.ReactNode }[] = [
  { value: 'markdown', label: 'Markdown (.md)', icon: <FileText className="h-4 w-4" /> },
  { value: 'docx', label: 'Word Document (.docx)', icon: <FileType className="h-4 w-4" /> },
  { value: 'scrivener', label: 'Scrivener (.scriv.zip)', icon: <Archive className="h-4 w-4" /> },
  { value: 'txt', label: 'Plain Text (.txt)', icon: <FileText className="h-4 w-4" /> },
]

export function ExportPanel({ open, novelId, onClose }: ExportPanelProps) {
  const acts = useActs(novelId) ?? []
  const activeActs = useMemo(() => acts.filter(a => !a.archived), [acts])

  const [format, setFormat] = useState<ExportFormat>('markdown')
  const [includeFrontMatter, setIncludeFrontMatter] = useState(true)
  const [selectedActIds, setSelectedActIds] = useState<Set<string>>(() => new Set())
  const [loading, setLoading] = useState(false)

  const allSelected = selectedActIds.size === 0

  function toggleAct(id: string) {
    setSelectedActIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function handleExport() {
    setLoading(true)
    try {
      const config = {
        format,
        includeFrontMatter,
        selectedActIds: allSelected ? ('all' as const) : Array.from(selectedActIds),
      }
      const manuscript = await buildManuscript(novelId, config)
      const safeTitle = manuscript.novelTitle.replace(/[^a-zA-Z0-9 _-]/g, '_')

      if (format === 'markdown') {
        downloadText(exportMarkdown(manuscript, config), `${safeTitle}.md`, 'text/markdown')
      } else if (format === 'txt') {
        downloadText(exportMarkdown(manuscript, config), `${safeTitle}.txt`)
      } else if (format === 'docx') {
        downloadBlob(await exportDocx(manuscript, config), `${safeTitle}.docx`)
      } else if (format === 'scrivener') {
        downloadBlob(await exportScrivener(manuscript), `${safeTitle}.scriv.zip`)
      }

      toast.success('Export complete.')
    } catch {
      toast.error('Export failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent side="right" className="flex w-96 flex-col gap-0 p-0">
        <SheetHeader className="border-b px-4 py-3">
          <SheetTitle className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export Manuscript
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="space-y-5 p-4">
            {/* Format */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Format</p>
              <div className="space-y-1.5">
                {FORMAT_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setFormat(opt.value)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-md border px-3 py-2.5 text-sm transition-colors',
                      format === opt.value
                        ? 'border-primary bg-primary/5 font-medium'
                        : 'border-border hover:bg-muted',
                    )}
                  >
                    {opt.icon}
                    <span className="flex-1 text-left">{opt.label}</span>
                    {format === opt.value && <Check className="h-3.5 w-3.5 text-primary" />}
                  </button>
                ))}
              </div>
            </div>

            <Separator />

            {/* Act selection */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Include acts</p>
              <div className="space-y-1.5">
                <ToggleRow
                  label="All acts"
                  checked={allSelected}
                  onChange={() => setSelectedActIds(new Set())}
                />
                {activeActs.map(act => (
                  <ToggleRow
                    key={act.id}
                    label={act.title}
                    checked={allSelected || selectedActIds.has(act.id)}
                    onChange={() => toggleAct(act.id)}
                    indent
                  />
                ))}
              </div>
            </div>

            <Separator />

            {/* Options */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Options</p>
              <ToggleRow
                label="Include title page"
                checked={includeFrontMatter}
                onChange={() => setIncludeFrontMatter(v => !v)}
              />
            </div>
          </div>
        </ScrollArea>

        <div className="border-t p-4">
          <Button className="w-full" onClick={handleExport} disabled={loading}>
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            {loading ? 'Exporting…' : 'Export'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

function ToggleRow({
  label,
  checked,
  onChange,
  indent = false,
}: {
  label: string
  checked: boolean
  onChange: () => void
  indent?: boolean
}) {
  return (
    <button
      onClick={onChange}
      className={cn(
        'flex w-full items-center gap-2 rounded py-1 text-sm transition-colors hover:text-foreground',
        indent ? 'pl-4' : '',
        checked ? 'text-foreground' : 'text-muted-foreground',
      )}
    >
      <span
        className={cn(
          'flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 transition-colors',
          checked ? 'border-primary bg-primary' : 'border-muted-foreground',
        )}
      >
        {checked && <Check className="h-2.5 w-2.5 text-primary-foreground" />}
      </span>
      {label}
    </button>
  )
}
