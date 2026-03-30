import { useMemo } from 'react'
import { cn } from '@/lib/utils'
import { InfoTooltip, IndicatorTooltipContent } from '@/components/ui/InfoTooltip'
import { getIndicatorDescription } from '@/data/indicatorDescriptions'
import type { Indicator, IndicatorData } from '@/types/indicator'

interface MarketCardProps {
  indicator: Indicator
  series: IndicatorData[]
  isSelected?: boolean
  onClick?: () => void
}

const CATEGORY_COLORS: Record<string, string> = {
  STOCK: '#6366f1',
  FOREX: '#ef4444',
  CRYPTO: '#f59e0b',
  MACRO: '#8b5cf6',
  BOND: '#10b981',
  COMMODITY: '#f97316',
}

export function MarketCard({ indicator, series, isSelected, onClick }: MarketCardProps) {
  const latest = series.length > 0 ? series[series.length - 1] : undefined
  const prev = series.length > 1 ? series[series.length - 2] : undefined

  const changePercent = useMemo(() => {
    if (!latest || !prev || prev.value === 0) return latest?.change ?? 0
    return ((latest.value - prev.value) / prev.value) * 100
  }, [latest, prev])

  const isUp = changePercent >= 0
  const color = CATEGORY_COLORS[indicator.category] ?? '#6366f1'

  const sparkPoints = useMemo(() => {
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

  const desc = getIndicatorDescription(indicator.symbol, indicator.category)

  return (
    <div onClick={onClick} className="cursor-pointer">
      <div
        className={cn(
          'rounded-lg border p-5 transition-all',
          isSelected
            ? 'border-indigo-400 ring-2 ring-indigo-100 dark:ring-indigo-500/20'
            : 'border-border-dim hover:border-border-mid',
        )}
        style={{ background: 'var(--th-surface)', boxShadow: 'var(--th-card-shadow)' }}
      >
        {/* Top: Label + Badge */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
            <p className="text-sm text-muted font-medium">
              {indicator.symbol}
            </p>
            <InfoTooltip>
              <IndicatorTooltipContent {...desc} />
            </InfoTooltip>
          </div>
          <span
            className={cn(
              'text-sm font-medium px-2.5 py-1 rounded-full',
              isUp
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                : 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400',
            )}
          >
            {isUp ? '+' : ''}{changePercent.toFixed(1)}%
          </span>
        </div>

        {/* Name */}
        <p className="text-base text-muted mb-2 truncate">{indicator.name}</p>

        {/* Metric */}
        {latest ? (
          <p className="text-3xl font-semibold text-heading tracking-tight">
            {latest.value.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </p>
        ) : (
          <p className="text-faint text-sm">데이터 없음</p>
        )}

        {/* Sparkline */}
        {sparkPoints && (
          <svg className="mt-3 w-full h-7" viewBox="0 0 100 32" preserveAspectRatio="none">
            <polyline
              points={sparkPoints}
              fill="none"
              stroke={color}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.7"
            />
          </svg>
        )}
      </div>
    </div>
  )
}
