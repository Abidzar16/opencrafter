import type { GenerationRequest, StreamChunk } from '@/types'
import { parseSSEStream } from '../stream'
import type { AIProvider } from './types'

// Uses the nginx CORS proxy when deployed via Docker (ENABLE_ANTHROPIC_PROXY=true).
// Falls back to direct API call (works in local dev with CORS disabled or via browser extension).
const PROXY_BASE_URL = '/api/anthropic-proxy'
const DIRECT_BASE_URL = 'https://api.anthropic.com'
const ANTHROPIC_VERSION = '2023-06-01'

function getBaseUrl(baseUrl?: string): string {
  if (baseUrl) return baseUrl.replace(/\/$/, '')
  // Use proxy if running on same origin (production Docker), direct otherwise
  return window.location.hostname === 'localhost' || window.location.protocol === 'file:'
    ? DIRECT_BASE_URL
    : PROXY_BASE_URL
}

export const anthropicProvider: AIProvider = {
  name: 'Anthropic',
  supportsStreaming: true,
  supportsThinking: true,

  async *complete(
    request: GenerationRequest,
    apiKey: string,
    baseUrl?: string,
    signal?: AbortSignal,
  ): AsyncIterable<StreamChunk> {
    const base = getBaseUrl(baseUrl)
    const url = `${base}/v1/messages`

    // Separate system messages from user/assistant turns
    const systemMessages = request.messages.filter(m => m.role === 'system')
    const turnMessages = request.messages.filter(m => m.role !== 'system')
    const system = systemMessages.map(m => m.content).join('\n\n')

    const body: Record<string, unknown> = {
      model: request.modelId,
      messages: turnMessages,
      max_tokens: request.maxTokens ?? 4096,
      stream: request.stream,
    }
    if (system) body['system'] = system
    if (request.temperature !== undefined) body['temperature'] = request.temperature
    if (request.topP !== undefined) body['top_p'] = request.topP
    if (request.stopSequences?.length) body['stop_sequences'] = request.stopSequences

    // Extended thinking
    if (request.thinking) {
      body['thinking'] = {
        type: 'enabled',
        budget_tokens: request.thinkingBudgetTokens ?? 8000,
      }
      // Thinking requires temperature = 1
      body['temperature'] = 1
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': ANTHROPIC_VERSION,
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify(body),
      signal,
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Anthropic error ${response.status}: ${error}`)
    }

    if (!request.stream) {
      const data = (await response.json()) as {
        content: Array<{ type: string; text?: string }>
      }
      const text = data.content
        .filter(b => b.type === 'text')
        .map(b => b.text ?? '')
        .join('')
      yield { text, done: true }
      return
    }

    if (!response.body) throw new Error('No response body')

    for await (const chunk of parseSSEStream(response.body)) {
      yield { text: chunk, done: false }
    }
    yield { text: '', done: true }
  },
}
