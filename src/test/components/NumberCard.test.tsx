import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { NumberCard } from '@/components/charts/NumberCard'
import type { IndicatorData } from '@/types/indicator'

const singleData: IndicatorData[] = [
  { id: 1, indicatorId: 1, date: '2024-01-01', value: 1234.56, open: null, high: null, low: null, close: null, volume: null, change: null },
]

const multiData: IndicatorData[] = [
  { id: 1, indicatorId: 1, date: '2024-01-01', value: 1000, open: null, high: null, low: null, close: null, volume: null, change: null },
  { id: 2, indicatorId: 1, date: '2024-01-02', value: 1100, open: null, high: null, low: null, close: null, volume: null, change: null },
]

describe('NumberCard', () => {
  it('데이터가 없으면 안내 텍스트를 렌더링한다', () => {
    render(<NumberCard data={[]} />)
    expect(screen.getByText('데이터 없음')).toBeInTheDocument()
  })

  it('최신 값을 표시한다', () => {
    render(<NumberCard data={singleData} />)
    expect(screen.getByText('1,234.56')).toBeInTheDocument()
  })

  it('단위를 표시한다', () => {
    render(<NumberCard data={singleData} unit="pts" />)
    expect(screen.getByText('pts')).toBeInTheDocument()
  })

  it('전일 대비 변화율을 계산한다', () => {
    render(<NumberCard data={multiData} />)
    expect(screen.getByText('+10.00%')).toBeInTheDocument()
  })
})
