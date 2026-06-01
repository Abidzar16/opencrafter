import db from '@/lib/db/db'
import { buildAIContext, renderContextBlocks } from './context-builder'
import type { Prompt, ContextBlockConfig } from '@/types'

export interface TemplateContext {
  novelId: string
  sceneId?: string | null
  selectedText?: string
  priorText?: string
  manualEntryIds?: string[]
  inputs?: Record<string, string>
  personaInstructions?: string
}

export interface ContextBlock {
  label: string
  text: string
  type: ContextBlockConfig['blockType']
}

export interface ResolvedPrompt {
  messages: Array<{ role: 'system' | 'user'; content: string }>
  contextBlocks: ContextBlock[]
  resolvedSystem: string
}

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

async function assembleBlock(
  blockType: ContextBlockConfig['blockType'],
  ctx: TemplateContext,
  codexStr: string,
): Promise<ContextBlock | null> {
  switch (blockType) {
    case 'codex':
      return codexStr ? { label: 'Story Context', text: codexStr, type: 'codex' } : null

    case 'scene_content': {
      if (!ctx.sceneId) return null
      const sc = await db.scene_content.get(ctx.sceneId)
      if (!sc?.content) return null
      const text = extractPlainText(sc.content as Record<string, unknown>)
      return text ? { label: 'Scene Content', text, type: 'scene_content' } : null
    }

    case 'scene_summary': {
      if (!ctx.sceneId) return null
      const scene = await db.scenes.get(ctx.sceneId)
      if (!scene?.summary) return null
      return { label: 'Scene Summary', text: scene.summary, type: 'scene_summary' }
    }

    case 'beats': {
      if (!ctx.sceneId) return null
      const scene = await db.scenes.get(ctx.sceneId)
      if (!scene?.beats?.length) return null
      return {
        label: 'Beats',
        text: scene.beats.map((b, i) => `${i + 1}. ${b.text}`).join('\n'),
        type: 'beats',
      }
    }

    case 'prior_text':
      return ctx.priorText
        ? { label: 'Prior Text', text: ctx.priorText, type: 'prior_text' }
        : null

    case 'snippets':
      // Phase 7
      return null

    default:
      return null
  }
}

/**
 * Resolves a prompt at generation time.
 *
 * Steps:
 * 1. Assembles each enabled context block (sorted by `order`)
 * 2. Resolves `{{component:name}}` placeholders
 * 3. Resolves `{{variable}}` placeholders (inputs + context vars)
 * 4. Prepends persona instructions (if any)
 * 5. Returns the final message array
 */
export async function resolvePrompt(
  prompt: Prompt,
  ctx: TemplateContext,
): Promise<ResolvedPrompt> {
  // Build codex context
  const codexBlocks = await buildAIContext(
    ctx.novelId,
    ctx.sceneId ?? null,
    ctx.selectedText ?? '',
    ctx.manualEntryIds,
  )
  const codexStr = renderContextBlocks(codexBlocks)

  // Sort enabled blocks by order
  const enabledBlocks = [...prompt.contextConfig]
    .sort((a, b) => a.order - b.order)
    .filter(b => b.enabled)

  const contextBlocks: ContextBlock[] = []
  for (const block of enabledBlocks) {
    const assembled = await assembleBlock(block.blockType, ctx, codexStr)
    if (assembled) contextBlocks.push(assembled)
  }

  const contextSection = contextBlocks.map(b => `## ${b.label}\n${b.text}`).join('\n\n')

  // Load components for `{{component:name}}` resolution
  const components = await db.prompt_components.toArray()
  const componentMap = new Map(components.map(c => [c.name.toLowerCase(), c.content]))

  // Variable map — inputs take precedence over built-ins
  const vars: Record<string, string> = {
    context: contextSection,
    codex_context: codexStr,
    selected_text: ctx.selectedText ?? '',
    prior_text: ctx.priorText ?? '',
    scene_id: ctx.sceneId ?? '',
    novel_id: ctx.novelId,
    ...(ctx.inputs ?? {}),
  }

  let system = prompt.instructions

  // 1. Resolve {{component:name}}
  system = system.replace(/\{\{component:([^}]+)\}\}/g, (_, name: string) => {
    return componentMap.get(name.toLowerCase().trim()) ?? `[component: ${name.trim()}]`
  })

  // 2. Resolve {{variable}}
  system = system.replace(/\{\{([^}]+)\}\}/g, (_, key: string) => {
    return vars[key.trim()] ?? ''
  })

  // If the template didn't embed {{context}}, append the context section automatically
  const hasContextPlaceholder = prompt.instructions.includes('{{context}}')
  const resolvedSystem =
    !hasContextPlaceholder && contextSection ? `${system}\n\n${contextSection}` : system

  // Prepend persona instructions
  const finalSystem = ctx.personaInstructions
    ? `${ctx.personaInstructions}\n\n${resolvedSystem}`
    : resolvedSystem

  const messages: Array<{ role: 'system' | 'user'; content: string }> = [
    { role: 'system', content: finalSystem },
  ]

  if (ctx.selectedText) {
    messages.push({ role: 'user', content: ctx.selectedText })
  }

  return {
    messages,
    contextBlocks,
    resolvedSystem: finalSystem,
  }
}
