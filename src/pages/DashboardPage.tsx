import { useState } from 'react'
import { RefreshCw, Plus, ChevronDown, ChevronUp } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { MarketCard } from '@/components/dashboard/MarketCard'
import { IndicatorCard } from '@/components/dashboard/IndicatorCard'
import { CorrelationHeatmap } from '@/components/dashboard/CorrelationHeatmap'
import { AIPanel } from '@/components/dashboard/AIPanel'
import { NewsTimeline } from '@/components/dashboard/NewsTimeline'
import { WidgetGrid } from '@/components/dashboard/WidgetGrid'
import { AddWidgetModal } from '@/components/dashboard/AddWidgetModal'
import { IndicatorCardSkeleton } from '@/components/ui/Skeleton'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import { useIndicators, useIndicatorSeries } from '@/hooks/useIndicators'
import { useDashboardStore } from '@/store/dashboardStore'
import type { IndicatorCategory } from '@/types/indicator'

const CATEGORY_LABELS: Record<string, string> = {
  ALL: '주요 지표',
  STOCK: '주식',
  FOREX: '외환',
  COMMODITY: '원자재',
  BOND: '채권',
  CRYPTO: '암호화폐',
  MACRO: '거시경제',
}

export function DashboardPage() {
  const [selectedCategory, setSelectedCategory] = useState<IndicatorCategory | null>(null)
  const [selectedIndicatorId, setSelectedIndicatorId] = useState<number | undefined>()
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [showAllIndicators, setShowAllIndicators] = useState(false)
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
      <main className="dash-container">
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

  // Top 4 indicators for market cards (highlight row)
  const topIndicators = filteredIndicators.slice(0, 4)
  // Remaining indicators for expanded grid
  const remainingIndicators = filteredIndicators.slice(4)
  const selectedIndicator = indicators?.find((i) => i.id === selectedIndicatorId)
  const selectedSeries = selectedIndicatorId ? allData?.[selectedIndicatorId] : undefined

  return (
    <ErrorBoundary>
      <main className="dash-container">
        {/* Top Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-6 border-b border-border-dim">
          <h1 className="text-lg font-semibold text-heading">경제 지표 대시보드</h1>
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setSelectedCategory(null)}
              className={tabClass(selectedCategory === null)}
            >
              {CATEGORY_LABELS.ALL}
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={tabClass(selectedCategory === cat)}
              >
                {CATEGORY_LABELS[cat] ?? cat}
              </button>
            ))}
          </div>
        </div>

        {/* Market Grid - Top 4 cards with sparklines */}
        <section className="mb-8 pb-8 border-b border-border-dim">
          <h2 className="section-label">실시간 마켓</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {isLoading
              ? Array.from({ length: 4 }).map((_, i) => <IndicatorCardSkeleton key={i} />)
              : topIndicators.map((indicator) => (
                  <MarketCard
                    key={indicator.id}
                    indicator={indicator}
                    series={allData?.[indicator.id] ?? []}
                    isSelected={selectedIndicatorId === indicator.id}
                    onClick={() =>
                      setSelectedIndicatorId(
                        selectedIndicatorId === indicator.id ? undefined : indicator.id,
                      )
                    }
                  />
                ))}
          </div>
        </section>

        {/* Expandable All Indicators Grid */}
        {remainingIndicators.length > 0 && (
          <section className="mb-8 pb-8 border-b border-border-dim">
            <button
              onClick={() => setShowAllIndicators(!showAllIndicators)}
              className="flex items-center gap-1.5 text-xs text-muted hover:text-heading transition-colors py-3 mb-4"
            >
              {showAllIndicators ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              전체 지표 보기 ({filteredIndicators.length}개)
            </button>
            {showAllIndicators && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 animate-fadeIn">
                {remainingIndicators.map((indicator) => {
                  const series = allData?.[indicator.id] ?? []
                  const latest = series.length > 0 ? series[series.length - 1] : undefined
                  const prev = series.length > 1 ? series[series.length - 2] : undefined
                  return (
                    <div
                      key={indicator.id}
                      className="cursor-pointer"
                      onClick={() =>
                        setSelectedIndicatorId(
                          selectedIndicatorId === indicator.id ? undefined : indicator.id,
                        )
                      }
                    >
                      <IndicatorCard
                        indicator={indicator}
                        latest={latest}
                        prevClose={prev?.value}
                      />
                    </div>
                  )
                })}
              </div>
            )}
          </section>
        )}

        {/* Divider */}
        <hr className="section-divider" />

        {/* Bottom 3-column Grid */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-12">
          {/* Left: Correlation Heatmap */}
          <CorrelationHeatmap
            indicators={filteredIndicators.slice(0, 5)}
            dataMap={allData ?? {}}
            selectedId={selectedIndicatorId}
            onSelect={(id) =>
              setSelectedIndicatorId(selectedIndicatorId === id ? undefined : id)
            }
          />

          {/* Center: AI Panel */}
          <AIPanel
            selectedIndicator={selectedIndicator}
            series={selectedSeries}
            allIndicators={indicators}
          />

          {/* Right: News Timeline */}
          <NewsTimeline />
        </section>

        {/* Divider */}
        <hr className="section-divider" />

        {/* Widget Section (existing) */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-label !mb-0">
              위젯 ({widgets.length})
            </h2>
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
          <WidgetGrid indicators={indicators ?? []} />
        </section>

        {/* Add Widget Modal */}
        <AddWidgetModal
          open={addModalOpen}
          onClose={() => setAddModalOpen(false)}
          indicators={indicators ?? []}
        />
      </main>
    </ErrorBoundary>
  )
}

function tabClass(active: boolean) {
  return `text-xs px-3 py-1 rounded-full border transition-colors cursor-pointer ${
    active
      ? 'bg-elevated text-heading border-border-mid'
      : 'border-border-dim text-muted hover:text-heading hover:border-border-mid'
  }`
}
