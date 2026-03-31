import { lazy, Suspense } from 'react'
import { sanitizeData } from '@/components/charts/chartFormatters'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import { ChartSkeleton } from '@/components/ui/Skeleton'
import type { ChartType, IndicatorData } from '@/types/indicator'

const LazyBarChart = lazy(() =>
  import('@/components/charts/BarChart').then((m) => ({ default: m.BarChart })),
)
const LazyAreaChart = lazy(() =>
  import('@/components/charts/AreaChart').then((m) => ({ default: m.AreaChart })),
)
const LazyCandlestickChart = lazy(() =>
  import('@/components/charts/CandlestickChart').then((m) => ({ default: m.CandlestickChart })),
)
const LazyNumberCard = lazy(() =>
  import('@/components/charts/NumberCard').then((m) => ({ default: m.NumberCard })),
)
const LazyLineChartInner = lazy(() => import('@/components/charts/LineChart').then((m) => ({ default: m.LineChart })))

interface ChartRendererProps {
  type: ChartType
  data: IndicatorData[]
  color?: string
  unit?: string
}

interface ChartRendererInnerProps extends ChartRendererProps {
  ariaLabel?: string
}

function ChartRendererInner({ type, data, color = '#3b82f6', unit, ariaLabel }: ChartRendererInnerProps) {
  const safeData = sanitizeData(data)
  if (safeData.length === 0) {
    return <p className="text-faint text-sm text-center py-8">데이터 없음</p>
  }

  const chartLabel = ariaLabel ?? `${type} 차트, 데이터 ${safeData.length}건`
  const wrapChart = (children: React.ReactNode) => (
    <div role="img" aria-label={chartLabel}>
      {children}
    </div>
  )

  switch (type) {
    case 'number':
      return <LazyNumberCard data={safeData} color={color} unit={unit} />
    case 'bar':
      return wrapChart(<LazyBarChart data={safeData} color={color} unit={unit} />)
    case 'area':
      return wrapChart(<LazyAreaChart data={safeData} color={color} unit={unit} />)
    case 'candlestick':
      return wrapChart(<LazyCandlestickChart data={safeData} />)
    case 'line':
    default:
      return wrapChart(<LazyLineChartInner data={safeData} color={color} unit={unit} />)
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
      <Suspense fallback={<ChartSkeleton />}>
        <ChartRendererInner {...props} />
      </Suspense>
    </ErrorBoundary>
  )
}
