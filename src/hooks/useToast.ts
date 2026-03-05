import { useState, useEffect, useCallback } from 'react'
import type { ToastVariant } from '@/components/ui/toast'

interface ToastItem {
  id: string
  title?: string
  description?: string
  variant?: ToastVariant
  open: boolean
}

// Simple global store for toasts
let listeners: Array<(toasts: ToastItem[]) => void> = []
let toasts: ToastItem[] = []

function notify(listeners: Array<(t: ToastItem[]) => void>, state: ToastItem[]) {
  listeners.forEach((l) => l(state))
}

export function toast(opts: { title?: string; description?: string; variant?: ToastVariant }) {
  const id = Math.random().toString(36).slice(2)
  toasts = [...toasts, { ...opts, id, open: true }]
  notify(listeners, toasts)

  // Auto-dismiss after 4s
  setTimeout(() => {
    toasts = toasts.map((t) => (t.id === id ? { ...t, open: false } : t))
    notify(listeners, toasts)
    // Remove from list after animation
    setTimeout(() => {
      toasts = toasts.filter((t) => t.id !== id)
      notify(listeners, toasts)
    }, 300)
  }, 4000)
}

export function useToastStore() {
  const [items, setItems] = useState<ToastItem[]>(toasts)

  useEffect(() => {
    const listener = (t: ToastItem[]) => setItems([...t])
    listeners.push(listener)
    return () => {
      listeners = listeners.filter((l) => l !== listener)
    }
  }, [])

  const dismiss = useCallback((id: string) => {
    toasts = toasts.map((t) => (t.id === id ? { ...t, open: false } : t))
    notify(listeners, toasts)
    setTimeout(() => {
      toasts = toasts.filter((t) => t.id !== id)
      notify(listeners, toasts)
    }, 300)
  }, [])

  return { items, dismiss }
}
