import { useEffect } from 'react'
import { errorBus } from '@/lib/errorBus'
import { useToast } from './useToast'

export function ApiErrorListener() {
  const { toast } = useToast()

  useEffect(() => {
    return errorBus.subscribe((message) => {
      toast(message, 'error')
    })
  }, [toast])

  return null
}
