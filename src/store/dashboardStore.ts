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

interface DashboardStore {
  widgets: DashboardWidget[]
  selectedIndicators: number[]
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
