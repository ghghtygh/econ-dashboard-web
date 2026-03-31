import { useQuery } from '@tanstack/react-query'
import { calendarApi } from '@/services/api'

export function useCalendarEvents(from: string, to: string) {
  return useQuery({
    queryKey: ['calendarEvents', from, to],
    queryFn: () => calendarApi.getEvents(from, to),
    enabled: !!from && !!to,
    refetchInterval: 1000 * 60 * 5,
    refetchIntervalInBackground: false,
  })
}
