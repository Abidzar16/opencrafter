import type { GenerationRequest, StreamChunk } from '@/types'
import { parseSSEStream } from '../stream'
import type { AIProvider } from './types'

const DEFAULT_BASE_URL = 'https://api.openai.com/v1'

export const openaiProvider: AIProvider = {
  name: 'OpenAI',
  supportsStreaming: true,
  supportsThinking: false,

  async *complete(
    request: GenerationRequest,
    apiKey: string,
    baseUrl?: string,
    signal?: AbortSignal,
  ): AsyncIterable<StreamChunk> {
    const url = `${baseUrl ?? DEFAULT_BASE_URL}/chat/completions`

    const body: Record<string, unknown> = {
      model: request.modelId,
      messages: request.messages,
      stream: request.stream,
    }
    if (request.temperature !== undefined) body['temperature'] = request.temperature
    if (request.topP !== undefined) body['top_p'] = request.topP
    if (request.maxTokens !== undefined) body['max_tokens'] = request.maxTokens
    if (request.stopSequences?.length) body['stop'] = request.stopSequences

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
      signal,
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`OpenAI error ${response.status}: ${error}`)
    }

    if (!request.stream) {
      const data = (await response.json()) as {
        choices: Array<{ message: { content: string }; finish_reason: string }>
      }
      const text = data.choices[0]?.message?.content ?? ''
      yield { text, done: true }
      return
    }

    if (!response.body) throw new Error('No response body')

    let fullText = ''
    for await (const chunk of parseSSEStream(response.body)) {
      fullText += chunk
      yield { text: chunk, done: false }
    }
    yield { text: '', done: true }
  },
}
