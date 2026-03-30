import { useState } from 'react'
import { RefreshCw, Plus, ChevronDown, ChevronUp } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { MarketCard } from '@/components/dashboard/MarketCard'
import { IndicatorCard } from '@/components/dashboard/IndicatorCard'
import { CorrelationHeatmap } from '@/components/dashboard/CorrelationHeatmap'
import { HistoricalComparison } from '@/components/dashboard/HistoricalComparison'
import { AIPanel } from '@/components/dashboard/AIPanel'
import { MacroIndicatorPanel } from '@/components/dashboard/MacroIndicatorPanel'
import { BondSpreadWidget } from '@/components/dashboard/BondSpreadWidget'
import { CommodityWidget } from '@/components/dashboard/CommodityWidget'
import { MarketSentimentWidget } from '@/components/dashboard/MarketSentimentWidget'
import { ChartOverlay } from '@/components/dashboard/ChartOverlay'
import { EconomicCalendar } from '@/components/dashboard/EconomicCalendar'
import { AlertPanel } from '@/components/dashboard/AlertPanel'
import { NewsFeedWidget } from '@/components/dashboard/NewsFeedWidget'
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-6">
          <h1 className="text-xl font-bold text-heading tracking-tight">경제 지표 대시보드</h1>
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

        {/* API Error Banner */}
        {isError && (
          <div className="rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 p-4 mb-6 flex items-center justify-between">
            <div>
              <p className="text-red-700 dark:text-red-300 text-sm font-medium">API 연결에 실패했습니다</p>
              <p className="text-red-500/70 dark:text-red-400/60 text-xs mt-0.5">{(error as Error)?.message}</p>
            </div>
            <button onClick={handleRefresh} className="px-4 py-2 bg-white dark:bg-elevated text-body rounded-xl text-xs font-medium hover:bg-elevated dark:hover:bg-hover shrink-0 border border-border-dim">
              다시 시도
            </button>
          </div>
        )}

        {/* Market Grid - Top 4 cards with sparklines */}
        <section className="mb-10">
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
          <section className="mb-10">
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

        {/* Market Sentiment & Additional Indices (#22) */}
        <section className="mb-10">
          <MarketSentimentWidget
            indicators={indicators ?? []}
            dataMap={allData ?? {}}
          />
        </section>

        {/* Macro Indicators (#19) */}
        <section className="mb-10">
          <MacroIndicatorPanel
            indicators={indicators ?? []}
            dataMap={allData ?? {}}
          />
        </section>

        {/* Bond & Commodity side by side (#20, #21) */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-10">
          <BondSpreadWidget
            indicators={indicators ?? []}
            dataMap={allData ?? {}}
          />
          <CommodityWidget
            indicators={indicators ?? []}
            dataMap={allData ?? {}}
          />
        </section>

        {/* Chart Overlay Comparison (#23) */}
        <section className="hidden lg:block mb-10">
          <ChartOverlay
            indicators={indicators ?? []}
            dataMap={allData ?? {}}
          />
        </section>

        {/* Bottom 3-column Grid: Correlation + AI + News */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-10">
          {/* Left: Correlation Heatmap */}
          <div className="hidden lg:block">
            <CorrelationHeatmap
              indicators={filteredIndicators.slice(0, 5)}
              dataMap={allData ?? {}}
              selectedId={selectedIndicatorId}
              onSelect={(id) =>
                setSelectedIndicatorId(selectedIndicatorId === id ? undefined : id)
              }
            />
          </div>

          {/* Center: AI Panel */}
          <AIPanel
            selectedIndicator={selectedIndicator}
            series={selectedSeries}
            allIndicators={indicators}
          />

          {/* Right: News Feed Widget (#27) */}
          <NewsFeedWidget />
        </section>

        {/* Calendar & Alerts side by side (#25, #26) */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-10">
          <EconomicCalendar />
          <AlertPanel
            indicators={indicators ?? []}
            dataMap={allData ?? {}}
          />
        </section>

        {/* Historical Comparison */}
        <section className="hidden lg:block mb-10">
          <HistoricalComparison
            indicators={filteredIndicators}
            dataMap={allData ?? {}}
            selectedId={selectedIndicatorId}
            onSelect={(id) =>
              setSelectedIndicatorId(selectedIndicatorId === id ? undefined : id)
            }
          />
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
  return `text-[13px] font-medium px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
    active
      ? 'bg-accent-soft text-accent'
      : 'text-muted hover:text-heading hover:bg-elevated'
  }`
}
