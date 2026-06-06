import { describe, it, expect, vi, beforeEach } from 'vitest'
import { resolvePrompt } from './template-engine'
import type { Prompt, ContextBlockConfig } from '@/types'
import { PromptType } from '@/types'

// ─── Mock db ─────────────────────────────────────────────────────────────────

vi.mock('@/lib/db/db', () => ({
  default: {
    scenes: { get: vi.fn() },
    scene_content: { get: vi.fn() },
    codex_entries: { where: vi.fn() },
    codex_progressions: { where: vi.fn() },
    prompt_components: { toArray: vi.fn() },
  },
}))

vi.mock('./context-builder', () => ({
  buildAIContext: vi.fn().mockResolvedValue([]),
  renderContextBlocks: vi.fn().mockReturnValue(''),
}))

import db from '@/lib/db/db'
import { buildAIContext, renderContextBlocks } from './context-builder'

const mockDb = db as {
  scenes: { get: ReturnType<typeof vi.fn> }
  scene_content: { get: ReturnType<typeof vi.fn> }
  codex_entries: { where: ReturnType<typeof vi.fn> }
  codex_progressions: { where: ReturnType<typeof vi.fn> }
  prompt_components: { toArray: ReturnType<typeof vi.fn> }
}

function makePrompt(overrides: Partial<Prompt> = {}): Prompt {
  return {
    id: 'p1',
    name: 'Test Prompt',
    type: PromptType.BeatCompletion,
    description: '',
    instructions: 'You are a writer.',
    contextConfig: [] as ContextBlockConfig[],
    inputs: [],
    modelSettings: {},
    readOnly: false,
    createdAt: 0,
    updatedAt: 0,
    ...overrides,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  mockDb.prompt_components.toArray.mockResolvedValue([])
  ;(buildAIContext as ReturnType<typeof vi.fn>).mockResolvedValue([])
  ;(renderContextBlocks as ReturnType<typeof vi.fn>).mockReturnValue('')
})

// ─── Variable substitution ────────────────────────────────────────────────────

describe('resolvePrompt — variable substitution', () => {
  it('substitutes {{novel_id}} from ctx.novelId', async () => {
    const prompt = makePrompt({ instructions: 'Novel: {{novel_id}}' })
    const result = await resolvePrompt(prompt, { novelId: 'abc' })
    expect(result.resolvedSystem).toContain('Novel: abc')
  })

  it('substitutes {{scene_id}} from ctx.sceneId', async () => {
    const prompt = makePrompt({ instructions: 'Scene: {{scene_id}}' })
    const result = await resolvePrompt(prompt, { novelId: 'n1', sceneId: 's1' })
    expect(result.resolvedSystem).toContain('Scene: s1')
  })

  it('substitutes {{selected_text}} from ctx.selectedText', async () => {
    const prompt = makePrompt({ instructions: 'Source: {{selected_text}}' })
    const result = await resolvePrompt(prompt, {
      novelId: 'n1',
      selectedText: 'The dragon roared',
    })
    expect(result.resolvedSystem).toContain('Source: The dragon roared')
  })

  it('substitutes {{prior_text}} from ctx.priorText', async () => {
    const prompt = makePrompt({ instructions: 'Before: {{prior_text}}' })
    const result = await resolvePrompt(prompt, {
      novelId: 'n1',
      priorText: 'Once upon a time',
    })
    expect(result.resolvedSystem).toContain('Before: Once upon a time')
  })

  it('substitutes custom input variables from ctx.inputs', async () => {
    const prompt = makePrompt({ instructions: 'Tone: {{writing_tone}}' })
    const result = await resolvePrompt(prompt, {
      novelId: 'n1',
      inputs: { writing_tone: 'melancholic' },
    })
    expect(result.resolvedSystem).toContain('Tone: melancholic')
  })

  it('replaces missing variables with empty string', async () => {
    const prompt = makePrompt({ instructions: 'X: {{no_such_var}} end' })
    const result = await resolvePrompt(prompt, { novelId: 'n1' })
    expect(result.resolvedSystem).toContain('X:  end')
  })

  it('ctx.inputs override built-in variables with the same key', async () => {
    const prompt = makePrompt({ instructions: 'ID: {{novel_id}}' })
    const result = await resolvePrompt(prompt, {
      novelId: 'original',
      inputs: { novel_id: 'overridden' },
    })
    expect(result.resolvedSystem).toContain('ID: overridden')
  })
})

// ─── Component resolution ─────────────────────────────────────────────────────

describe('resolvePrompt — {{component:name}} resolution', () => {
  it('resolves a known component by name', async () => {
    mockDb.prompt_components.toArray.mockResolvedValue([
      { id: 'c1', name: 'Show Dont Tell', content: 'Show, do not tell.' },
    ])
    const prompt = makePrompt({
      instructions: '{{component:Show Dont Tell}}',
    })
    const result = await resolvePrompt(prompt, { novelId: 'n1' })
    expect(result.resolvedSystem).toContain('Show, do not tell.')
  })

  it('resolves component case-insensitively', async () => {
    mockDb.prompt_components.toArray.mockResolvedValue([
      { id: 'c1', name: 'Style Guide', content: 'Write in active voice.' },
    ])
    const prompt = makePrompt({ instructions: '{{component:style guide}}' })
    const result = await resolvePrompt(prompt, { novelId: 'n1' })
    expect(result.resolvedSystem).toContain('Write in active voice.')
  })

  it('uses a fallback placeholder for unknown components', async () => {
    mockDb.prompt_components.toArray.mockResolvedValue([])
    const prompt = makePrompt({ instructions: '{{component:missing}}' })
    const result = await resolvePrompt(prompt, { novelId: 'n1' })
    expect(result.resolvedSystem).toContain('[component: missing]')
  })
})

