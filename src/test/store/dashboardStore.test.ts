import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/mocks/server'
import { useDashboardStore } from '@/store/dashboardStore'
import type { DashboardWidget } from '@/types/indicator'

function wrap<T>(data: T) {
  return { success: true, data, timestamp: new Date().toISOString() }
}

const mockWidget: DashboardWidget = {
  id: 'w1',
  indicatorId: 1,
  chartType: 'line',
  position: { x: 0, y: 0, w: 4, h: 3 },
  title: 'VIX',
  color: '#3b82f6',
}

const mockWidget2: DashboardWidget = {
  id: 'w2',
  indicatorId: 2,
  chartType: 'bar',
  position: { x: 4, y: 0, w: 4, h: 3 },
  title: 'S&P 500',
  color: '#10b981',
}

beforeEach(() => {
  vi.useFakeTimers()
  useDashboardStore.setState({ widgets: [], selectedIndicators: [], syncStatus: 'idle', lastSyncedAt: null })
})

afterEach(() => {
  vi.useRealTimers()
})

describe('dashboardStore - 기본 기능', () => {
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

describe('dashboardStore - 서버 동기화', () => {
  it('초기 syncStatus는 idle이다', () => {
    expect(useDashboardStore.getState().syncStatus).toBe('idle')
  })

  it('fetchWidgetsFromServer: 서버 위젯으로 상태를 교체한다', async () => {
    const serverWidgets = [mockWidget, mockWidget2]
    server.use(
      http.get('/api/dashboard/widgets', () => HttpResponse.json(wrap(serverWidgets))),
    )

    await useDashboardStore.getState().fetchWidgetsFromServer()

    const state = useDashboardStore.getState()
    expect(state.widgets).toHaveLength(2)
    expect(state.widgets[0].id).toBe('w1')
    expect(state.widgets[1].id).toBe('w2')
    expect(state.lastSyncedAt).not.toBeNull()
  })

  it('fetchWidgetsFromServer: 서버가 빈 배열이면 기존 위젯을 유지한다', async () => {
    useDashboardStore.setState({ widgets: [mockWidget] })
    server.use(
      http.get('/api/dashboard/widgets', () => HttpResponse.json(wrap([]))),
    )

    await useDashboardStore.getState().fetchWidgetsFromServer()

    expect(useDashboardStore.getState().widgets).toHaveLength(1)
    expect(useDashboardStore.getState().widgets[0].id).toBe('w1')
  })

  it('fetchWidgetsFromServer: 서버 실패 시 기존 위젯을 유지한다 (localStorage 폴백)', async () => {
    useDashboardStore.setState({ widgets: [mockWidget] })
    server.use(
      http.get('/api/dashboard/widgets', () => HttpResponse.json({}, { status: 500 })),
    )

    await useDashboardStore.getState().fetchWidgetsFromServer()

    expect(useDashboardStore.getState().widgets).toHaveLength(1)
    expect(useDashboardStore.getState().widgets[0].id).toBe('w1')
  })

  it('addWidget: 디바운스 후 서버에 저장하고 syncStatus가 변경된다', async () => {
    let savedBody: unknown
    server.use(
      http.post('/api/dashboard/widgets', async ({ request }) => {
        savedBody = await request.json()
        return HttpResponse.json({ success: true, data: null })
      }),
    )

    useDashboardStore.getState().addWidget(mockWidget)

    // 디바운스 타이머 실행
    await vi.advanceTimersByTimeAsync(600)

    expect(useDashboardStore.getState().syncStatus).toBe('saved')
    expect(savedBody).toEqual([mockWidget])
  })

  it('removeWidget: 디바운스 후 서버에 저장한다', async () => {
    let savedBody: unknown
    server.use(
      http.post('/api/dashboard/widgets', async ({ request }) => {
        savedBody = await request.json()
        return HttpResponse.json({ success: true, data: null })
      }),
    )

    useDashboardStore.setState({ widgets: [mockWidget, mockWidget2] })
    useDashboardStore.getState().removeWidget('w1')

    await vi.advanceTimersByTimeAsync(600)

    expect(savedBody).toEqual([mockWidget2])
  })

  it('서버 저장 실패 시 syncStatus가 error가 된다', async () => {
    server.use(
      http.post('/api/dashboard/widgets', () => HttpResponse.json({}, { status: 500 })),
    )

    useDashboardStore.getState().addWidget(mockWidget)

    await vi.advanceTimersByTimeAsync(600)

    expect(useDashboardStore.getState().syncStatus).toBe('error')
  })
})
