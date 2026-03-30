import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AlertRule, AlertNotification } from '@/types/alert'

interface AlertState {
  rules: AlertRule[]
  notifications: AlertNotification[]

  addRule: (rule: AlertRule) => void
  removeRule: (id: string) => void
  toggleRule: (id: string) => void

  addNotification: (notification: AlertNotification) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  clearNotifications: () => void

  unreadCount: () => number
}

const defaultRules: AlertRule[] = [
  {
    id: 'preset-vix-above-30',
    indicatorId: 1,
    indicatorName: 'VIX',
    condition: 'above',
    threshold: 30,
    severity: 'danger',
    message: 'VIX가 30을 초과했습니다. 시장 변동성이 매우 높습니다.',
    enabled: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'preset-yield-spread-below-0',
    indicatorId: 2,
    indicatorName: '장단기 금리차 (10Y-2Y)',
    condition: 'below',
    threshold: 0,
    severity: 'warning',
    message: '장단기 금리차가 역전되었습니다. 경기 침체 신호에 주의하세요.',
    enabled: true,
    createdAt: new Date().toISOString(),
  },
]

export const useAlertStore = create<AlertState>()(
  persist(
    (set, get) => ({
      rules: defaultRules,
      notifications: [],

      addRule: (rule) =>
        set((state) => ({ rules: [...state.rules, rule] })),

      removeRule: (id) =>
        set((state) => ({ rules: state.rules.filter((r) => r.id !== id) })),

      toggleRule: (id) =>
        set((state) => ({
          rules: state.rules.map((r) =>
            r.id === id ? { ...r, enabled: !r.enabled } : r,
          ),
        })),

      addNotification: (notification) =>
        set((state) => ({
          notifications: [notification, ...state.notifications],
        })),

      markAsRead: (id) =>
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n,
          ),
        })),

      markAllAsRead: () =>
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
        })),

      clearNotifications: () => set({ notifications: [] }),

      unreadCount: () => get().notifications.filter((n) => !n.read).length,
    }),
    {
      name: 'econ-alerts',
    },
  ),
)
