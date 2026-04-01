import { useQuery } from '@tanstack/react-query'
import { newsApi } from '@/services/api'
import type { NewsCategory } from '@/types/news'

export function useNewsList(category?: NewsCategory, page = 0, size = 20) {
  return useQuery({
    queryKey: ['news', category, page, size],
    queryFn: () => newsApi.getList(category, page, size),
    refetchInterval: 1000 * 60 * 5,
  })
}
