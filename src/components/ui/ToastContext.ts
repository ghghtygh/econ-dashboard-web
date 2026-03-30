import { createContext } from 'react'

interface ToastContextValue {
  toast: (message: string, variant?: 'success' | 'error' | 'warning' | 'info') => void
}

export const ToastContext = createContext<ToastContextValue | null>(null)
