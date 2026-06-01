import db from '@/lib/db/db'
import { Provider } from '@/types'
import type { GenerationRequest, StreamChunk } from '@/types'
import type { AIProvider } from './providers/types'
import { openaiProvider } from './providers/openai'
import { anthropicProvider } from './providers/anthropic'
import { groqProvider } from './providers/groq'
import { ollamaProvider } from './providers/ollama'
import { lmstudioProvider } from './providers/lmstudio'
import { openrouterProvider } from './providers/openrouter'
import { genericProvider } from './providers/generic'

const REGISTRY: Record<Provider, AIProvider> = {
  [Provider.OpenAI]: openaiProvider,
  [Provider.Anthropic]: anthropicProvider,
  [Provider.Groq]: groqProvider,
  [Provider.Ollama]: ollamaProvider,
  [Provider.LmStudio]: lmstudioProvider,
  [Provider.OpenRouter]: openrouterProvider,
  [Provider.Generic]: genericProvider,
}

export function getProvider(provider: Provider): AIProvider {
  const p = REGISTRY[provider]
  if (!p) throw new Error(`Unknown provider: ${provider}`)
  return p
}

/**
 * Resolve the API key and base URL for a request from Dexie at call time.
 * Returns { apiKey, baseUrl } ready to pass to a provider's complete().
 */
async function resolveCredentials(
  request: GenerationRequest,
): Promise<{ apiKey: string; baseUrl?: string }> {
  if (!request.apiKeyRef) {
    // Local providers (Ollama, LM Studio) don't need a key
    return { apiKey: '' }
  }

  const stored = await db.api_keys.get(request.apiKeyRef)
  if (!stored) {
    throw new Error(
      `API key not found (ref: ${request.apiKeyRef}). Check AI Connections in Settings.`,
    )
  }

  return { apiKey: stored.key, baseUrl: stored.baseUrl }
}

/**
 * Main entry point for AI generation.
 * Resolves credentials from Dexie, then delegates to the appropriate provider.
 */
export async function* generate(
  request: GenerationRequest,
  signal?: AbortSignal,
): AsyncIterable<StreamChunk> {
  const provider = getProvider(request.provider)
  const { apiKey, baseUrl } = await resolveCredentials(request)
  yield* provider.complete(request, apiKey, baseUrl, signal)
}

export { parseSSEStream } from './stream'
export type { AIProvider } from './providers/types'
