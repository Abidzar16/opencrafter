import { createRootRoute, Outlet } from '@tanstack/react-router'
import { ToastProvider } from '@/components/ui/toast-provider'
import { TooltipProvider } from '@/components/ui/tooltip'

export const Route = createRootRoute({
  component: RootLayout,
})

function RootLayout() {
  return (
    <TooltipProvider>
      <Outlet />
      <ToastProvider />
    </TooltipProvider>
  )
}
