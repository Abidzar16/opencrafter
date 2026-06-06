import { createRootRoute, Outlet } from '@tanstack/react-router'
import { ToastProvider } from '@/components/ui/toast-provider'
import { TooltipProvider } from '@/components/ui/tooltip'
import { useStorageQuotaWarning } from '@/lib/hooks/use-storage-quota'

export const Route = createRootRoute({
  component: RootLayout,
})

function RootLayout() {
  useStorageQuotaWarning()

  return (
    <TooltipProvider>
      <Outlet />
      <ToastProvider />
    </TooltipProvider>
  )
}
