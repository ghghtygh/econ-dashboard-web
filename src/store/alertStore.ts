import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { alertApi } from '@/services/api'
import type { AlertRule, AlertNotification } from '@/types/alert'

export type SyncStatus = 'idle' | 'loading' | 'saving' | 'saved' | 'error'

interface AlertState {
  rules: AlertRule[]
  notifications: AlertNotification[]
  syncStatus: SyncStatus

  fetchRules: () => Promise<void>
  addRule: (rule: AlertRule) => Promise<void>
  removeRule: (id: string) => Promise<void>
  toggleRule: (id: string) => Promise<void>
  updateRule: (id: string, updates: Partial<AlertRule>) => Promise<void>

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
      syncStatus: 'idle' as SyncStatus,

      fetchRules: async () => {
        set({ syncStatus: 'loading' })
        try {
          const serverRules = await alertApi.getRules()
          if (serverRules && serverRules.length > 0) {
            set({ rules: serverRules, syncStatus: 'idle' })
          } else {
            // 서버에 규칙이 없으면 로컬 기본 규칙을 서버에 동기화
            const localRules = get().rules
            if (localRules.length > 0) {
              await Promise.all(localRules.map((r) => alertApi.createRule(r).catch(() => {})))
            }
            set({ syncStatus: 'idle' })
          }
        } catch {
          // 서버 실패 시 localStorage 폴백 유지
          set({ syncStatus: 'error' })
        }
      },

      addRule: async (rule) => {
        // 낙관적 업데이트: 즉시 로컬에 반영
        set((state) => ({ rules: [...state.rules, rule], syncStatus: 'saving' }))
        try {
          await alertApi.createRule(rule)
          set({ syncStatus: 'saved' })
          setTimeout(() => {
            if (get().syncStatus === 'saved') set({ syncStatus: 'idle' })
          }, 2000)
        } catch {
          // 서버 실패해도 로컬에는 이미 저장됨
          set({ syncStatus: 'error' })
        }
      },

      removeRule: async (id) => {
        set((state) => ({ rules: state.rules.filter((r) => r.id !== id), syncStatus: 'saving' }))
        try {
          await alertApi.deleteRule(id)
          set({ syncStatus: 'saved' })
          setTimeout(() => {
            if (get().syncStatus === 'saved') set({ syncStatus: 'idle' })
          }, 2000)
        } catch {
          set({ syncStatus: 'error' })
        }
      },

      toggleRule: async (id) => {
        const rule = get().rules.find((r) => r.id === id)
        if (!rule) return
        const newEnabled = !rule.enabled
        set((state) => ({
          rules: state.rules.map((r) => (r.id === id ? { ...r, enabled: newEnabled } : r)),
          syncStatus: 'saving',
        }))
        try {
          await alertApi.updateRule(id, { enabled: newEnabled })
          set({ syncStatus: 'saved' })
          setTimeout(() => {
            if (get().syncStatus === 'saved') set({ syncStatus: 'idle' })
          }, 2000)
        } catch {
          set({ syncStatus: 'error' })
        }
      },

      updateRule: async (id, updates) => {
        set((state) => ({
          rules: state.rules.map((r) => (r.id === id ? { ...r, ...updates } : r)),
          syncStatus: 'saving',
        }))
        try {
          await alertApi.updateRule(id, updates)
          set({ syncStatus: 'saved' })
          setTimeout(() => {
            if (get().syncStatus === 'saved') set({ syncStatus: 'idle' })
          }, 2000)
        } catch {
          set({ syncStatus: 'error' })
        }
      },

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
      partialize: (state) => ({
        rules: state.rules,
        notifications: state.notifications,
      }),
    },
  ),
)
