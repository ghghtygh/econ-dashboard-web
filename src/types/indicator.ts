export type IndicatorCategory = 'STOCK' | 'FOREX' | 'CRYPTO' | 'MACRO' | 'BOND' | 'COMMODITY'

// 백엔드 API 응답 타입
export interface ApiResponse<T> {
  success: boolean
  data: T
  error?: { code: string; message: string }
  timestamp: string
}

export interface Indicator {
  id: number
  name: string
  symbol: string
  category: IndicatorCategory
  unit: string
  source: string
  description: string | null
  createdAt: string
  updatedAt: string
}

export interface IndicatorData {
  id: number
  indicatorId: number
  date: string
  value: number
  open: number | null
  high: number | null
  low: number | null
  close: number | null
  volume: number | null
  change: number | null
}

export interface PagedResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  size: number
  number: number
}

export type ChartType = 'line' | 'bar' | 'area' | 'number'

export interface DashboardWidget {
  id: string
  indicatorId: number
  chartType: ChartType
  position: { x: number; y: number; w: number; h: number }
  title?: string
  color?: string
  dateRange?: '1D' | '1W' | '1M' | '3M' | '1Y'
}
