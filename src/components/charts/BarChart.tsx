import {
  ResponsiveContainer,
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'
import { formatChartData, formatPrice } from '@/components/charts/chartFormatters'
import { ChartTooltip } from '@/components/charts/chartUtils'
import type { IndicatorData } from '@/types/indicator'

interface BarChartProps {
  data: IndicatorData[]
  color?: string
  unit?: string
}

export function BarChart({ data, color = '#3b82f6', unit }: BarChartProps) {
  const formatted = formatChartData(data)
  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsBarChart data={formatted} accessibilityLayer>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--th-chart-grid)" />
        <XAxis dataKey="shortDate" tick={{ fill: 'var(--th-chart-tick)', fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: 'var(--th-chart-tick)', fontSize: 11 }} axisLine={false} tickLine={false}
          tickFormatter={(v) => formatPrice(v)} width={60} />
        <Tooltip content={<ChartTooltip unit={unit} color={color} />} />
        <Bar dataKey="value" fill={color} radius={[2, 2, 0, 0]} />
      </RechartsBarChart>
    </ResponsiveContainer>
  )
}
