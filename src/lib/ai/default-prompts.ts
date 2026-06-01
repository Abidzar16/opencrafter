import type { Prompt } from '@/types'
import { PromptType } from '@/types'
import db from '@/lib/db/db'

type DefaultPromptDef = Omit<Prompt, 'id' | 'createdAt' | 'updatedAt'>

const ALL_CONTEXT_BLOCKS: Prompt['contextConfig'] = [
  { blockType: 'codex', enabled: true, order: 0 },
  { blockType: 'scene_summary', enabled: true, order: 1 },
  { blockType: 'beats', enabled: true, order: 2 },
  { blockType: 'scene_content', enabled: false, order: 3 },
  { blockType: 'prior_text', enabled: false, order: 4 },
  { blockType: 'snippets', enabled: false, order: 5 },
]

const CODEX_ONLY: Prompt['contextConfig'] = [
  { blockType: 'codex', enabled: true, order: 0 },
  { blockType: 'scene_summary', enabled: false, order: 1 },
  { blockType: 'beats', enabled: false, order: 2 },
  { blockType: 'scene_content', enabled: false, order: 3 },
  { blockType: 'prior_text', enabled: false, order: 4 },
  { blockType: 'snippets', enabled: false, order: 5 },
]

const CONTENT_FOCUSED: Prompt['contextConfig'] = [
  { blockType: 'scene_content', enabled: true, order: 0 },
  { blockType: 'beats', enabled: true, order: 1 },
  { blockType: 'codex', enabled: false, order: 2 },
  { blockType: 'scene_summary', enabled: false, order: 3 },
  { blockType: 'prior_text', enabled: false, order: 4 },
  { blockType: 'snippets', enabled: false, order: 5 },
]

export const DEFAULT_PROMPTS: DefaultPromptDef[] = [
  {
    name: 'Beat Completion',
    type: PromptType.BeatCompletion,
    description: 'Generate vivid, engaging prose from a beat instruction.',
    instructions: `You are a skilled fiction writer. Generate vivid, engaging prose for the beat instruction provided by the user.

Return only the prose — no preamble, no explanation, no meta-commentary.

{{context}}`,
    contextConfig: ALL_CONTEXT_BLOCKS,
    inputs: [],
    modelSettings: {},
    readOnly: true,
  },
  {
    name: 'Scene Summarization',
    type: PromptType.Summarization,
    description: 'Summarize the scene in approximately 80 words.',
    instructions: `Summarize the following scene in approximately 80 words. Focus on the key plot points, character actions, and emotional beats. Be concise and clear.

{{context}}`,
    contextConfig: CONTENT_FOCUSED,
    inputs: [],
    modelSettings: { maxTokens: 200 },
    readOnly: true,
  },
  {
    name: 'Expand',
    type: PromptType.TextReplacement,
    description: 'Expand the selected passage with more detail and vivid description.',
    instructions: `You are a skilled fiction editor. Expand the following passage with more sensory detail, vivid description, and deeper characterization. Preserve the core meaning and narrative intent.

Return only the expanded text — no preamble, no explanation.

{{context}}`,
    contextConfig: ALL_CONTEXT_BLOCKS,
    inputs: [],
    modelSettings: {},
    readOnly: true,
  },
  {
    name: 'Shorten',
    type: PromptType.TextReplacement,
    description: 'Tighten and condense the selected passage.',
    instructions: `You are a skilled fiction editor. Condense the following passage — remove redundancy, tighten the prose, preserve the core meaning.

Return only the shortened text — no preamble, no explanation.

{{context}}`,
    contextConfig: ALL_CONTEXT_BLOCKS,
    inputs: [],
    modelSettings: {},
    readOnly: true,
  },
  {
    name: 'Increase Tension',
    type: PromptType.TextReplacement,
    description: 'Rewrite the selected passage to heighten tension and urgency.',
    instructions: `You are a skilled fiction editor. Rewrite the following passage to heighten tension, urgency, and stakes. Sharpen the language, increase the pace, and amplify the emotional charge.

Return only the rewritten text — no preamble, no explanation.

{{context}}`,
    contextConfig: ALL_CONTEXT_BLOCKS,
    inputs: [],
    modelSettings: {},
    readOnly: true,
  },
  {
    name: 'General Brainstorming',
    type: PromptType.WorkshopChat,
    description: 'Open-ended creative brainstorming partner for your story.',
    instructions: `You are a creative writing collaborator and brainstorming partner. Help the writer explore ideas, work through plot problems, and develop their story. Ask clarifying questions when helpful.

{{context}}`,
    contextConfig: [
      { blockType: 'codex', enabled: true, order: 0 },
      { blockType: 'scene_summary', enabled: true, order: 1 },
      { blockType: 'beats', enabled: false, order: 2 },
      { blockType: 'scene_content', enabled: false, order: 3 },
      { blockType: 'prior_text', enabled: false, order: 4 },
      { blockType: 'snippets', enabled: false, order: 5 },
    ],
    inputs: [],
    modelSettings: {},
    readOnly: true,
  },
  {
    name: 'Character Interview',
    type: PromptType.WorkshopChat,
    description: 'Interview a character in your story to discover their voice.',
    instructions: `You are roleplaying as a character from the writer's story. Answer questions in the character's voice, personality, and perspective. Stay in character throughout.

If the user has not specified which character to portray, ask them first.

{{context}}`,
    contextConfig: CODEX_ONLY,
    inputs: [],
    modelSettings: {},
    readOnly: true,
  },
  {
    name: 'Plot Troubleshooter',
    type: PromptType.WorkshopChat,
    description: 'Identify and fix plot holes, pacing issues, and story structure problems.',
    instructions: `You are an expert story editor and plot analyst. Help the writer identify and resolve plot holes, pacing issues, story structure problems, and logical inconsistencies.

Ask targeted questions to understand the problem, then offer concrete suggestions.

{{context}}`,
    contextConfig: [
      { blockType: 'codex', enabled: true, order: 0 },
      { blockType: 'scene_summary', enabled: true, order: 1 },
      { blockType: 'beats', enabled: false, order: 2 },
      { blockType: 'scene_content', enabled: false, order: 3 },
      { blockType: 'prior_text', enabled: false, order: 4 },
      { blockType: 'snippets', enabled: false, order: 5 },
    ],
    inputs: [],
    modelSettings: {},
    readOnly: true,
  },
]

/**
 * Seeds built-in default prompts if they haven't been seeded yet.
 * Idempotent — safe to call on every app startup.
 */
export async function seedDefaultPrompts(): Promise<void> {
  const all = await db.prompts.toArray()
  const hasBuiltIns = all.some(p => p.readOnly)
  if (hasBuiltIns) return

  const now = Date.now()
  const records = DEFAULT_PROMPTS.map(p => ({
    ...p,
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
  }))

  await db.prompts.bulkAdd(records)
}
