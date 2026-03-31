import { describe, it, expect } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { useNewsList } from '@/hooks/useNews'
import { mockNewsArticle } from '@/test/mocks/handlers'

function makeWrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client }, children)
}

describe('useNewsList', () => {
  it('뉴스 목록을 불러온다', async () => {
    const { result } = renderHook(() => useNewsList(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.content).toEqual([mockNewsArticle])
  })

  it('카테고리 필터로 호출할 수 있다', async () => {
    const { result } = renderHook(() => useNewsList('MACRO', 0, 10), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.content).toHaveLength(1)
  })
})
