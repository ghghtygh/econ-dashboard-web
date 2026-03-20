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

export function ChartTooltip({ active, payload, label, unit, color }: {
  active?: boolean
  payload?: Array<{ value: number }>
  label?: string
  unit?: string
  color?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 shadow-lg">
      <p className="text-xs text-slate-400 mb-1">{label}</p>
      <p className="text-sm font-semibold" style={{ color }}>
        {formatPrice(payload[0].value)}{unit ? ` ${unit}` : ''}
      </p>
    </div>
  )
}
