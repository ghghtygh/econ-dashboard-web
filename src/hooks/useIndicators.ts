import { useQuery } from '@tanstack/react-query'
import { indicatorApi } from '@/services/api'
import type { ApiResponse, Indicator, IndicatorData, PagedResponse, IndicatorCategory } from '@/types/indicator'

export function useIndicators(category?: IndicatorCategory) {
  return useQuery({
    queryKey: ['indicators', category],
    queryFn: async () => {
      const res = await indicatorApi.getAll(category)
      return (res.data as ApiResponse<Indicator[]>).data
    },
    refetchInterval: 1000 * 60 * 5,
  })
}

export function useIndicatorData(id: number, from?: string, to?: string) {
  return useQuery({
    queryKey: ['indicatorData', id, from, to],
    queryFn: async () => {
      const res = await indicatorApi.getData(String(id), from, to)
      const paged = (res.data as ApiResponse<PagedResponse<IndicatorData>>).data
      return paged.content
    },
    enabled: id > 0,
  })
}

export type DateRange = '1D' | '1W' | '1M' | '3M' | '1Y'

function getDateRangeParams(range: DateRange): { from: string; to: string } {
  const today = new Date()
  const to = today.toISOString().slice(0, 10)
  const from = new Date(today)
  switch (range) {
    case '1D': from.setDate(today.getDate() - 1); break
    case '1W': from.setDate(today.getDate() - 7); break
    case '1M': from.setMonth(today.getMonth() - 1); break
    case '3M': from.setMonth(today.getMonth() - 3); break
    case '1Y': from.setFullYear(today.getFullYear() - 1); break
  }
  return { from: from.toISOString().slice(0, 10), to }
}

export interface IndicatorSeriesResult {
  data: Record<number, IndicatorData[]>
  failedIds: number[]
}

export function useIndicatorSeries(ids: number[], range: DateRange) {
  const { from, to } = getDateRangeParams(range)
  return useQuery({
    queryKey: ['indicatorSeries', ids, range],
    queryFn: async (): Promise<IndicatorSeriesResult> => {
      if (ids.length === 0) return { data: {}, failedIds: [] }
      const results: Record<number, IndicatorData[]> = {}
      const failedIds: number[] = []
      await Promise.all(
        ids.map(async (id) => {
          try {
            const res = await indicatorApi.getData(String(id), from, to)
            const paged = (res.data as ApiResponse<PagedResponse<IndicatorData>>).data
            if (paged.content.length > 0) {
              results[id] = paged.content
            }
          } catch (err) {
            console.warn(`[useIndicatorSeries] Failed to fetch indicator ${id}:`, err)
            failedIds.push(id)
          }
        })
      )
      return { data: results, failedIds }
    },
    enabled: ids.length > 0,
    refetchInterval: 1000 * 60 * 5,
  })
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await indicatorApi.getCategories()
      return (res.data as ApiResponse<IndicatorCategory[]>).data
    },
  })
}
