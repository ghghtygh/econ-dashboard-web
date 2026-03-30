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
  STOCK: '#2563eb',
  FOREX: '#dc2626',
  CRYPTO: '#f59e0b',
  MACRO: '#7c3aed',
  BOND: '#059669',
  COMMODITY: '#ea580c',
}

export function MarketCard({ indicator, series, isSelected, onClick }: MarketCardProps) {
  const latest = series.length > 0 ? series[series.length - 1] : undefined
  const prev = series.length > 1 ? series[series.length - 2] : undefined

  const changePercent = useMemo(() => {
    if (!latest || !prev || prev.value === 0) return latest?.change ?? 0
    return ((latest.value - prev.value) / prev.value) * 100
  }, [latest, prev])

  const changeAbs = latest && prev ? latest.value - prev.value : 0
  const isUp = changePercent >= 0
  const color = CATEGORY_COLORS[indicator.category] ?? '#2563eb'

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
    <div className="relative" onClick={onClick}>
      <div
        className={cn(
          'rounded-2xl border bg-surface p-5 cursor-pointer transition-all',
          isSelected
            ? 'border-accent ring-2 ring-accent/20'
            : 'border-border-dim hover:border-border-mid',
        )}
        style={{ boxShadow: 'var(--th-card-shadow)' }}
      >
        {/* Badge */}
        <span
          className={cn(
            'absolute top-3 right-3 text-[11px] px-2.5 py-0.5 rounded-full font-semibold',
            isUp
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
              : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400',
          )}
        >
          {isUp ? '+' : ''}{changePercent.toFixed(1)}%
        </span>

        {/* Category & Name */}
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full" style={{ background: color }} />
          <p className="text-[11px] text-muted font-medium uppercase tracking-wide">
            {indicator.category} · {indicator.symbol}
          </p>
          <InfoTooltip>
            <IndicatorTooltipContent {...desc} />
          </InfoTooltip>
        </div>
        <h3 className="text-sm font-semibold text-heading mt-1.5 mb-3">
          {indicator.name}
        </h3>

        {/* Value */}
        {latest ? (
          <>
            <p className="text-2xl font-bold text-heading tracking-tight">
              {latest.value.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </p>
            <p className={cn('text-xs mt-1 font-medium', isUp ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400')}>
              {changeAbs >= 0 ? '+' : ''}{changeAbs.toFixed(1)} 오늘
            </p>
          </>
        ) : (
          <p className="text-faint text-sm">데이터 없음</p>
        )}

        {/* Sparkline */}
        {sparkPoints && (
          <svg className="mt-3 w-full h-8" viewBox="0 0 100 32" preserveAspectRatio="none">
            <polyline
              points={sparkPoints}
              fill="none"
              stroke={color}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </div>
    </div>
  )
}
