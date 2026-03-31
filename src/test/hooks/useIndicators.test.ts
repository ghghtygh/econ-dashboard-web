import { describe, it, expect } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { useIndicators, useIndicatorSeries } from '@/hooks/useIndicators'
import { mockIndicator, mockIndicatorData } from '@/test/mocks/handlers'

function makeWrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client }, children)
}

describe('useIndicators', () => {
  it('인디케이터 목록을 불러온다', async () => {
    const { result } = renderHook(() => useIndicators(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([mockIndicator])
  })

  it('카테고리 필터를 쿼리에 포함한다', async () => {
    const { result } = renderHook(() => useIndicators('STOCK'), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toHaveLength(1)
  })
})

describe('useIndicatorSeries', () => {
  it('ids가 빈 배열이면 쿼리가 비활성화된다', () => {
    const { result } = renderHook(() => useIndicatorSeries([], '1M'), { wrapper: makeWrapper() })
    expect(result.current.fetchStatus).toBe('idle')
  })

  it('ids가 있으면 데이터를 불러온다', async () => {
    const { result } = renderHook(() => useIndicatorSeries([1], '1M'), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.[1]).toEqual(mockIndicatorData)
  })
})
