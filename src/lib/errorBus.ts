type ErrorListener = (message: string) => void

const listeners: ErrorListener[] = []
let lastMessage = ''
let lastTime = 0
const DEDUPE_MS = 5000

export const errorBus = {
  subscribe: (fn: ErrorListener): (() => void) => {
    listeners.push(fn)
    return () => {
      const idx = listeners.indexOf(fn)
      if (idx !== -1) listeners.splice(idx, 1)
    }
  },
  emit: (message: string) => {
    const now = Date.now()
    if (message === lastMessage && now - lastTime < DEDUPE_MS) return
    lastMessage = message
    lastTime = now
    listeners.forEach((fn) => fn(message))
  },
}
