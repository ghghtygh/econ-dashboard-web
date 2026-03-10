export type IndicatorCategory = 'STOCK' | 'FOREX' | 'CRYPTO' | 'MACRO' | 'BOND' | 'COMMODITY'

export interface Indicator {
  id: string
  name: string
  symbol: string
  category: IndicatorCategory
  description?: string
  unit?: string
}

export interface IndicatorData {
  indicatorId: string
  timestamp: string
  value: number
  change?: number
  changePercent?: number
}

export interface IndicatorSeries {
  indicator: Indicator
  data: IndicatorData[]
}

export interface DashboardWidget {
  id: string
  indicatorId: string
  chartType: 'line' | 'bar' | 'area' | 'number'
  position: { x: number; y: number; w: number; h: number }
  title?: string
}
