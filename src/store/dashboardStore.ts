import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { dashboardApi } from '@/services/api'
import type { DashboardWidget } from '@/types/indicator'

interface LayoutItem {
  i: string
  x: number
  y: number
  w: number
  h: number
}

export type SyncStatus = 'idle' | 'saving' | 'saved' | 'error'

const DEFAULT_WIDGETS: DashboardWidget[] = [
  { id: 'default-spx',    indicatorId: 2,  chartType: 'area',   position: { x: 0, y: 0, w: 4, h: 3 }, title: 'S&P 500',     color: '#3b82f6', dateRange: '1M' },
  { id: 'default-kospi',  indicatorId: 14, chartType: 'area',   position: { x: 4, y: 0, w: 4, h: 3 }, title: 'KOSPI',        color: '#10b981', dateRange: '1M' },
  { id: 'default-usdkrw', indicatorId: 3,  chartType: 'line',   position: { x: 8, y: 0, w: 4, h: 3 }, title: 'USD/KRW',      color: '#f59e0b', dateRange: '1M' },
  { id: 'default-btc',    indicatorId: 4,  chartType: 'area',   position: { x: 0, y: 3, w: 4, h: 3 }, title: 'Bitcoin',      color: '#f97316', dateRange: '1M' },
  { id: 'default-eth',    indicatorId: 7,  chartType: 'area',   position: { x: 4, y: 3, w: 4, h: 3 }, title: 'Ethereum',     color: '#6366f1', dateRange: '1M' },
  { id: 'default-vix',    indicatorId: 1,  chartType: 'line',   position: { x: 8, y: 3, w: 4, h: 3 }, title: 'VIX',          color: '#ef4444', dateRange: '3M' },
]

interface DashboardStore {
  widgets: DashboardWidget[]
  selectedIndicators: number[]
  initialized: boolean
  syncStatus: SyncStatus
  lastSyncedAt: number | null
  addWidget: (widget: DashboardWidget) => void
  removeWidget: (id: string) => void
  updateWidget: (id: string, updates: Partial<DashboardWidget>) => void
  updateLayouts: (layouts: LayoutItem[]) => void
  toggleIndicator: (id: number) => void
  setWidgets: (widgets: DashboardWidget[]) => void
  fetchWidgetsFromServer: () => Promise<void>
  setSyncStatus: (status: SyncStatus) => void
  resetToDefaults: () => void
  ensureDefaults: () => void
}

let saveTimer: ReturnType<typeof setTimeout> | null = null

function debouncedSave(widgets: DashboardWidget[], set: (partial: Partial<DashboardStore>) => void) {
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(async () => {
    set({ syncStatus: 'saving' })
    try {
      await dashboardApi.saveWidgets(widgets)
      set({ syncStatus: 'saved', lastSyncedAt: Date.now() })
      setTimeout(() => {
        const current = useDashboardStore.getState()
        if (current.syncStatus === 'saved') {
          set({ syncStatus: 'idle' })
        }
      }, 2000)
    } catch {
      set({ syncStatus: 'error' })
    }
  }, 500)
}

export const useDashboardStore = create<DashboardStore>()(
  persist(
    (set, get) => ({
      widgets: [],
      selectedIndicators: [],
      initialized: false,
      syncStatus: 'idle' as SyncStatus,
      lastSyncedAt: null,
      addWidget: (widget) => {
        set((state) => ({ widgets: [...state.widgets, widget] }))
        debouncedSave(get().widgets, set)
      },
      removeWidget: (id) => {
        set((state) => ({ widgets: state.widgets.filter((w) => w.id !== id) }))
        debouncedSave(get().widgets, set)
      },
      updateWidget: (id, updates) => {
        set((state) => ({
          widgets: state.widgets.map((w) => (w.id === id ? { ...w, ...updates } : w)),
        }))
        debouncedSave(get().widgets, set)
      },
      updateLayouts: (layouts) => {
        set((state) => ({
          widgets: state.widgets.map((w) => {
            const layout = layouts.find((l) => l.i === w.id)
            if (!layout) return w
            return { ...w, position: { x: layout.x, y: layout.y, w: layout.w, h: layout.h } }
          }),
        }))
        debouncedSave(get().widgets, set)
      },
      toggleIndicator: (id) =>
        set((state) => ({
          selectedIndicators: state.selectedIndicators.includes(id)
            ? state.selectedIndicators.filter((i) => i !== id)
            : [...state.selectedIndicators, id],
        })),
      setWidgets: (widgets) => set({ widgets }),
      fetchWidgetsFromServer: async () => {
        try {
          const serverWidgets = await dashboardApi.getWidgets()
          if (serverWidgets && serverWidgets.length > 0) {
            set({ widgets: serverWidgets, lastSyncedAt: Date.now() })
          }
        } catch {
          // 서버 실패 시 localStorage 폴백 유지 (아무 것도 안 함)
        }
      },
      setSyncStatus: (status) => set({ syncStatus: status }),
      resetToDefaults: () => {
        const newWidgets = DEFAULT_WIDGETS.map(w => ({ ...w, id: `default-${w.indicatorId}-${Date.now()}` }))
        set({ widgets: newWidgets })
        debouncedSave(newWidgets, set)
      },
      ensureDefaults: () => {
        const state = get()
        if (!state.initialized && state.widgets.length === 0) {
          set({ widgets: [...DEFAULT_WIDGETS], initialized: true })
        } else if (!state.initialized) {
          set({ initialized: true })
        }
      },
    }),
    {
      name: 'econ-dashboard',
      partialize: (state) => ({
        widgets: state.widgets,
        selectedIndicators: state.selectedIndicators,
      }),
    }
  )
)
