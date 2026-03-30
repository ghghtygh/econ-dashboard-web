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

export function IndicatorCard({ indicator, latest, prevClose }: IndicatorCardProps) {
  const changePercent = latest && prevClose && prevClose !== 0
    ? ((latest.value - prevClose) / prevClose) * 100
    : (latest?.change ?? 0)

  const isPositive = changePercent > 0
  const isNegative = changePercent < 0

  return (
    <div className="rounded-xl border border-border-dim bg-surface p-4 hover:border-border-mid transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-1">
            <p className="text-xs text-muted uppercase tracking-wide">{indicator.category}</p>
            <InfoTooltip>
              <IndicatorTooltipContent {...getIndicatorDescription(indicator.symbol, indicator.category)} />
            </InfoTooltip>
          </div>
          <h3 className="text-sm font-medium text-body mt-0.5">{indicator.name}</h3>
        </div>
        <span className="text-xs text-faint font-mono">{indicator.symbol}</span>
      </div>

      {latest ? (
        <div>
          <p className="text-2xl font-bold text-heading">
            {latest.value.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            <span className="text-sm font-normal text-muted ml-1">{indicator.unit}</span>
          </p>
          <div className={cn('flex items-center gap-1 mt-1 text-sm', {
            'text-green-400': isPositive,
            'text-red-400': isNegative,
            'text-muted': !isPositive && !isNegative,
          })}>
            {isPositive ? <TrendingUp size={14} /> : isNegative ? <TrendingDown size={14} /> : <Minus size={14} />}
            <span>{changePercent >= 0 ? '+' : ''}{changePercent.toFixed(2)}%</span>
          </div>
        </div>
      ) : (
        <p className="text-faint text-sm">데이터 없음</p>
      )}
    </div>
  )
}
