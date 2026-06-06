import db from '@/lib/db/db'
import type { ContextAttachment } from '@/types'

function extractPlainText(content: Record<string, unknown>): string {
  function traverse(node: Record<string, unknown>): string {
    if (node.type === 'text') return (node.text as string) ?? ''
    const children = (node.content as Record<string, unknown>[]) ?? []
    const childText = children.map(traverse).join('')
    if (node.type === 'paragraph' || node.type === 'heading') {
      return childText ? childText + '\n' : '\n'
    }
    return childText
  }
  return traverse(content).trim()
}

export async function buildChatContext(attachments: ContextAttachment[]): Promise<string> {
  const parts: string[] = []

  for (const att of attachments) {
    switch (att.type) {
      case 'full_novel': {
        const acts = await db.acts.where('novelId').equals(att.id).sortBy('order')
        const lines: string[] = ['## Novel Structure']
        for (const act of acts) {
          lines.push(`\n### Act: ${act.title}`)
          const chapters = await db.chapters.where('actId').equals(act.id).sortBy('order')
          for (const ch of chapters) {
            lines.push(`  **Chapter: ${ch.title}**`)
            const scenes = await db.scenes.where('chapterId').equals(ch.id).sortBy('order')
            for (const sc of scenes) {
              lines.push(`    - ${sc.title}${sc.summary ? ': ' + sc.summary : ''}`)
            }
          }
        }
        parts.push(lines.join('\n'))
        break
      }

      case 'act': {
        const act = await db.acts.get(att.id)
        if (act) {
          const lines: string[] = [`## Act: ${act.title}`]
          const chapters = await db.chapters.where('actId').equals(act.id).sortBy('order')
          for (const ch of chapters) {
            lines.push(`\n### Chapter: ${ch.title}`)
            const scenes = await db.scenes.where('chapterId').equals(ch.id).sortBy('order')
            for (const sc of scenes) {
              lines.push(`  - ${sc.title}${sc.summary ? ': ' + sc.summary : ''}`)
            }
          }
          parts.push(lines.join('\n'))
        }
        break
      }

      case 'chapter': {
        const chapter = await db.chapters.get(att.id)
        if (chapter) {
          const lines: string[] = [`## Chapter: ${chapter.title}`]
          const scenes = await db.scenes.where('chapterId').equals(att.id).sortBy('order')
          for (const scene of scenes) {
            lines.push(`\n### Scene: ${scene.title}`)
            if (scene.summary) lines.push(scene.summary)
            const sc = await db.scene_content.get(scene.id)
            if (sc?.content) {
              const text = extractPlainText(sc.content as Record<string, unknown>)
              if (text) lines.push(`\n${text}`)
            }
          }
          parts.push(lines.join('\n'))
        }
        break
      }

      case 'scene': {
        const scene = await db.scenes.get(att.id)
        const sc = await db.scene_content.get(att.id)
        if (scene || sc) {
          const lines: string[] = [`## Scene: ${scene?.title ?? att.label}`]
          if (scene?.summary) lines.push(`*Summary: ${scene.summary}*`)
          if (sc?.content) {
            const text = extractPlainText(sc.content as Record<string, unknown>)
            if (text) lines.push(`\n${text}`)
          }
          parts.push(lines.join('\n'))
        }
        break
      }

      case 'codex_entry': {
        const entry = await db.codex_entries.get(att.id)
        if (entry) {
          const lines: string[] = [`## ${entry.type}: ${entry.name}`]
          if (entry.aliases?.length) lines.push(`*Also known as: ${entry.aliases.join(', ')}*`)
          if (entry.description && Object.keys(entry.description).length > 0) {
            const text = extractPlainText(entry.description as Record<string, unknown>)
            if (text) lines.push(text)
          }
          if (entry.details?.length) {
            for (const d of entry.details) {
              lines.push(`- **${d.key}**: ${d.value}`)
            }
          }
          parts.push(lines.join('\n'))
        }
        break
      }

      case 'snippet': {
        const snippet = await db.snippets.get(att.id)
        if (snippet) {
          const lines: string[] = [`## Snippet: ${snippet.name}`]
          const text = extractPlainText(snippet.content as Record<string, unknown>)
          if (text) lines.push(text)
          parts.push(lines.join('\n'))
        }
        break
      }
    }
  }

  return parts.join('\n\n---\n\n')
}

export async function resolveChatSystemPrompt(
  promptInstructions: string,
  attachments: ContextAttachment[],
  personaInstructions?: string,
): Promise<string> {
  // Resolve {{component:name}} placeholders
  const components = await db.prompt_components.toArray()
  const componentMap = new Map(components.map(c => [c.name.toLowerCase(), c.content]))
  let system = promptInstructions.replace(/\{\{component:([^}]+)\}\}/g, (_, name: string) => {
    return componentMap.get(name.toLowerCase().trim()) ?? `[component: ${name.trim()}]`
  })

  // Append resolved context
  if (attachments.length > 0) {
    const contextText = await buildChatContext(attachments)
    if (contextText) {
      system = `${system}\n\n## Provided Context\n\n${contextText}`
    }
  }

  if (personaInstructions) {
    return `${personaInstructions}\n\n${system}`
  }
  return system
}
