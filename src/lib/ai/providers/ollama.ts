import type { GenerationRequest, StreamChunk } from '@/types'
import type { AIProvider } from './types'

const DEFAULT_BASE_URL = 'http://localhost:11434'

export const ollamaProvider: AIProvider = {
  name: 'Ollama',
  supportsStreaming: true,
  supportsThinking: false,

  async *complete(
    request: GenerationRequest,
    _apiKey: string,
    baseUrl?: string,
    signal?: AbortSignal,
  ): AsyncIterable<StreamChunk> {
    const url = `${(baseUrl ?? DEFAULT_BASE_URL).replace(/\/$/, '')}/api/chat`

    const body: Record<string, unknown> = {
      model: request.modelId,
      messages: request.messages,
      stream: request.stream,
    }

    const options: Record<string, unknown> = {}
    if (request.temperature !== undefined) options['temperature'] = request.temperature
    if (request.topP !== undefined) options['top_p'] = request.topP
    if (request.maxTokens !== undefined) options['num_predict'] = request.maxTokens
    if (request.stopSequences?.length) options['stop'] = request.stopSequences
    if (Object.keys(options).length) body['options'] = options

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal,
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Ollama error ${response.status}: ${error}`)
    }

    if (!request.stream) {
      const data = (await response.json()) as {
        message: { content: string }
      }
      yield { text: data.message?.content ?? '', done: true }
      return
    }

    if (!response.body) throw new Error('No response body')

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed) continue
          let parsed: unknown
          try {
            parsed = JSON.parse(trimmed)
          } catch {
            continue
          }
          const obj = parsed as Record<string, unknown>
          const message = obj['message'] as Record<string, unknown> | undefined
          const text = message?.['content']
          if (typeof text === 'string' && text) {
            yield { text, done: false }
          }
          if (obj['done'] === true) {
            yield { text: '', done: true }
            return
          }
        }
      }
    } finally {
      reader.releaseLock()
    }

    yield { text: '', done: true }
  },
}
