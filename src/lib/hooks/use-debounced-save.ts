import { useRef, useCallback, useEffect } from 'react'
import { useUIStore } from '@/stores/ui-store'

/**
 * Returns a stable debounced trigger. Calling it marks save status as 'saving'
 * immediately, then fires `saveFn` after `delay` ms of inactivity.
 */
export function useDebouncedSave(saveFn: () => Promise<void>, delay = 800): () => void {
  const setSaveStatus = useUIStore(s => s.setSaveStatus)
  const saveFnRef = useRef(saveFn)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    saveFnRef.current = saveFn
  }, [saveFn])

  return useCallback(() => {
    if (resetTimerRef.current) {
      clearTimeout(resetTimerRef.current)
      resetTimerRef.current = null
    }
    setSaveStatus('saving')

    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(async () => {
      try {
        await saveFnRef.current()
        setSaveStatus('saved')
        resetTimerRef.current = setTimeout(() => setSaveStatus('idle'), 2000)
      } catch {
        setSaveStatus('error')
      }
    }, delay)
  }, [delay, setSaveStatus])
}
