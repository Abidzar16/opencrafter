import type { GenerationRequest, StreamChunk } from '@/types'

export interface AIProvider {
  name: string
  supportsStreaming: boolean
  supportsThinking: boolean
  complete(request: GenerationRequest, apiKey: string, baseUrl?: string, signal?: AbortSignal): AsyncIterable<StreamChunk>
}
