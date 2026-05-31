import { Toaster } from 'sonner'
export { toast } from 'sonner'

export function ToastProvider() {
  return (
    <Toaster
      position="bottom-right"
      toastOptions={{
        classNames: {
          toast: 'bg-card text-card-foreground border border-border shadow-lg',
          title: 'font-medium',
          description: 'text-muted-foreground text-sm',
          error: 'bg-destructive text-destructive-foreground border-destructive',
          success: 'border-green-500/30',
          warning: 'border-yellow-500/30',
          info: 'border-blue-500/30',
          actionButton: 'bg-primary text-primary-foreground',
        },
      }}
    />
  )
}
