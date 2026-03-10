import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
})

export default api

export const indicatorApi = {
  getAll: () => api.get('/indicators'),
  getById: (id: string) => api.get(`/indicators/${id}`),
  getCategories: () => api.get('/indicators/categories'),
  getData: (id: string, from?: string, to?: string) =>
    api.get(`/indicators/${id}/data`, { params: { from, to } }),
  getSeries: (ids: string[], from?: string, to?: string) =>
    api.post('/indicators/series', { ids, from, to }),
}

export const dashboardApi = {
  getWidgets: () => api.get('/dashboard/widgets'),
  saveWidgets: (widgets: unknown[]) => api.post('/dashboard/widgets', widgets),
}
