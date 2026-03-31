import { getLocale, formatChartFullDate, formatChartShortDate } from '@/lib/dateUtils'
import type { IndicatorData } from '@/types/indicator'

export function formatPrice(value: number): string {
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`
  if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(1)}K`
  if (Math.abs(value) < 1) return value.toFixed(4)
  return value.toLocaleString(getLocale(), { maximumFractionDigits: 2 })
}

export function formatChartData(data: IndicatorData[]) {
  return data.map((d) => ({
    date: formatChartFullDate(new Date(d.date)),
    shortDate: formatChartShortDate(new Date(d.date)),
    value: d.value,
  }))
}
