import { http, HttpResponse } from 'msw'
import type { Indicator, IndicatorData, PagedResponse, ApiResponse } from '@/types/indicator'
import type { NewsArticle } from '@/types/news'

export const mockIndicator: Indicator = {
  id: 1,
  name: 'VIX',
  symbol: 'VIX',
  category: 'STOCK',
  unit: 'pts',
  source: 'CBOE',
  description: 'Volatility Index',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
}

export const mockIndicatorData: IndicatorData[] = [
  { id: 1, indicatorId: 1, date: '2024-01-01', value: 15.0, open: null, high: null, low: null, close: null, volume: null, change: 0 },
  { id: 2, indicatorId: 1, date: '2024-01-02', value: 16.5, open: null, high: null, low: null, close: null, volume: null, change: 10 },
]

export const mockNewsArticle: NewsArticle = {
  id: 1,
  title: 'Test News',
  summary: 'Test summary',
  url: 'https://example.com/news/1',
  source: 'Reuters',
  author: 'John Doe',
  imageUrl: null,
  category: 'MACRO',
  publishedAt: '2024-01-01T00:00:00Z',
  createdAt: '2024-01-01T00:00:00Z',
}

function wrap<T>(data: T): ApiResponse<T> {
  return { success: true, data, error: undefined, timestamp: new Date().toISOString() }
}

function paged<T>(content: T[]): PagedResponse<T> {
  return { content, totalElements: content.length, totalPages: 1, size: 20, number: 0 }
}

export const handlers = [
  http.get('/api/indicators', () =>
    HttpResponse.json(wrap([mockIndicator]))
  ),

  http.get('/api/indicators/categories', () =>
    HttpResponse.json(wrap(['STOCK', 'FOREX', 'CRYPTO', 'MACRO']))
  ),

  http.get('/api/indicators/:id/data', () =>
    HttpResponse.json(wrap(paged(mockIndicatorData)))
  ),

  http.get('/api/news', () =>
    HttpResponse.json(wrap(paged([mockNewsArticle])))
  ),
]
