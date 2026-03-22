import { useMemo } from 'react'
import { cn } from '@/lib/utils'
import type { Indicator, IndicatorData } from '@/types/indicator'

interface MarketCardProps {
  indicator: Indicator
  series: IndicatorData[]
  isSelected?: boolean
  onClick?: () => void
}

const CATEGORY_COLORS: Record<string, string> = {
  STOCK: '#378ADD',
  FOREX: '#E24B4A',
  CRYPTO: '#EF9F27',
  MACRO: '#7F77DD',
  BOND: '#1D9E75',
  COMMODITY: '#EF9F27',
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
  const color = CATEGORY_COLORS[indicator.category] ?? '#378ADD'

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

  return (
    <div className="relative" onClick={onClick}>
      <div
        className={cn(
          'rounded-xl border bg-surface p-4 sm:p-5 cursor-pointer transition-colors',
          isSelected ? 'border-blue-400/60' : 'border-border-dim hover:border-border-mid',
        )}
      >
        {/* Badge */}
        <span
          className={cn(
            'absolute top-2.5 right-2.5 text-[10px] px-2 py-0.5 rounded-full font-medium',
            isUp
              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
          )}
        >
          {isUp ? '+' : ''}{changePercent.toFixed(1)}%
        </span>

        {/* Category & Name */}
        <p className="text-[10px] text-faint uppercase tracking-wide">
          {indicator.category} · {indicator.symbol}
        </p>
        <h3 className="text-[13px] font-medium text-heading mt-0.5 mb-2">
          {indicator.name}
        </h3>

        {/* Value */}
        {latest ? (
          <>
            <p className="text-xl font-medium text-heading">
              {latest.value.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-muted mt-0.5">
              {changeAbs >= 0 ? '+' : ''}{changeAbs.toFixed(1)} 오늘
            </p>
          </>
        ) : (
          <p className="text-faint text-sm">데이터 없음</p>
        )}

        {/* Sparkline */}
        {sparkPoints && (
          <svg className="mt-2.5 w-full h-8" viewBox="0 0 100 32" preserveAspectRatio="none">
            <polyline
              points={sparkPoints}
              fill="none"
              stroke={color}
              strokeWidth="1.5"
            />
          </svg>
        )}
      </div>
    </div>
  )
}
