import axios from 'axios'
import { captureException } from './errorReporter'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
})

// Report 4xx/5xx responses to error monitoring
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status
    const url = error.config?.url ?? 'unknown'

    captureException(error, {
      severity: status && status >= 500 ? 'error' : 'warning',
      tags: {
        source: 'axios',
        status: String(status ?? 'network'),
        endpoint: url,
      },
      extra: {
        method: error.config?.method,
        responseData: error.response?.data,
      },
    })

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
    api.get(`/indicators/${id}/data`, { params: { from, to, size: 500 } }),
  getSeries: (indicatorIds: number[], startDate: string, endDate: string) =>
    api.post('/indicators/series', { indicatorIds, startDate, endDate }),
}

export const newsApi = {
  getList: (category?: string, page = 0, size = 20) =>
    api.get('/news', { params: { category, page, size } }),
  getById: (id: string) => api.get(`/news/${id}`),
}

export const calendarApi = {
  getEvents: (from?: string, to?: string, importance?: string) =>
    api.get('/calendar', { params: { from, to, importance } }),
  getUpcoming: (page = 0, size = 20) =>
    api.get('/calendar/upcoming', { params: { page, size } }),
  getById: (id: string) => api.get(`/calendar/${id}`),
}

export const alertApi = {
  getRules: (userId: string) => api.get('/alerts/rules', { params: { userId } }),
  createRule: (rule: { userId: string; indicatorId: number; conditionType: string; threshold: number }) =>
    api.post('/alerts/rules', rule),
  getHistory: (userId: string, page = 0, size = 20) =>
    api.get('/alerts', { params: { userId, page, size } }),
}

export const dashboardApi = {
  getWidgets: () => api.get('/dashboard/widgets'),
  saveWidgets: (widgets: unknown[]) => api.post('/dashboard/widgets', widgets),
  updateWidget: (id: string, widget: unknown) => api.put(`/dashboard/widgets/${id}`, widget),
}
