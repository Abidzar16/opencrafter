import {
  Document,
  Packer,
  Paragraph,
  HeadingLevel,
  TextRun,
  AlignmentType,
  PageBreak,
} from 'docx'
import type { ExportManuscript, ExportConfig } from './types'

export async function exportDocx(
  manuscript: ExportManuscript,
  config: ExportConfig,
): Promise<Blob> {
  const children: Paragraph[] = []

  if (config.includeFrontMatter) {
    children.push(
      new Paragraph({
        text: manuscript.novelTitle,
        heading: HeadingLevel.TITLE,
        alignment: AlignmentType.CENTER,
      }),
      new Paragraph({ children: [new PageBreak()] }),
    )
  }

  for (const act of manuscript.acts) {
    children.push(
      new Paragraph({ text: act.title, heading: HeadingLevel.HEADING_1 }),
    )
    for (const chapter of act.chapters) {
      children.push(
        new Paragraph({ text: chapter.title, heading: HeadingLevel.HEADING_2 }),
      )
      for (const scene of chapter.scenes) {
        children.push(
          new Paragraph({ text: scene.title, heading: HeadingLevel.HEADING_3 }),
        )
        if (scene.content.trim()) {
          for (const para of scene.content.split('\n\n')) {
            const text = para.trim()
            if (text) {
              children.push(new Paragraph({ children: [new TextRun(text)] }))
            }
          }
        }
        children.push(
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: '* * *' })],
          }),
        )
      }
    }
  }

  const doc = new Document({
    sections: [{ properties: {}, children }],
  })

  return Packer.toBlob(doc)
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
