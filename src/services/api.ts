import axios from 'axios'
import { errorBus } from '@/lib/errorBus'

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

export const indicatorApi = {
  getAll: (category?: string) =>
    api.get('/indicators', { params: category ? { category } : undefined }),
  getById: (id: string) => api.get(`/indicators/${id}`),
  getCategories: () => api.get('/indicators/categories'),
  getData: (id: string, from?: string, to?: string) =>
    api.get(`/indicators/${id}/data`, { params: { from, to, size: 100 } }),
  getSeries: (indicatorIds: number[], startDate: string, endDate: string) =>
    api.post('/indicators/series', { indicatorIds, startDate, endDate }),
}

export const newsApi = {
  getList: (category?: string, page = 0, size = 20) =>
    api.get('/news', { params: { category, page, size } }),
  getById: (id: string) => api.get(`/news/${id}`),
}

export const dashboardApi = {
  getWidgets: () => api.get('/dashboard/widgets'),
  saveWidgets: (widgets: unknown[]) => api.post('/dashboard/widgets', widgets),
  updateWidget: (id: string, widget: unknown) => api.put(`/dashboard/widgets/${id}`, widget),
}
