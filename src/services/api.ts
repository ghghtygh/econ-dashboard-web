import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
})

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

export const dashboardApi = {
  getWidgets: () => api.get('/dashboard/widgets'),
  saveWidgets: (widgets: unknown[]) => api.post('/dashboard/widgets', widgets),
  updateWidget: (id: string, widget: unknown) => api.put(`/dashboard/widgets/${id}`, widget),
}
