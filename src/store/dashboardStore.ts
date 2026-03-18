import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { DashboardWidget } from '@/types/indicator'

interface DashboardStore {
  widgets: DashboardWidget[]
  selectedIndicators: number[]
  addWidget: (widget: DashboardWidget) => void
  removeWidget: (id: string) => void
  updateWidget: (id: string, updates: Partial<DashboardWidget>) => void
  toggleIndicator: (id: number) => void
  setWidgets: (widgets: DashboardWidget[]) => void
}

export const useDashboardStore = create<DashboardStore>()(
  persist(
    (set) => ({
      widgets: [],
      selectedIndicators: [],
      addWidget: (widget) =>
        set((state) => ({ widgets: [...state.widgets, widget] })),
      removeWidget: (id) =>
        set((state) => ({ widgets: state.widgets.filter((w) => w.id !== id) })),
      updateWidget: (id, updates) =>
        set((state) => ({
          widgets: state.widgets.map((w) => (w.id === id ? { ...w, ...updates } : w)),
        })),
      toggleIndicator: (id) =>
        set((state) => ({
          selectedIndicators: state.selectedIndicators.includes(id)
            ? state.selectedIndicators.filter((i) => i !== id)
            : [...state.selectedIndicators, id],
        })),
      setWidgets: (widgets) => set({ widgets }),
    }),
    { name: 'econ-dashboard' }
  )
)
