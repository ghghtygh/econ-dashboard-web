import { useQuery } from '@tanstack/react-query'
import { healthApi, type HealthStatus } from '@/services/api'

export function useHealthStatus() {
  return useQuery<HealthStatus>({
    queryKey: ['health'],
    queryFn: async () => {
      const res = await healthApi.get()
      return res.data
    },
    staleTime: 1000 * 60 * 5,
    retry: false,
  })
}
