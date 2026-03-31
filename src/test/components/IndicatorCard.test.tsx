import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { IndicatorCard } from '@/components/dashboard/IndicatorCard'
import type { Indicator, IndicatorData } from '@/types/indicator'

const mockIndicator: Indicator = {
  id: 1,
  name: 'VIX',
  symbol: 'VIX',
  category: 'STOCK',
  unit: 'pts',
  source: 'CBOE',
  description: null,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
}

const mockLatest: IndicatorData = {
  id: 2,
  indicatorId: 1,
  date: '2024-01-02',
  value: 20.5,
  open: null,
  high: null,
  low: null,
  close: null,
  volume: null,
  change: 5,
}

describe('IndicatorCard', () => {
  it('인디케이터 이름과 심볼을 렌더링한다', () => {
    render(<IndicatorCard indicator={mockIndicator} />)
    expect(screen.getAllByText('VIX').length).toBeGreaterThanOrEqual(2)
  })

  it('latest 데이터가 없으면 안내 텍스트를 표시한다', () => {
    render(<IndicatorCard indicator={mockIndicator} />)
    expect(screen.getByText('데이터 없음')).toBeInTheDocument()
  })

  it('latest 값을 표시한다', () => {
    render(<IndicatorCard indicator={mockIndicator} latest={mockLatest} />)
    expect(screen.getByText(/20\.5/)).toBeInTheDocument()
  })

  it('prevClose 대비 변화율을 계산한다', () => {
    render(<IndicatorCard indicator={mockIndicator} latest={mockLatest} prevClose={20} />)
    expect(screen.getByText('+2.50%')).toBeInTheDocument()
  })

  it('카테고리를 표시한다', () => {
    render(<IndicatorCard indicator={mockIndicator} latest={mockLatest} />)
    expect(screen.getByText('STOCK')).toBeInTheDocument()
  })
})
