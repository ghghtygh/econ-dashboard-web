import { useState, useEffect, useCallback, type ReactNode } from 'react'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { ToastContext } from './ToastContext'

const toastVariants = cva(
  'flex items-start gap-3 w-full max-w-sm rounded-lg border p-4 shadow-lg transition-all',
  {
    variants: {
      variant: {
        success: 'border-green-800 bg-green-950/80 text-green-200',
        error: 'border-red-800 bg-red-950/80 text-red-200',
        warning: 'border-yellow-800 bg-yellow-950/80 text-yellow-200',
        info: 'border-blue-800 bg-blue-950/80 text-blue-200',
      },
    },
    defaultVariants: {
      variant: 'info',
    },
  },
)

type ToastVariant = NonNullable<VariantProps<typeof toastVariants>['variant']>

interface Toast {
  id: string
  message: string
  variant: ToastVariant
}

const ICONS: Record<ToastVariant, ReactNode> = {
  success: <CheckCircle size={18} />,
  error: <AlertCircle size={18} />,
  warning: <AlertTriangle size={18} />,
  info: <Info size={18} />,
}

interface ToastProviderProps {
  children: ReactNode
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const addToast = useCallback((message: string, variant: ToastVariant = 'info') => {
    const id = crypto.randomUUID()
    setToasts((prev) => [...prev, { id, message, variant }])
  }, [])

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2" aria-live="polite" aria-atomic="true">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onClose={() => removeToast(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

interface ToastItemProps {
  toast: Toast
  onClose: () => void
}

function ToastItem({ toast, onClose }: ToastItemProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000)
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div role="alert" className={cn(toastVariants({ variant: toast.variant }))}>
      <span className="mt-0.5 shrink-0">{ICONS[toast.variant]}</span>
      <p className="flex-1 text-sm">{toast.message}</p>
      <button onClick={onClose} aria-label="알림 닫기" className="shrink-0 opacity-60 hover:opacity-100 transition-opacity">
        <X size={14} />
      </button>
    </div>
  )
}
