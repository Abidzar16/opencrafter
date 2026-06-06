import { useEffect } from 'react'
import { toast } from '@/components/ui/toast-provider'

const WARN_THRESHOLD = 0.8 // warn at 80% usage
const STORAGE_WARN_KEY = 'opencrafter:storage-warn-dismissed'
const DISMISS_TTL_MS = 7 * 24 * 60 * 60 * 1000 // re-warn after 7 days

/**
 * Checks storage quota once on mount. Shows a persistent warning toast
 * if IndexedDB usage exceeds 80% of the estimated quota.
 */
export function useStorageQuotaWarning() {
  useEffect(() => {
    if (!navigator.storage?.estimate) return

    navigator.storage.estimate().then(({ usage = 0, quota = 0 }) => {
      if (quota === 0) return
      const ratio = usage / quota
      if (ratio < WARN_THRESHOLD) return

      // Throttle: don't show again within the dismissal window
      const lastDismissed = localStorage.getItem(STORAGE_WARN_KEY)
      if (lastDismissed && Date.now() - Number(lastDismissed) < DISMISS_TTL_MS) return

      const usedMB = Math.round(usage / 1024 / 1024)
      const totalMB = Math.round(quota / 1024 / 1024)
      const pct = Math.round(ratio * 100)

      toast.warning('Storage almost full', {
        description: `You're using ${usedMB} MB of ~${totalMB} MB (${pct}%). Export a backup to avoid data loss.`,
        duration: Infinity,
        action: {
          label: 'Export backup',
          onClick: () => {
            localStorage.setItem(STORAGE_WARN_KEY, String(Date.now()))
            // Navigate to settings where backup export lives
            window.location.href = '/settings'
          },
        },
        onDismiss: () => {
          localStorage.setItem(STORAGE_WARN_KEY, String(Date.now()))
        },
      })
    })
  }, [])
}
