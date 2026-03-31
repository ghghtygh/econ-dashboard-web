type ErrorListener = (message: string) => void

const listeners: ErrorListener[] = []

export const errorBus = {
  subscribe: (fn: ErrorListener): (() => void) => {
    listeners.push(fn)
    return () => {
      const idx = listeners.indexOf(fn)
      if (idx !== -1) listeners.splice(idx, 1)
    }
  },
  emit: (message: string) => {
    listeners.forEach((fn) => fn(message))
  },
}
