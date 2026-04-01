import {
  ResponsiveContainer,
  AreaChart as RechartsAreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Brush,
} from 'recharts'
import { formatChartData, formatPrice } from '@/components/charts/chartFormatters'
import { ChartTooltip } from '@/components/charts/chartUtils'
import type { IndicatorData } from '@/types/indicator'

interface AreaChartProps {
  data: IndicatorData[]
  color?: string
  unit?: string
}

export function AreaChart({ data, color = '#3b82f6', unit }: AreaChartProps) {
  const formatted = formatChartData(data)
  const gradientId = `area-gradient-${color.replace('#', '')}`
  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsAreaChart data={formatted} accessibilityLayer>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.3} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--th-chart-grid)" />
        <XAxis dataKey="shortDate" tick={{ fill: 'var(--th-chart-tick)', fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: 'var(--th-chart-tick)', fontSize: 11 }} axisLine={false} tickLine={false}
          tickFormatter={(v) => formatPrice(v)} width={60} />
        <Tooltip content={<ChartTooltip unit={unit} color={color} />} />
        <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2}
          fill={`url(#${gradientId})`} />
        {formatted.length > 30 && (
          <Brush dataKey="shortDate" height={20} stroke={color} travellerWidth={8} />
        )}
      </RechartsAreaChart>
    </ResponsiveContainer>
  )
}
