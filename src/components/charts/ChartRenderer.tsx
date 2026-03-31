import {
  ResponsiveContainer,
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'
import { BarChart } from '@/components/charts/BarChart'
import { AreaChart } from '@/components/charts/AreaChart'
import { CandlestickChart } from '@/components/charts/CandlestickChart'
import { NumberCard } from '@/components/charts/NumberCard'
import { formatChartData, formatPrice, sanitizeData } from '@/components/charts/chartFormatters'
import { ChartTooltip } from '@/components/charts/chartUtils'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import type { ChartType, IndicatorData } from '@/types/indicator'

interface ChartRendererProps {
  type: ChartType
  data: IndicatorData[]
  color?: string
  unit?: string
}

function ChartRendererInner({ type, data, color = '#3b82f6', unit }: ChartRendererProps) {
  const safeData = sanitizeData(data)
  if (safeData.length === 0) {
    return <p className="text-faint text-sm text-center py-8">데이터 없음</p>
  }

  switch (type) {
    case 'number':
      return <NumberCard data={safeData} color={color} unit={unit} />
    case 'bar':
      return <BarChart data={safeData} color={color} unit={unit} />
    case 'area':
      return <AreaChart data={safeData} color={color} unit={unit} />
    case 'candlestick':
      return <CandlestickChart data={safeData} />
    case 'line':
    default: {
      const formatted = formatChartData(safeData)
      return (
        <ResponsiveContainer width="100%" height="100%">
          <RechartsLineChart data={formatted} accessibilityLayer>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--th-chart-grid)" />
            <XAxis dataKey="shortDate" tick={{ fill: 'var(--th-chart-tick)', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: 'var(--th-chart-tick)', fontSize: 11 }} axisLine={false} tickLine={false}
              tickFormatter={(v) => formatPrice(v)} width={60} />
            <Tooltip content={<ChartTooltip unit={unit} color={color} />} trigger="hover" />
            <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={false} />
          </RechartsLineChart>
        </ResponsiveContainer>
      )
    }
  }
}

export function ChartRenderer(props: ChartRendererProps) {
  return (
    <ErrorBoundary
      fallback={
        <div className="flex items-center justify-center py-8 text-faint text-sm">
          차트를 표시할 수 없습니다
        </div>
      }
    >
      <ChartRendererInner {...props} />
    </ErrorBoundary>
  )
}
