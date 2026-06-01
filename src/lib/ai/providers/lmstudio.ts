import { openaiProvider } from './openai'
import type { AIProvider } from './types'

const DEFAULT_BASE_URL = 'http://localhost:1234/v1'

export const lmstudioProvider: AIProvider = {
  name: 'LM Studio',
  supportsStreaming: true,
  supportsThinking: false,

  complete(request, apiKey, baseUrl, signal) {
    return openaiProvider.complete(request, apiKey ?? 'lm-studio', baseUrl ?? DEFAULT_BASE_URL, signal)
  },
}
