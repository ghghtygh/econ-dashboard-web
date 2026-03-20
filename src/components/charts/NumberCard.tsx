import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import type { IndicatorData } from '@/types/indicator'

interface NumberCardProps {
  data: IndicatorData[]
  color?: string
  unit?: string
}

export function NumberCard({ data, color = '#3b82f6', unit }: NumberCardProps) {
  if (data.length === 0) return <p className="text-faint text-sm">데이터 없음</p>

  const latest = data[data.length - 1]
  const prev = data.length > 1 ? data[data.length - 2] : null
  const changePercent = prev && prev.value !== 0
    ? ((latest.value - prev.value) / prev.value) * 100
    : (latest.change ?? 0)
  const isPositive = changePercent > 0
  const isNegative = changePercent < 0

  return (
    <div className="flex flex-col items-center justify-center h-full gap-2">
      <p className="text-4xl font-bold text-heading">
        {latest.value.toLocaleString(undefined, { maximumFractionDigits: 2 })}
      </p>
      {unit && <p className="text-sm text-muted">{unit}</p>}
      <div className={`flex items-center gap-1 text-sm ${isPositive ? 'text-green-400' : isNegative ? 'text-red-400' : 'text-muted'}`}>
        {isPositive ? <TrendingUp size={16} /> : isNegative ? <TrendingDown size={16} /> : <Minus size={16} />}
        <span style={{ color }}>{changePercent >= 0 ? '+' : ''}{changePercent.toFixed(2)}%</span>
      </div>
    </div>
  )
}
