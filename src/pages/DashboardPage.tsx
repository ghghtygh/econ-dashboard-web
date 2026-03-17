import { useState } from 'react'
import { LayoutDashboard, RefreshCw } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { IndicatorCard } from '@/components/dashboard/IndicatorCard'
import { LineChart } from '@/components/charts/LineChart'
import { IndicatorCardSkeleton, ChartSkeleton } from '@/components/ui/Skeleton'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import { useIndicators, useIndicatorSeries } from '@/hooks/useIndicators'
import type { DateRange } from '@/hooks/useIndicators'
import type { IndicatorCategory } from '@/types/indicator'

const CATEGORY_LABELS: Record<IndicatorCategory, string> = {
  STOCK: '주식',
  FOREX: '외환',
  CRYPTO: '암호화폐',
  MACRO: '거시경제',
  BOND: '채권',
  COMMODITY: '원자재',
}

const CHART_COLORS: Record<IndicatorCategory, string> = {
  STOCK: '#3b82f6',
  FOREX: '#8b5cf6',
  CRYPTO: '#f59e0b',
  MACRO: '#10b981',
  BOND: '#ef4444',
  COMMODITY: '#ec4899',
}

const DATE_RANGE_OPTIONS: { value: DateRange; label: string }[] = [
  { value: '1D', label: '1일' },
  { value: '1W', label: '1주' },
  { value: '1M', label: '1개월' },
  { value: '3M', label: '3개월' },
  { value: '1Y', label: '1년' },
]

export function DashboardPage() {
  const [selectedCategory, setSelectedCategory] = useState<IndicatorCategory | null>(null)
  const [dateRange, setDateRange] = useState<DateRange>('1M')
  const queryClient = useQueryClient()
  const { data: indicators, isLoading, isError, error } = useIndicators()

  const indicatorIds = indicators?.map((i) => i.id) ?? []
  const { data: allData, isLoading: isChartLoading } = useIndicatorSeries(indicatorIds, dateRange)

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['indicators'] })
    queryClient.invalidateQueries({ queryKey: ['indicatorSeries'] })
  }

  if (isError) {
    return (
      <main className="max-w-screen-2xl mx-auto px-6 py-6">
        <div className="rounded-xl border border-red-900/50 bg-red-950/30 p-8 text-center">
          <p className="text-red-300">API 연결에 실패했습니다</p>
          <p className="text-red-400/60 text-sm mt-1">{(error as Error)?.message}</p>
          <button onClick={handleRefresh} className="mt-4 px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-sm hover:bg-slate-700">
            다시 시도
          </button>
        </div>
      </main>
    )
  }

  const categories = [...new Set(indicators?.map((i) => i.category) ?? [])] as IndicatorCategory[]
  const filteredIndicators = selectedCategory
    ? (indicators ?? []).filter((i) => i.category === selectedCategory)
    : (indicators ?? [])
  const chartIndicators = filteredIndicators.filter((i) => (allData?.[i.id]?.length ?? 0) > 0)

  return (
    <ErrorBoundary>
      <main className="max-w-screen-2xl mx-auto px-6 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <LayoutDashboard size={18} className="text-blue-400" />
            <h1 className="text-lg font-semibold text-white">대시보드</h1>
          </div>
          <button
            onClick={handleRefresh}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white text-xs transition-colors"
          >
            <RefreshCw size={12} />
            새로고침
          </button>
        </div>

        {/* 카테고리 필터 */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              selectedCategory === null
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            전체
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>

        {/* 주요 지표 카드 */}
        <section>
          <h2 className="text-sm text-slate-500 mb-3 uppercase tracking-wide">주요 지표</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {isLoading
              ? Array.from({ length: 10 }).map((_, i) => <IndicatorCardSkeleton key={i} />)
              : filteredIndicators.map((indicator) => {
                  const series = allData?.[indicator.id] ?? []
                  const latest = series.length > 0 ? series[series.length - 1] : undefined
                  const prev = series.length > 1 ? series[series.length - 2] : undefined
                  return (
                    <IndicatorCard
                      key={indicator.id}
                      indicator={indicator}
                      latest={latest}
                      prevClose={prev?.value}
                    />
                  )
                })}
          </div>
        </section>

        {/* 차트 */}
        <section className="mt-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm text-slate-500 uppercase tracking-wide">차트</h2>
            <div className="flex gap-1">
              {DATE_RANGE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setDateRange(opt.value)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                    dateRange === opt.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          {isChartLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => <ChartSkeleton key={i} />)}
            </div>
          ) : chartIndicators.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {chartIndicators.map((indicator) => (
                <LineChart
                  key={indicator.id}
                  data={allData![indicator.id]}
                  title={indicator.name}
                  color={CHART_COLORS[indicator.category]}
                  unit={indicator.unit}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-800 p-8 text-center">
              <p className="text-slate-600">수집된 차트 데이터가 없습니다</p>
            </div>
          )}
        </section>
      </main>
    </ErrorBoundary>
  )
}
