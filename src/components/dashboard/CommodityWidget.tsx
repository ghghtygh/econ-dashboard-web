import { memo, useMemo } from 'react'
import { cn } from '@/lib/utils'
import type { Indicator, IndicatorData } from '@/types/indicator'
import { COMMODITY_GROUP_COLORS } from '@/constants/colors'

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

const GROUP_COLORS = COMMODITY_GROUP_COLORS

const Sparkline = memo(function Sparkline({ series, color, label }: { series: IndicatorData[]; color: string; label: string }) {
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
    <svg className="w-full h-7" viewBox="0 0 100 32" preserveAspectRatio="none" role="img" aria-label={`${label} 추이 차트`}>
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" />
    </svg>
  )
})

const CommodityCard = memo(function CommodityCard({
  indicator,
  series,
  groupColor,
}: {
  indicator: Indicator
  series: IndicatorData[]
  groupColor: string
}) {
  const latest = series.length > 0 ? series[series.length - 1] : undefined
  const prev = series.length > 1 ? series[series.length - 2] : undefined

  const changePercent = useMemo(() => {
    if (!latest || !prev || prev.value === 0) return latest?.change ?? 0
    return ((latest.value - prev.value) / prev.value) * 100
  }, [latest, prev])

  const isUp = changePercent >= 0

  return (
    <div
      className={cn(
        'rounded-lg border bg-surface p-4 cursor-pointer transition-colors',
        'border-border-dim hover:border-border-mid',
      )}
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
        <Sparkline series={series} color={groupColor} label={indicator.name} />
      </div>

    </div>
  )
})

export function CommodityWidget({ indicators, dataMap }: CommodityWidgetProps) {
  const commodities = useMemo(
    () => indicators.filter((ind) => ind.category === 'COMMODITY'),
    [indicators],
  )

  if (commodities.length === 0) return null

  return (
    <section>
      {/* Section header */}
      <h2 className="text-lg font-semibold text-heading mb-5">원자재 시장</h2>

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
