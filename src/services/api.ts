import axios from 'axios'
import { errorBus } from '@/lib/errorBus'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error) && error.code === 'ECONNABORTED') {
      errorBus.emit('요청 시간이 초과되었습니다 (10s). 네트워크 상태를 확인해주세요.')
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
