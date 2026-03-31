import { memo } from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { InfoTooltip, IndicatorTooltipContent } from '@/components/ui/InfoTooltip'
import { getIndicatorDescription } from '@/data/indicatorDescriptions'
import type { Indicator, IndicatorData } from '@/types/indicator'

interface IndicatorCardProps {
  indicator: Indicator
  latest?: IndicatorData
  prevClose?: number
}

export const IndicatorCard = memo(function IndicatorCard({ indicator, latest, prevClose }: IndicatorCardProps) {
  const changePercent = latest && prevClose && prevClose !== 0
    ? ((latest.value - prevClose) / prevClose) * 100
    : (latest?.change ?? 0)

  const isPositive = changePercent > 0
  const isNegative = changePercent < 0
  const desc = getIndicatorDescription(indicator.symbol, indicator.category)

  return (
    <div
      className="rounded-lg border border-border-dim bg-surface p-4 hover:border-border-mid transition-all"
      style={{ boxShadow: 'var(--th-card-shadow)' }}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-1">
            <p className="text-[11px] text-muted font-medium uppercase tracking-wide">{indicator.category}</p>
            <InfoTooltip>
              <IndicatorTooltipContent {...desc} />
            </InfoTooltip>
          </div>
          <h3 className="text-sm font-semibold text-heading mt-0.5">{indicator.name}</h3>
        </div>
        <span className="text-[10px] text-faint font-mono bg-elevated px-1.5 py-0.5 rounded">{indicator.symbol}</span>
      </div>

      {latest ? (
        <div>
          <p className="text-2xl font-bold text-heading tracking-tight">
            {latest.value.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            <span className="text-xs font-normal text-muted ml-1">{indicator.unit}</span>
          </p>
          <div
            className={cn('flex items-center gap-1 mt-1.5 text-sm font-medium', {
              'text-emerald-600 dark:text-emerald-400': isPositive,
              'text-red-600 dark:text-red-400': isNegative,
              'text-muted': !isPositive && !isNegative,
            })}
            role="status"
            aria-label={`변동률 ${isPositive ? '상승' : isNegative ? '하락' : '보합'} ${changePercent.toFixed(2)}%`}
          >
            {isPositive ? <TrendingUp size={14} aria-hidden="true" /> : isNegative ? <TrendingDown size={14} aria-hidden="true" /> : <Minus size={14} aria-hidden="true" />}
            <span>{changePercent >= 0 ? '+' : ''}{changePercent.toFixed(2)}%</span>
          </div>
        </div>
      ) : (
        <p className="text-faint text-sm">데이터 없음</p>
      )}
    </div>
  )
})
