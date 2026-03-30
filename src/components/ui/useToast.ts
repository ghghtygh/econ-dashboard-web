import { useContext } from 'react'
import { ToastContext } from './ToastContext'

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('ToastProvider 내부에서 사용해야 합니다')
  return ctx
}
