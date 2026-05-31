import { create } from 'zustand'

export type GenerationStatus = 'idle' | 'generating' | 'error'

interface AIState {
  status: GenerationStatus
  abortController: AbortController | null
  activeStreamText: string

  startGeneration: () => AbortController
  appendStreamText: (chunk: string) => void
  finishGeneration: () => void
  setError: () => void
  abort: () => void
}

export const useAIStore = create<AIState>()(set => ({
  status: 'idle',
  abortController: null,
  activeStreamText: '',

  startGeneration: () => {
    const controller = new AbortController()
    set({ status: 'generating', abortController: controller, activeStreamText: '' })
    return controller
  },
  appendStreamText: chunk =>
    set(s => ({ activeStreamText: s.activeStreamText + chunk })),
  finishGeneration: () =>
    set({ status: 'idle', abortController: null }),
  setError: () =>
    set({ status: 'error', abortController: null }),
  abort: () =>
    set(s => {
      s.abortController?.abort()
      return { status: 'idle', abortController: null }
    }),
}))
