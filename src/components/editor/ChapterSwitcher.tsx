import { useChapters } from '@/lib/db/hooks'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { BookOpen } from 'lucide-react'

interface ChapterSwitcherProps {
  novelId: string
  activeChapterId: string | null
  onChapterChange: (chapterId: string) => void
}

export function ChapterSwitcher({ novelId, activeChapterId, onChapterChange }: ChapterSwitcherProps) {
  const chapters = useChapters(novelId) ?? []
  const active = chapters.find(c => c.id === activeChapterId)

  return (
    <Select value={activeChapterId ?? ''} onValueChange={onChapterChange}>
      <SelectTrigger className="h-8 w-60 text-sm">
        <BookOpen className="mr-2 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <SelectValue placeholder="Select chapter…">
          {active?.title ?? 'Select chapter…'}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {chapters
          .filter(c => !c.archived)
          .map(c => (
            <SelectItem key={c.id} value={c.id}>
              {c.title}
            </SelectItem>
          ))}
      </SelectContent>
    </Select>
  )
}