// ─── Persona prepending ───────────────────────────────────────────────────────

describe('resolvePrompt — persona', () => {
  it('prepends persona instructions before the system prompt', async () => {
    const prompt = makePrompt({ instructions: 'Write a scene.' })
    const result = await resolvePrompt(prompt, {
      novelId: 'n1',
      personaInstructions: 'You are Hemingway.',
    })
    expect(result.resolvedSystem).toMatch(/^You are Hemingway\./)
    expect(result.resolvedSystem).toContain('Write a scene.')
  })

  it('does not prepend anything when persona is absent', async () => {
    const prompt = makePrompt({ instructions: 'Write a scene.' })
    const result = await resolvePrompt(prompt, { novelId: 'n1' })
    expect(result.resolvedSystem).toBe('Write a scene.')
  })
})

// ─── Context auto-append ─────────────────────────────────────────────────────

describe('resolvePrompt — context appending', () => {
  it('appends context section when {{context}} is absent from instructions', async () => {
    ;(renderContextBlocks as ReturnType<typeof vi.fn>).mockReturnValue('## Codex\nAlice: a character')
    const prompt = makePrompt({
      instructions: 'Continue the story.',
      contextConfig: [{ blockType: 'codex', enabled: true, order: 0 }] as ContextBlockConfig[],
    })
    ;(buildAIContext as ReturnType<typeof vi.fn>).mockResolvedValue([
      { type: 'codex_entry', entryId: 'e1', name: 'Alice', entryType: 'Character', descriptionText: 'a character', appliedProgressions: [] },
    ])
    const result = await resolvePrompt(prompt, { novelId: 'n1' })
    expect(result.resolvedSystem).toContain('Continue the story.')
  })

  it('injects context inline when {{context}} is present in instructions', async () => {
    ;(renderContextBlocks as ReturnType<typeof vi.fn>).mockReturnValue('Alice context')
    const prompt = makePrompt({
      instructions: 'Context:\n{{context}}\nNow write.',
      contextConfig: [{ blockType: 'codex', enabled: true, order: 0 }] as ContextBlockConfig[],
    })
    ;(buildAIContext as ReturnType<typeof vi.fn>).mockResolvedValue([
      { type: 'codex_entry', entryId: 'e1', name: 'Alice', entryType: 'Character', descriptionText: '', appliedProgressions: [] },
    ])
    const result = await resolvePrompt(prompt, { novelId: 'n1' })
    expect(result.resolvedSystem).not.toContain('{{context}}')
  })
})

// ─── Context block ordering ───────────────────────────────────────────────────

describe('resolvePrompt — context block ordering', () => {
  it('respects the order field when assembling context blocks', async () => {
    mockDb.scenes.get.mockResolvedValue({ id: 's1', summary: 'A stormy night.', beats: [] })
    const prompt = makePrompt({
      instructions: 'Use: {{context}}',
      contextConfig: [
        { blockType: 'scene_summary', enabled: true, order: 0 },
        { blockType: 'prior_text', enabled: true, order: 1 },
      ] as ContextBlockConfig[],
    })
    const result = await resolvePrompt(prompt, {
      novelId: 'n1',
      sceneId: 's1',
      priorText: 'Rain fell.',
    })
    const sceneSummaryBlock = result.contextBlocks.find(b => b.type === 'scene_summary')
    const priorTextBlock = result.contextBlocks.find(b => b.type === 'prior_text')
    const summaryIdx = result.contextBlocks.indexOf(sceneSummaryBlock!)
    const priorIdx = result.contextBlocks.indexOf(priorTextBlock!)
    expect(summaryIdx).toBeLessThan(priorIdx)
  })

  it('excludes disabled context blocks', async () => {
    mockDb.scenes.get.mockResolvedValue({ id: 's1', summary: 'Summary text.', beats: [] })
    const prompt = makePrompt({
      instructions: 'Use: {{context}}',
      contextConfig: [
        { blockType: 'scene_summary', enabled: false, order: 0 },
      ] as ContextBlockConfig[],
    })
    const result = await resolvePrompt(prompt, { novelId: 'n1', sceneId: 's1' })
    expect(result.contextBlocks.find(b => b.type === 'scene_summary')).toBeUndefined()
  })
})

// ─── Messages array ───────────────────────────────────────────────────────────

describe('resolvePrompt — messages', () => {
  it('always includes a system message', async () => {
    const prompt = makePrompt({ instructions: 'Be helpful.' })
    const result = await resolvePrompt(prompt, { novelId: 'n1' })
    expect(result.messages[0]).toMatchObject({ role: 'system' })
  })

  it('adds a user message when selectedText is present', async () => {
    const prompt = makePrompt({ instructions: 'Rewrite:' })
    const result = await resolvePrompt(prompt, {
      novelId: 'n1',
      selectedText: 'The cat sat.',
    })
    expect(result.messages.some(m => m.role === 'user' && m.content === 'The cat sat.')).toBe(true)
  })

  it('does not add a user message when selectedText is absent', async () => {
    const prompt = makePrompt({ instructions: 'Summarize.' })
    const result = await resolvePrompt(prompt, { novelId: 'n1' })
    expect(result.messages.filter(m => m.role === 'user')).toHaveLength(0)
  })
})
