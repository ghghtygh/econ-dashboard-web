import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { ChartRenderer } from '@/components/charts/ChartRenderer'
import type { IndicatorData } from '@/types/indicator'

// recharts ResizeObserver mock
vi.mock('recharts', async () => {
  const actual = await vi.importActual<typeof import('recharts')>('recharts')
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div style={{ width: 500, height: 300 }}>{children}</div>
    ),
  }
})

const data: IndicatorData[] = [
  { id: 1, indicatorId: 1, date: '2024-01-01', value: 100, open: null, high: null, low: null, close: null, volume: null, change: 0 },
  { id: 2, indicatorId: 1, date: '2024-01-02', value: 110, open: null, high: null, low: null, close: null, volume: null, change: 10 },
]

describe('ChartRenderer', () => {
  it('데이터가 없으면 안내 텍스트를 렌더링한다', () => {
    render(<ChartRenderer type="line" data={[]} />)
    expect(screen.getByText('데이터 없음')).toBeInTheDocument()
  })

  it('number 타입이면 NumberCard를 렌더링한다', async () => {
    render(<ChartRenderer type="number" data={data} />)
    await waitFor(() => {
      expect(screen.getByText('110')).toBeInTheDocument()
    })
  })

  it('line 타입이면 recharts 컨테이너를 렌더링한다', async () => {
    const { container } = render(<ChartRenderer type="line" data={data} />)
    await waitFor(() => {
      expect(container.querySelector('.recharts-wrapper')).toBeTruthy()
    })
  })
})
