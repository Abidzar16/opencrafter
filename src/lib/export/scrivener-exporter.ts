import JSZip from 'jszip'
import type { ExportManuscript } from './types'

// Generates a minimal .scriv folder structure as a ZIP
// Acts → Folders, Chapters → Sub-folders, Scenes → .txt files
// Includes a binder.xml

export async function exportScrivener(manuscript: ExportManuscript): Promise<Blob> {
  const zip = new JSZip()
  const projectName = manuscript.novelTitle.replace(/[^a-zA-Z0-9 _-]/g, '_')
  const root = zip.folder(`${projectName}.scriv`)!

  // Files folder
  const filesFolder = root.folder('Files')!
  const docsFolder = filesFolder.folder('Docs')!

  let nextId = 1
  const binderItems: string[] = []

  function makeBinderItem(
    id: number,
    title: string,
    type: 'DraftFolder' | 'Folder' | 'Text',
    children: string[] = [],
    indent = 2,
  ): string {
    const pad = ' '.repeat(indent)
    const childXml = children.length
      ? `\n${pad}  <Children>\n${children.join('\n')}\n${pad}  </Children>\n${pad}`
      : ''
    return `${pad}<BinderItem ID="${id}" Type="${type}">\n${pad}  <Title>${escapeXml(title)}</Title>${childXml}\n${pad}</BinderItem>`
  }

  const actItems: string[] = []

  for (const act of manuscript.acts) {
    const actId = nextId++
    const chapterItems: string[] = []

    for (const chapter of act.chapters) {
      const chapterId = nextId++
      const sceneItems: string[] = []

      for (const scene of chapter.scenes) {
        const sceneId = nextId++
        // Write scene text file
        docsFolder.file(`${sceneId}.txt`, scene.content.trim() || '')
        sceneItems.push(makeBinderItem(sceneId, scene.title, 'Text', [], 6))
      }

      chapterItems.push(makeBinderItem(chapterId, chapter.title, 'Folder', sceneItems, 4))
    }

    actItems.push(makeBinderItem(actId, act.title, 'Folder', chapterItems, 3))
  }

  const manuscriptId = nextId++
  const manuscriptItem = makeBinderItem(
    manuscriptId,
    'Manuscript',
    'DraftFolder',
    actItems,
    2,
  )
  binderItems.push(manuscriptItem)

  const scrivxContent = `<?xml version="1.0" encoding="UTF-8"?>
<ScrivenerProject Version="2.0">
  <Binder>
${binderItems.join('\n')}
  </Binder>
</ScrivenerProject>`

  root.file(`${projectName}.scrivx`, scrivxContent)

  return zip.generateAsync({ type: 'blob' })
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
