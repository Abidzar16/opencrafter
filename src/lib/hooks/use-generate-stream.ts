import { useCallback, useRef } from 'react'
import { generate } from '@/lib/ai'
import { useAIStore } from '@/stores/ai-store'
import type { GenerationRequest } from '@/types'

interface UseGenerateStreamOptions {
  onChunk: (text: string) => void
  onDone: () => void
  onError: (error: Error) => void
}

export function useGenerateStream({ onChunk, onDone, onError }: UseGenerateStreamOptions) {
  const { startGeneration, finishGeneration, setError, abort: abortStore } = useAIStore()
  // Keep callbacks fresh without restarting effect
  const onChunkRef = useRef(onChunk)
  const onDoneRef = useRef(onDone)
  const onErrorRef = useRef(onError)
  onChunkRef.current = onChunk
  onDoneRef.current = onDone
  onErrorRef.current = onError

  const run = useCallback(async (request: GenerationRequest) => {
    const controller = startGeneration()

    try {
      for await (const chunk of generate(request, controller.signal)) {
        if (controller.signal.aborted) break
        if (!chunk.done) {
          onChunkRef.current(chunk.text)
        } else {
          onDoneRef.current()
          finishGeneration()
          return
        }
      }
      // Stream ended without explicit done chunk
      onDoneRef.current()
      finishGeneration()
    } catch (err) {
      if (controller.signal.aborted) {
        // User-initiated abort — treat as clean finish
        onDoneRef.current()
        finishGeneration()
        return
      }
      const e = err instanceof Error ? err : new Error(String(err))
      onErrorRef.current(e)
      setError()
    }
  }, [startGeneration, finishGeneration, setError])

  const abort = useCallback(() => {
    abortStore()
  }, [abortStore])

  return { run, abort }
}
