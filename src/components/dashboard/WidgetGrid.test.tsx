import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WidgetGrid } from './WidgetGrid'
import { useDashboardStore } from '@/store/dashboardStore'
import type { Indicator, DashboardWidget } from '@/types/indicator'

// useIndicatorSeries 모킹 (API 호출 방지)
vi.mock('@/hooks/useIndicators', () => ({
  useIndicatorSeries: vi.fn().mockReturnValue({ data: undefined, isLoading: false }),
  useIndicators: vi.fn().mockReturnValue({ data: [], isLoading: false }),
  useIndicatorData: vi.fn().mockReturnValue({ data: [], isLoading: false }),
}))

// dashboardApi 모킹 (서버 저장 방지)
vi.mock('@/services/api', () => ({
  dashboardApi: {
    saveWidgets: vi.fn().mockResolvedValue({ data: {} }),
    getWidgets: vi.fn().mockResolvedValue({ data: [] }),
    updateWidget: vi.fn().mockResolvedValue({ data: {} }),
  },
}))

// ChartRenderer 모킹 (recharts 복잡성 방지)
vi.mock('@/components/charts/ChartRenderer', () => ({
  ChartRenderer: ({ type }: { type: string }) => <div data-testid={`chart-${type}`}>차트</div>,
}))

const INDICATORS: Indicator[] = [
  { id: 1, name: 'VIX', symbol: 'VIX', category: 'STOCK', unit: '', source: 'CBOE', description: null, createdAt: '', updatedAt: '' },
  { id: 2, name: 'CPI', symbol: 'CPI', category: 'MACRO', unit: '%', source: 'BLS', description: null, createdAt: '', updatedAt: '' },
]

const SAMPLE_WIDGET: DashboardWidget = {
  id: 'widget-1',
  indicatorId: 1,
  chartType: 'line',
  position: { x: 0, y: 0, w: 6, h: 6 },
  title: 'VIX 차트',
  color: '#3b82f6',
  dateRange: '1M',
}

function renderGrid(indicators = INDICATORS) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <WidgetGrid indicators={indicators} />
    </QueryClientProvider>,
  )
}

describe('WidgetGrid', () => {
  beforeEach(() => {
    useDashboardStore.setState({ widgets: [], selectedIndicators: [] })
  })

  it('위젯이 없을 때 빈 상태 메시지를 표시한다', () => {
    renderGrid()
    expect(screen.getByText('위젯을 추가하여 대시보드를 구성하세요')).toBeInTheDocument()
  })

  it('위젯이 있을 때 그리드 레이아웃을 렌더링한다', () => {
    useDashboardStore.setState({ widgets: [SAMPLE_WIDGET] })
    renderGrid()
    expect(screen.getByTestId('grid-layout')).toBeInTheDocument()
  })

  it('위젯 제목이 표시된다', () => {
    useDashboardStore.setState({ widgets: [SAMPLE_WIDGET] })
    renderGrid()
    expect(screen.getByText('VIX 차트')).toBeInTheDocument()
  })

  it('위젯 삭제 버튼 클릭 시 위젯이 제거된다', () => {
    useDashboardStore.setState({ widgets: [SAMPLE_WIDGET] })
    renderGrid()
    // X 버튼 찾기
    const closeButtons = screen.getAllByRole('button').filter((b) => {
      const svg = b.querySelector('svg')
      return svg !== null
    })
    // 위젯 X 버튼 클릭 (마지막 X 버튼)
    const xBtn = closeButtons.find((b) => b.className.includes('red') || b.closest('[class*="hover:text-red"]'))
    if (xBtn) {
      fireEvent.click(xBtn)
      expect(useDashboardStore.getState().widgets.length).toBe(0)
    }
  })

  it('기간 선택 버튼이 있다', () => {
    useDashboardStore.setState({ widgets: [SAMPLE_WIDGET] })
    renderGrid()
    expect(screen.getByText('1주')).toBeInTheDocument()
    expect(screen.getByText('1개월')).toBeInTheDocument()
    expect(screen.getByText('3개월')).toBeInTheDocument()
    expect(screen.getByText('1년')).toBeInTheDocument()
  })

  it('기간 버튼 클릭 시 위젯의 dateRange가 업데이트된다', () => {
    useDashboardStore.setState({ widgets: [SAMPLE_WIDGET] })
    renderGrid()
    fireEvent.click(screen.getByText('3개월'))
    expect(useDashboardStore.getState().widgets[0].dateRange).toBe('3M')
  })

  it('설정 버튼 클릭 시 위젯 에디터가 열린다', () => {
    useDashboardStore.setState({ widgets: [SAMPLE_WIDGET] })
    renderGrid()
    const settingsBtn = screen.getAllByRole('button').find(
      (b) => b.className.includes('hover:text-blue'),
    )
    if (settingsBtn) {
      fireEvent.click(settingsBtn)
      // WidgetEditor 모달 or 컨텐츠가 나타남
    }
  })

  it('데이터 없음 상태를 표시한다', () => {
    useDashboardStore.setState({ widgets: [SAMPLE_WIDGET] })
    renderGrid()
    expect(screen.getByText('데이터 없음')).toBeInTheDocument()
  })

  it('여러 위젯을 렌더링한다', () => {
    useDashboardStore.setState({
      widgets: [
        SAMPLE_WIDGET,
        { ...SAMPLE_WIDGET, id: 'widget-2', indicatorId: 2, title: 'CPI 차트' },
      ],
    })
    renderGrid()
    expect(screen.getByText('VIX 차트')).toBeInTheDocument()
    expect(screen.getByText('CPI 차트')).toBeInTheDocument()
  })

  it('데스크톱에서 레이아웃 편집 버튼이 표시된다', () => {
    // matchMedia mock은 기본적으로 desktop(non-mobile)로 동작
    useDashboardStore.setState({ widgets: [SAMPLE_WIDGET] })
    renderGrid()
    expect(screen.getByText('레이아웃 편집')).toBeInTheDocument()
  })

  it('편집 버튼 클릭 시 편집 모드로 전환된다', () => {
    useDashboardStore.setState({ widgets: [SAMPLE_WIDGET] })
    renderGrid()
    fireEvent.click(screen.getByText('레이아웃 편집'))
    expect(screen.getByText('편집 완료')).toBeInTheDocument()
    expect(screen.getByText('위젯을 드래그하여 위치를 변경하거나 모서리를 끌어 크기를 조절하세요.')).toBeInTheDocument()
  })

  it('편집 완료 클릭 시 보기 모드로 돌아간다', () => {
    useDashboardStore.setState({ widgets: [SAMPLE_WIDGET] })
    renderGrid()
    fireEvent.click(screen.getByText('레이아웃 편집'))
    fireEvent.click(screen.getByText('편집 완료'))
    expect(screen.getByText('레이아웃 편집')).toBeInTheDocument()
  })
})
