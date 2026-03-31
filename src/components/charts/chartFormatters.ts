import { format, isValid } from 'date-fns'
import { ko } from 'date-fns/locale'
import type { IndicatorData } from '@/types/indicator'

export function formatPrice(value: number): string {
  if (!Number.isFinite(value)) return '—'
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`
  if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(1)}K`
  if (Math.abs(value) < 1) return value.toFixed(4)
  return value.toLocaleString('ko-KR', { maximumFractionDigits: 2 })
}

export function sanitizeData(data: IndicatorData[]): IndicatorData[] {
  return data.filter((d) => {
    const date = new Date(d.date)
    return isValid(date) && Number.isFinite(d.value) && d.value !== null
  })
}

export function formatChartData(data: IndicatorData[]) {
  return sanitizeData(data).map((d) => {
    const date = new Date(d.date)
    return {
      date: format(date, 'yyyy.MM.dd (EEE)', { locale: ko }),
      shortDate: format(date, 'MM/dd'),
      value: d.value,
    }
  })
}
