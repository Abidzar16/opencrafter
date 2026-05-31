import { createFileRoute } from '@tanstack/react-router'
import { NovelLibrary } from '@/components/library/novel-library'

export const Route = createFileRoute('/')({
  component: NovelLibrary,
})
