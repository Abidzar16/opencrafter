import { openaiProvider } from './openai'
import type { AIProvider } from './types'

const GROQ_BASE_URL = 'https://api.groq.com/openai/v1'

export const groqProvider: AIProvider = {
  name: 'Groq',
  supportsStreaming: true,
  supportsThinking: false,

  complete(request, apiKey, baseUrl, signal) {
    return openaiProvider.complete(request, apiKey, baseUrl ?? GROQ_BASE_URL, signal)
  },
}
