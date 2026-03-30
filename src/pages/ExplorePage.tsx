import { useState, useMemo } from 'react'
import { Search, Plus, Check, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { InfoTooltip, IndicatorTooltipContent } from '@/components/ui/InfoTooltip'
import { getIndicatorDescription } from '@/data/indicatorDescriptions'
import { useIndicators, useIndicatorSeries } from '@/hooks/useIndicators'
import { useDashboardStore } from '@/store/dashboardStore'
import type { IndicatorCategory, DashboardWidget } from '@/types/indicator'

const CATEGORY_LABELS: Record<string, string> = {
  ALL: '전체',
  STOCK: '주식',
  FOREX: '외환',
  COMMODITY: '원자재',
  BOND: '채권',
  CRYPTO: '암호화폐',
  MACRO: '거시경제',
}

const CATEGORY_COLORS: Record<string, string> = {
  STOCK: '#378ADD',
  FOREX: '#E24B4A',
  CRYPTO: '#F59E0B',
  MACRO: '#7F77DD',
  BOND: '#1D9E75',
  COMMODITY: '#EF9F27',
}

export function ExplorePage() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<IndicatorCategory | null>(null)
  const { data: indicators, isLoading } = useIndicators()
  const widgets = useDashboardStore((s) => s.widgets)
  const addWidget = useDashboardStore((s) => s.addWidget)

  const indicatorIds = indicators?.map((i) => i.id) ?? []
  const { data: allData } = useIndicatorSeries(indicatorIds, '1M')

  const filtered = useMemo(() => {
    let list = indicators ?? []
    if (category) list = list.filter((i) => i.category === category)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          i.symbol.toLowerCase().includes(q),
      )
    }
    return list
  }, [indicators, category, search])

  const categories = useMemo(
    () => [...new Set(indicators?.map((i) => i.category) ?? [])] as IndicatorCategory[],
    [indicators],
  )

  const widgetIndicatorIds = new Set(widgets.map((w) => w.indicatorId))

  const handleAddWidget = (indicatorId: number, name: string) => {
    if (widgetIndicatorIds.has(indicatorId)) return
    const widget: DashboardWidget = {
      id: `widget-${indicatorId}-${Date.now()}`,
      indicatorId,
      chartType: 'line',
      position: { x: 0, y: Infinity, w: 4, h: 3 },
      title: name,
      color: '#378ADD',
      dateRange: '1M',
    }
    addWidget(widget)
  }

  return (
    <main className="dash-container">
      {/* Header */}
      <div className="pb-6 mb-6 border-b border-border-dim">
        <h1 className="text-lg font-semibold text-heading mb-1">지표 탐색</h1>
        <p className="text-sm text-muted">경제 지표를 검색하고 대시보드에 추가하세요</p>
      </div>

      {/* Search + Category Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="지표명 또는 심볼로 검색..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border-dim bg-surface text-body text-sm placeholder:text-faint focus:outline-none focus:border-blue-400/50 transition-colors"
          />
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setCategory(null)}
            className={tabClass(category === null)}
          >
            {CATEGORY_LABELS.ALL}
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={tabClass(category === cat)}
            >
              {CATEGORY_LABELS[cat] ?? cat}
            </button>
          ))}
        </div>
      </div>

      {/* Results count */}
      <p className="text-xs text-muted mb-4">
        {filtered.length}개 지표
        {search && <span className="text-faint"> · "{search}" 검색 결과</span>}
      </p>

      {/* Indicator Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-48 rounded-xl border border-border-dim bg-surface animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-muted text-sm">검색 결과가 없습니다</p>
          <p className="text-faint text-xs mt-1">다른 키워드나 카테고리를 선택해보세요</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((indicator) => {
            const series = allData?.[indicator.id] ?? []
            const latest = series.length > 0 ? series[series.length - 1] : undefined
            const prev = series.length > 1 ? series[series.length - 2] : undefined
            const changePercent =
              latest && prev && prev.value !== 0
                ? ((latest.value - prev.value) / prev.value) * 100
                : 0
            const isUp = changePercent >= 0
            const isAdded = widgetIndicatorIds.has(indicator.id)
            const color = CATEGORY_COLORS[indicator.category] ?? '#378ADD'
            const desc = getIndicatorDescription(indicator.symbol, indicator.category)

            // Mini sparkline
            const sparkPoints = useMemo(() => {
              if (series.length < 2) return ''
              const last12 = series.slice(-12)
              const min = Math.min(...last12.map((d) => d.value))
              const max = Math.max(...last12.map((d) => d.value))
              const range = max - min || 1
              return last12
                .map((d, i) => {
                  const x = (i / (last12.length - 1)) * 120
                  const y = 36 - ((d.value - min) / range) * 30
                  return `${x},${y}`
                })
                .join(' ')
            }, [series])

            return (
              <div
                key={indicator.id}
                className="rounded-xl border border-border-dim bg-surface p-5 hover:border-border-mid transition-colors flex flex-col"
              >
                {/* Top: Category badge + tooltip */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ background: color }}
                    />
                    <span className="text-[10px] text-faint uppercase tracking-wide">
                      {indicator.category}
                    </span>
                    <InfoTooltip>
                      <IndicatorTooltipContent {...desc} />
                    </InfoTooltip>
                  </div>
                  <span className="text-[10px] text-faint font-mono">{indicator.symbol}</span>
                </div>

                {/* Name */}
                <h3 className="text-sm font-medium text-heading mb-1">{indicator.name}</h3>

                {/* Description */}
                <p className="text-xs text-muted line-clamp-2 mb-3">{desc.definition}</p>

                {/* Sparkline + Value */}
                <div className="flex items-end justify-between mt-auto">
                  <div>
                    {latest ? (
                      <>
                        <p className="text-lg font-medium text-heading">
                          {latest.value.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                          <span className="text-xs text-muted ml-1">{indicator.unit}</span>
                        </p>
                        <div className={cn('flex items-center gap-0.5 text-xs', {
                          'text-green-400': isUp,
                          'text-red-400': !isUp,
                        })}>
                          {isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                          <span>{isUp ? '+' : ''}{changePercent.toFixed(2)}%</span>
                        </div>
                      </>
                    ) : (
                      <p className="text-faint text-sm">데이터 없음</p>
                    )}
                  </div>

                  {sparkPoints && (
                    <svg className="w-28 h-9" viewBox="0 0 120 40" preserveAspectRatio="none">
                      <polyline
                        points={sparkPoints}
                        fill="none"
                        stroke={color}
                        strokeWidth="1.5"
                        opacity={0.6}
                      />
                    </svg>
                  )}
                </div>

                {/* Add to Dashboard button */}
                <button
                  onClick={() => handleAddWidget(indicator.id, indicator.name)}
                  disabled={isAdded}
                  className={cn(
                    'mt-4 w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-colors',
                    isAdded
                      ? 'bg-elevated text-muted cursor-default'
                      : 'bg-blue-600 text-white hover:bg-blue-500 cursor-pointer',
                  )}
                >
                  {isAdded ? (
                    <>
                      <Check size={13} />
                      대시보드에 추가됨
                    </>
                  ) : (
                    <>
                      <Plus size={13} />
                      대시보드에 추가
                    </>
                  )}
                </button>
              </div>
            )
          })}
        </div>
      )}
    </main>
  )
}

function tabClass(active: boolean) {
  return `text-xs px-3 py-1.5 rounded-full border transition-colors cursor-pointer ${
    active
      ? 'bg-elevated text-heading border-border-mid'
      : 'border-border-dim text-muted hover:text-heading hover:border-border-mid'
  }`
}
