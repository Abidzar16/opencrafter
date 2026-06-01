import { openaiProvider } from './openai'
import type { AIProvider } from './types'

const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1'

export const openrouterProvider: AIProvider = {
  name: 'OpenRouter',
  supportsStreaming: true,
  supportsThinking: false,

  complete(request, apiKey, baseUrl, signal) {
    return openaiProvider.complete(request, apiKey, baseUrl ?? OPENROUTER_BASE_URL, signal)
  },
}
