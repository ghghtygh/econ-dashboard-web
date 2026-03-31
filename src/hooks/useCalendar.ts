import { useQuery } from '@tanstack/react-query'
import { calendarApi } from '@/services/api'
import type { EconomicEvent } from '@/types/calendar'

interface ApiResponse<T> {
  success: boolean
  data: T
}

interface PagedResponse<T> {
  content: T[]
  totalPages: number
  totalElements: number
}

export function useCalendarEvents(from?: string, to?: string, importance?: string) {
  return useQuery({
    queryKey: ['calendar', from, to, importance],
    queryFn: async () => {
      const res = await calendarApi.getEvents(from, to, importance)
      const body = res.data as ApiResponse<EconomicEvent[]>
      return body.data ?? []
    },
    enabled: !!from && !!to,
    refetchInterval: 1000 * 60 * 5,
  })
}

export function useUpcomingEvents(page = 0, size = 10) {
  return useQuery({
    queryKey: ['calendar', 'upcoming', page, size],
    queryFn: async () => {
      const res = await calendarApi.getUpcoming(page, size)
      const body = res.data as ApiResponse<PagedResponse<EconomicEvent>>
      return body.data
    },
    refetchInterval: 1000 * 60 * 5,
  })
}
