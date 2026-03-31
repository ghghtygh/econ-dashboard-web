import axios from 'axios'
import { z } from 'zod'
import { errorBus } from '@/lib/errorBus'
import {
  apiResponseSchema,
  indicatorSchema,
  indicatorDataSchema,
  indicatorCategorySchema,
  pagedResponseSchema,
  dashboardWidgetSchema,
} from '@/types/indicator'
import { newsArticleSchema } from '@/types/news'
import { alertRuleSchema, alertRuleListSchema } from '@/types/alert'
import type { AlertRule } from '@/types/alert'
import { economicEventListSchema } from '@/types/calendar'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL
if (!apiBaseUrl) {
  console.warn('[api] VITE_API_BASE_URL 환경변수가 설정되지 않았습니다. 기본값 "/api"를 사용합니다.')
}

const apiTimeout = Number(import.meta.env.VITE_API_TIMEOUT) || 30000

const api = axios.create({
  baseURL: apiBaseUrl || '/api',
  timeout: apiTimeout,
  headers: { 'Content-Type': 'application/json' },
})

function getErrorMessage(status: number): string {
  if (status === 401) return '인증이 필요합니다. 다시 로그인해주세요.'
  if (status === 403) return '접근 권한이 없습니다.'
  if (status === 404) return '요청한 데이터를 찾을 수 없습니다.'
  if (status === 429) return '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.'
  if (status >= 400 && status < 500) return `요청 오류가 발생했습니다 (${status}).`
  if (status >= 500) return `서버 오류가 발생했습니다 (${status}). 잠시 후 다시 시도해주세요.`
  return `알 수 없는 오류가 발생했습니다 (${status}).`
}

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNABORTED') {
        errorBus.emit(`요청 시간이 초과되었습니다 (${apiTimeout / 1000}s). 네트워크 상태를 확인해주세요.`)
      } else if (error.code === 'ERR_NETWORK') {
        errorBus.emit('네트워크에 연결할 수 없습니다. 인터넷 연결을 확인해주세요.')
      } else if (error.response) {
        errorBus.emit(getErrorMessage(error.response.status))
      }
    }
    return Promise.reject(error)
  },
)

export default api

/**
 * API 응답을 Zod 스키마로 검증하고 data 필드를 반환합니다.
 * 검증 실패 시 에러 버스로 사용자에게 알리고 예외를 throw합니다.
 */
export function parseApiResponse<T extends z.ZodTypeAny>(
  raw: unknown,
  dataSchema: T,
): z.infer<T> {
  const schema = apiResponseSchema(dataSchema)
  const result = schema.safeParse(raw)
  if (!result.success) {
    const msg = '서버 응답 형식이 예상과 다릅니다. 잠시 후 다시 시도해주세요.'
    errorBus.emit(msg)
    throw new Error(`API 응답 검증 실패: ${result.error.message}`)
  }
  return (result.data as { data: z.infer<T> }).data
}

// --- 복합 스키마 ---
const indicatorListSchema = z.array(indicatorSchema)
const indicatorDataPagedSchema = pagedResponseSchema(indicatorDataSchema)
const categoryListSchema = z.array(indicatorCategorySchema)
const newsArticlePagedSchema = pagedResponseSchema(newsArticleSchema)
const widgetListSchema = z.array(dashboardWidgetSchema)

export const indicatorApi = {
  getAll: async (category?: string) => {
    const res = await api.get('/indicators', { params: category ? { category } : undefined })
    return parseApiResponse(res.data, indicatorListSchema)
  },
  getById: async (id: string) => {
    const res = await api.get(`/indicators/${id}`)
    return parseApiResponse(res.data, indicatorSchema)
  },
  getCategories: async () => {
    const res = await api.get('/indicators/categories')
    return parseApiResponse(res.data, categoryListSchema)
  },
  getData: async (id: string, from?: string, to?: string) => {
    const res = await api.get(`/indicators/${id}/data`, { params: { from, to, size: 100 } })
    return parseApiResponse(res.data, indicatorDataPagedSchema)
  },
  getSeries: async (indicatorIds: number[], startDate: string, endDate: string) => {
    const res = await api.post('/indicators/series', { indicatorIds, startDate, endDate })
    return res.data
  },
}

export const newsApi = {
  getList: async (category?: string, page = 0, size = 20) => {
    const res = await api.get('/news', { params: { category, page, size } })
    return parseApiResponse(res.data, newsArticlePagedSchema)
  },
  getById: async (id: string) => {
    const res = await api.get(`/news/${id}`)
    return parseApiResponse(res.data, newsArticleSchema)
  },
}

export const dashboardApi = {
  getWidgets: async () => {
    const res = await api.get('/dashboard/widgets')
    return parseApiResponse(res.data, widgetListSchema)
  },
  saveWidgets: (widgets: unknown[]) => api.post('/dashboard/widgets', widgets),
  updateWidget: (id: string, widget: unknown) => api.put(`/dashboard/widgets/${id}`, widget),
}

export interface HealthStatus {
  status: string
  env: string
  dataSources: {
    coingecko: boolean
    fred: boolean
    alphaVantage: boolean
  }
}

export const healthApi = {
  get: () => api.get<HealthStatus>('/health'),
}

export const calendarApi = {
  getEvents: async (from: string, to: string) => {
    const res = await api.get('/calendar', { params: { from, to } })
    return parseApiResponse(res.data, economicEventListSchema)
  },
}

export const alertApi = {
  getRules: async (): Promise<AlertRule[]> => {
    const res = await api.get('/alerts/rules')
    return parseApiResponse(res.data, alertRuleListSchema)
  },
  createRule: async (rule: Omit<AlertRule, 'createdAt'> & { createdAt?: string }): Promise<AlertRule> => {
    const res = await api.post('/alerts/rules', rule)
    return parseApiResponse(res.data, alertRuleSchema)
  },
  updateRule: async (id: string, updates: Partial<AlertRule>): Promise<AlertRule> => {
    const res = await api.put(`/alerts/rules/${id}`, updates)
    return parseApiResponse(res.data, alertRuleSchema)
  },
  deleteRule: async (id: string): Promise<void> => {
    await api.delete(`/alerts/rules/${id}`)
  },
}
