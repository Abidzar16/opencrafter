import db from '@/lib/db/db'
import { tiptapToText } from './tiptap-to-text'
import type { ExportManuscript, ExportConfig } from './types'

export async function buildManuscript(
  novelId: string,
  config: ExportConfig,
): Promise<ExportManuscript> {
  const novel = await db.novels.get(novelId)
  const acts = await db.acts
    .where('[novelId+order]')
    .between([novelId, -Infinity], [novelId, Infinity])
    .toArray()

  const filteredActs =
    config.selectedActIds === 'all'
      ? acts.filter(a => !a.archived)
      : acts.filter(a => !a.archived && (config.selectedActIds as string[]).includes(a.id))

  const exportActs = await Promise.all(
    filteredActs.map(async act => {
      const chapters = await db.chapters
        .where('[novelId+order]')
        .between([novelId, -Infinity], [novelId, Infinity])
        .filter(c => c.actId === act.id && !c.archived)
        .toArray()

      const exportChapters = await Promise.all(
        chapters.map(async chapter => {
          const scenes = await db.scenes
            .where('[novelId+order]')
            .between([novelId, -Infinity], [novelId, Infinity])
            .filter(s => s.chapterId === chapter.id && !s.archived)
            .toArray()

          const exportScenes = await Promise.all(
            scenes.map(async scene => {
              const sc = await db.scene_content.get(scene.id)
              const content = sc?.content
                ? tiptapToText(sc.content)
                : ''
              return {
                id: scene.id,
                title: scene.title,
                summary: scene.summary,
                content,
              }
            }),
          )

          return { id: chapter.id, title: chapter.title, scenes: exportScenes }
        }),
      )

      return { id: act.id, title: act.title, chapters: exportChapters }
    }),
  )

  return { novelTitle: novel?.title ?? 'Untitled', acts: exportActs }
}
