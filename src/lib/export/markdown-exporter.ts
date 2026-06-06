import type { ExportManuscript, ExportConfig } from './types'

export function exportMarkdown(manuscript: ExportManuscript, config: ExportConfig): string {
  const lines: string[] = []

  if (config.includeFrontMatter) {
    lines.push(`# ${manuscript.novelTitle}`, '')
  }

  for (const act of manuscript.acts) {
    lines.push(`# ${act.title}`, '')
    for (const chapter of act.chapters) {
      lines.push(`## ${chapter.title}`, '')
      for (const scene of chapter.scenes) {
        lines.push(`### ${scene.title}`, '')
        if (scene.content.trim()) {
          lines.push(scene.content.trim(), '')
        }
        lines.push('---', '')
      }
    }
  }

  return lines.join('\n')
}

export function downloadText(content: string, filename: string, mime = 'text/plain') {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
