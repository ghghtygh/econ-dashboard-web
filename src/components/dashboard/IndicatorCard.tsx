import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'
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
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 hover:border-slate-700 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wide">{indicator.category}</p>
          <h3 className="text-sm font-medium text-slate-200 mt-0.5">{indicator.name}</h3>
        </div>
        <span className="text-xs text-slate-600 font-mono">{indicator.symbol}</span>
      </div>

      {latest ? (
        <div>
          <p className="text-2xl font-bold text-white">
            {latest.value.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            <span className="text-sm font-normal text-slate-400 ml-1">{indicator.unit}</span>
          </p>
          <div className={cn('flex items-center gap-1 mt-1 text-sm', {
            'text-green-400': isPositive,
            'text-red-400': isNegative,
            'text-slate-400': !isPositive && !isNegative,
          })}>
            {isPositive ? <TrendingUp size={14} /> : isNegative ? <TrendingDown size={14} /> : <Minus size={14} />}
            <span>{changePercent >= 0 ? '+' : ''}{changePercent.toFixed(2)}%</span>
          </div>
        </div>
      ) : (
        <p className="text-slate-600 text-sm">데이터 없음</p>
      )}
    </div>
  )
}
