import { useMemo, useState } from 'react'
import { cn } from '@/lib/utils'
import { getIndicatorDescription } from '@/data/indicatorDescriptions'
import type { Indicator, IndicatorData } from '@/types/indicator'

interface CommodityWidgetProps {
  indicators: Indicator[]
  dataMap: Record<number, IndicatorData[]>
}

interface SubGroup {
  label: string
  symbols: string[]
}

const SUB_GROUPS: SubGroup[] = [
  { label: 'Energy', symbols: ['CL=F', 'NG=F'] },
  { label: 'Metals', symbols: ['GC=F', 'HG=F'] },
  { label: 'Agriculture', symbols: ['ZW=F', 'ZS=F'] },
]

const GROUP_COLORS: Record<string, string> = {
  Energy: '#EF9F27',
  Metals: '#E24B4A',
  Agriculture: '#1D9E75',
}

function Sparkline({ series, color }: { series: IndicatorData[]; color: string }) {
  const points = useMemo(() => {
    if (series.length < 2) return ''
    const last8 = series.slice(-8)
    const min = Math.min(...last8.map((d) => d.value))
    const max = Math.max(...last8.map((d) => d.value))
    const range = max - min || 1
    return last8
      .map((d, i) => {
        const x = (i / (last8.length - 1)) * 100
        const y = 28 - ((d.value - min) / range) * 24
        return `${x},${y}`
      })
      .join(' ')
  }, [series])

  if (!points) return null

  return (
    <svg className="w-full h-7" viewBox="0 0 100 32" preserveAspectRatio="none">
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" />
    </svg>
  )
}

function CommodityCard({
  indicator,
  series,
  groupColor,
}: {
  indicator: Indicator
  series: IndicatorData[]
  groupColor: string
}) {
  const [expanded, setExpanded] = useState(false)

  const latest = series.length > 0 ? series[series.length - 1] : undefined
  const prev = series.length > 1 ? series[series.length - 2] : undefined

  const changePercent = useMemo(() => {
    if (!latest || !prev || prev.value === 0) return latest?.change ?? 0
    return ((latest.value - prev.value) / prev.value) * 100
  }, [latest, prev])

  const isUp = changePercent >= 0
  const desc = getIndicatorDescription(indicator.symbol, indicator.category)
  const isCopper = indicator.symbol === 'HG=F'

  return (
    <div
      className={cn(
        'rounded-xl border bg-surface p-4 cursor-pointer transition-colors',
        'border-border-dim hover:border-border-mid',
      )}
      onClick={() => setExpanded((v) => !v)}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] text-faint uppercase tracking-wide">
            {indicator.symbol}
            {indicator.unit ? ` · ${indicator.unit}` : ''}
          </p>
          <h4 className="text-[13px] font-medium text-heading mt-0.5 truncate">
            {indicator.name}
          </h4>
        </div>
        <span
          className={cn(
            'shrink-0 text-[10px] px-2 py-0.5 rounded-full font-medium',
            isUp
              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
          )}
        >
          {isUp ? '+' : ''}
          {changePercent.toFixed(1)}%
        </span>
      </div>

      {/* Value */}
      {latest ? (
        <p className="text-xl font-medium text-heading mt-2">
          {latest.value.toLocaleString(undefined, { maximumFractionDigits: 2 })}
        </p>
      ) : (
        <p className="text-faint text-sm mt-2">데이터 없음</p>
      )}

      {/* Sparkline */}
      <div className="mt-2">
        <Sparkline series={series} color={groupColor} />
      </div>

      {/* Dr. Copper callout */}
      {isCopper && (
        <div className="mt-2 px-2.5 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40">
          <p className="text-[11px] font-medium text-amber-800 dark:text-amber-300">
            Dr. Copper
          </p>
          <p className="text-[10px] text-amber-700 dark:text-amber-400 mt-0.5">
            구리는 경제의 청진기로 불리며, 글로벌 경기 방향의 선행 지표로 활용됩니다.
          </p>
        </div>
      )}

      {/* Expanded: interpretation & learnMore */}
      {expanded && (desc.interpretation || desc.learnMore) && (
        <div className="mt-3 pt-3 border-t border-border-dim space-y-2 animate-fadeIn">
          {desc.interpretation && (
            <div>
              <p className="text-[10px] text-faint uppercase tracking-wide mb-0.5">해석</p>
              <p className="text-xs text-body leading-relaxed">{desc.interpretation}</p>
            </div>
          )}
          {desc.learnMore && (
            <div>
              <p className="text-[10px] text-faint uppercase tracking-wide mb-0.5">더 알아보기</p>
              <p className="text-xs text-muted leading-relaxed">{desc.learnMore}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function CommodityWidget({ indicators, dataMap }: CommodityWidgetProps) {
  const commodities = useMemo(
    () => indicators.filter((ind) => ind.category === 'COMMODITY'),
    [indicators],
  )

  if (commodities.length === 0) return null

  return (
    <section>
      {/* Section header */}
      <h2 className="text-lg font-semibold text-heading">원자재 시장</h2>
      <p className="text-sm text-muted mt-1 mb-5">
        에너지·금속·농산물 — 인플레이션과 글로벌 수요 신호
      </p>

      {/* Sub-groups */}
      <div className="space-y-6">
        {SUB_GROUPS.map((group) => {
          const items = group.symbols
            .map((sym) => commodities.find((c) => c.symbol === sym))
            .filter((c): c is Indicator => c !== undefined)

          if (items.length === 0) return null

          const color = GROUP_COLORS[group.label] ?? '#EF9F27'

          return (
            <div key={group.label}>
              {/* Group label */}
              <p className="text-[10px] text-faint uppercase tracking-wide mb-2">
                {group.label}
              </p>

              {/* Cards grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {items.map((ind) => (
                  <CommodityCard
                    key={ind.id}
                    indicator={ind}
                    series={dataMap[ind.id] ?? []}
                    groupColor={color}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
