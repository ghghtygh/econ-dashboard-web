import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import type { IndicatorData } from '@/types/indicator'

export function formatPrice(value: number): string {
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`
  if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(1)}K`
  if (Math.abs(value) < 1) return value.toFixed(4)
  return value.toLocaleString('ko-KR', { maximumFractionDigits: 2 })
}

export function formatChartData(data: IndicatorData[]) {
  return data.map((d) => ({
    date: format(new Date(d.date), 'yyyy.MM.dd (EEE)', { locale: ko }),
    shortDate: format(new Date(d.date), 'MM/dd'),
    value: d.value,
  }))
}
