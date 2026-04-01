import {
  ResponsiveContainer,
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'
import type { IndicatorData } from '@/types/indicator'
import { formatPrice, formatChartData } from './chartFormatters'

interface LineChartProps {
  data: IndicatorData[]
  title?: string
  color?: string
  unit?: string
}

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{ value: number }>
  label?: string
  unit?: string
  color?: string
}

function CustomTooltip({ active, payload, label, unit, color }: CustomTooltipProps) {
  if (!active || !payload?.length) return null
  const value = payload[0].value
  return (
    <div className="rounded-lg border border-border-mid bg-elevated px-3 py-2 shadow-lg">
      <p className="text-xs text-muted mb-1">{label}</p>
      <p className="text-sm font-semibold" style={{ color }}>
        {formatPrice(value)}{unit ? ` ${unit}` : ''}
      </p>
    </div>
  )
}

export function LineChart({ data, title, color = '#3b82f6', unit }: LineChartProps) {
  const formatted = formatChartData(data)

  return (
    <div className="rounded-lg border border-border-dim bg-surface p-4">
      {title && <h3 className="text-sm font-medium text-body mb-4">{title}</h3>}
      <ResponsiveContainer width="100%" height={200}>
        <RechartsLineChart data={formatted}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--th-chart-grid)" />
          <XAxis dataKey="shortDate" tick={{ fill: 'var(--th-chart-tick)', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: 'var(--th-chart-tick)', fontSize: 11 }} axisLine={false} tickLine={false}
            tickFormatter={(v) => formatPrice(v)} width={60} />
          <Tooltip content={<CustomTooltip unit={unit} color={color} />} />
          <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={false} />
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  )
}
