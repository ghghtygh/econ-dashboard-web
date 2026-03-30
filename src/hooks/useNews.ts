import { useQuery } from '@tanstack/react-query'
import { newsApi } from '@/services/api'
import type { ApiResponse, PagedResponse } from '@/types/indicator'
import type { NewsArticle, NewsCategory } from '@/types/news'

export function useNewsList(category?: NewsCategory, page = 0, size = 20) {
  return useQuery({
    queryKey: ['news', category, page, size],
    queryFn: async () => {
      const res = await newsApi.getList(category, page, size)
      return (res.data as ApiResponse<PagedResponse<NewsArticle>>).data
    },
    refetchInterval: 1000 * 60 * 5,
  })
}
