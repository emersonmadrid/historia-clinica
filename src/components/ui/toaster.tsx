'use client'

import { ToastProvider, ToastViewport, Toast } from '@/components/ui/toast'
import { useToastStore } from '@/hooks/useToast'

export function Toaster() {
  const { items, dismiss } = useToastStore()

  return (
    <ToastProvider swipeDirection="right">
      {items.map((toast) => (
        <Toast
          key={toast.id}
          open={toast.open}
          onOpenChange={(open) => { if (!open) dismiss(toast.id) }}
          variant={toast.variant}
          title={toast.title}
          description={toast.description}
        />
      ))}
      <ToastViewport />
    </ToastProvider>
  )
}
