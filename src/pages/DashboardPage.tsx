import { useState } from 'react'
import { LayoutDashboard, RefreshCw, Plus } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { IndicatorCard } from '@/components/dashboard/IndicatorCard'
import { WidgetGrid } from '@/components/dashboard/WidgetGrid'
import { AddWidgetModal } from '@/components/dashboard/AddWidgetModal'
import { IndicatorCardSkeleton } from '@/components/ui/Skeleton'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import { useIndicators, useIndicatorSeries } from '@/hooks/useIndicators'
import { useDashboardStore } from '@/store/dashboardStore'
import type { IndicatorCategory } from '@/types/indicator'

const CATEGORY_LABELS: Record<IndicatorCategory, string> = {
  STOCK: '주식',
  FOREX: '외환',
  CRYPTO: '암호화폐',
  MACRO: '거시경제',
  BOND: '채권',
  COMMODITY: '원자재',
}

export function DashboardPage() {
  const [selectedCategory, setSelectedCategory] = useState<IndicatorCategory | null>(null)
  const [addModalOpen, setAddModalOpen] = useState(false)
  const queryClient = useQueryClient()
  const { data: indicators, isLoading, isError, error } = useIndicators()
  const widgets = useDashboardStore((s) => s.widgets)

  const indicatorIds = indicators?.map((i) => i.id) ?? []
  const { data: allData } = useIndicatorSeries(indicatorIds, '1M')

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
          <button onClick={handleRefresh} className="mt-4 px-4 py-2 bg-elevated text-body rounded-lg text-sm hover:bg-hover">
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

  return (
    <ErrorBoundary>
      <main className="max-w-screen-2xl mx-auto px-6 py-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <LayoutDashboard size={18} className="text-blue-400" />
            <h1 className="text-lg font-semibold text-heading">대시보드</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setAddModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-500 text-xs transition-colors"
            >
              <Plus size={12} />
              위젯 추가
            </button>
            <button
              onClick={handleRefresh}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-elevated text-muted hover:text-heading text-xs transition-colors"
            >
              <RefreshCw size={12} />
              새로고침
            </button>
          </div>
        </div>

        {/* 카테고리 필터 */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              selectedCategory === null
                ? 'bg-blue-600 text-white'
                : 'bg-elevated text-muted hover:text-heading'
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
                  : 'bg-elevated text-muted hover:text-heading'
              }`}
            >
              {CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>

        {/* 주요 지표 카드 */}
        <section>
          <h2 className="text-sm text-muted mb-3 uppercase tracking-wide">주요 지표</h2>
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

        {/* 위젯 그리드 */}
        <section className="mt-8">
          <h2 className="text-sm text-muted mb-3 uppercase tracking-wide">
            위젯 ({widgets.length})
          </h2>
          <WidgetGrid indicators={indicators ?? []} />
        </section>

        {/* 위젯 추가 모달 */}
        <AddWidgetModal
          open={addModalOpen}
          onClose={() => setAddModalOpen(false)}
          indicators={indicators ?? []}
        />
      </main>
    </ErrorBoundary>
  )
}
