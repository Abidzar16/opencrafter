import { openaiProvider } from './openai'
import type { AIProvider } from './types'

// Generic OpenAI-compatible provider for any user-supplied base URL + key.
export const genericProvider: AIProvider = {
  name: 'Generic (OpenAI-compatible)',
  supportsStreaming: true,
  supportsThinking: false,

  complete(request, apiKey, baseUrl, signal) {
    if (!baseUrl) throw new Error('Generic provider requires a base URL')
    return openaiProvider.complete(request, apiKey, baseUrl, signal)
  },
}
