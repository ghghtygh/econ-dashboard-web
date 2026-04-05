import { useQuery } from '@tanstack/react-query'
import { indicatorApi } from '@/services/api'
import { errorBus } from '@/lib/errorBus'
import type { IndicatorData, IndicatorCategory } from '@/types/indicator'

export function useIndicators(category?: IndicatorCategory) {
  return useQuery({
    queryKey: ['indicators', category],
    queryFn: () => indicatorApi.getAll(category),
    refetchInterval: 1000 * 60 * 5,
    refetchIntervalInBackground: false,
  })
}

export function useIndicatorData(id: number, from?: string, to?: string) {
  return useQuery({
    queryKey: ['indicatorData', id, from, to],
    queryFn: async () => {
      const paged = await indicatorApi.getData(String(id), from, to)
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
      try {
        const resp = await indicatorApi.getSeries(ids, from, to)
        const raw = resp.data ?? resp
        const data: Record<number, IndicatorData[]> = {}
        if (Array.isArray(raw)) {
          for (const item of raw) {
            if (item.indicatorId != null && Array.isArray(item.data)) {
              data[item.indicatorId] = item.data
            }
          }
        } else if (raw && typeof raw === 'object') {
          Object.assign(data, raw)
        }
        return { data, failedIds: [] }
      } catch {
        // 배치 엔드포인트 실패 시 개별 요청 폴백
        const results: Record<number, IndicatorData[]> = {}
        const failedIds: number[] = []
        await Promise.all(
          ids.map(async (id) => {
            try {
              const paged = await indicatorApi.getData(String(id), from, to)
              if (paged.content.length > 0) {
                results[id] = paged.content
              }
            } catch {
              failedIds.push(id)
            }
          })
        )
        if (failedIds.length > 0) {
          errorBus.emit(`${failedIds.length}개 지표 데이터를 불러오지 못했습니다 (ID: ${failedIds.join(', ')}).`)
        }
        return { data: results, failedIds }
      }
    },
    enabled: ids.length > 0,
    refetchInterval: 1000 * 60 * 5,
    refetchIntervalInBackground: false,
  })
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => indicatorApi.getCategories(),
  })
}
