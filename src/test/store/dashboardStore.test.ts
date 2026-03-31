import { describe, it, expect, beforeEach } from 'vitest'
import { useDashboardStore } from '@/store/dashboardStore'
import type { DashboardWidget } from '@/types/indicator'

const mockWidget: DashboardWidget = {
  id: 'w1',
  indicatorId: 1,
  chartType: 'line',
  position: { x: 0, y: 0, w: 4, h: 3 },
  title: 'VIX',
  color: '#3b82f6',
}

beforeEach(() => {
  useDashboardStore.setState({ widgets: [], selectedIndicators: [] })
})

describe('dashboardStore', () => {
  it('위젯을 추가한다', () => {
    useDashboardStore.getState().addWidget(mockWidget)
    expect(useDashboardStore.getState().widgets).toHaveLength(1)
    expect(useDashboardStore.getState().widgets[0].id).toBe('w1')
  })

  it('위젯을 삭제한다', () => {
    useDashboardStore.getState().addWidget(mockWidget)
    useDashboardStore.getState().removeWidget('w1')
    expect(useDashboardStore.getState().widgets).toHaveLength(0)
  })

  it('위젯을 업데이트한다', () => {
    useDashboardStore.getState().addWidget(mockWidget)
    useDashboardStore.getState().updateWidget('w1', { title: 'Updated' })
    expect(useDashboardStore.getState().widgets[0].title).toBe('Updated')
  })

  it('인디케이터를 토글한다', () => {
    useDashboardStore.getState().toggleIndicator(1)
    expect(useDashboardStore.getState().selectedIndicators).toContain(1)

    useDashboardStore.getState().toggleIndicator(1)
    expect(useDashboardStore.getState().selectedIndicators).not.toContain(1)
  })

  it('레이아웃을 업데이트한다', () => {
    useDashboardStore.getState().addWidget(mockWidget)
    useDashboardStore.getState().updateLayouts([{ i: 'w1', x: 2, y: 1, w: 6, h: 4 }])
    const updated = useDashboardStore.getState().widgets[0]
    expect(updated.position).toEqual({ x: 2, y: 1, w: 6, h: 4 })
  })
})
