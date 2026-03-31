import { ResponsiveContainer, ComposedChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from 'recharts'
import { formatPrice } from '@/components/charts/chartFormatters'
import { formatChartFullDate, formatChartShortDate } from '@/lib/dateUtils'
import type { IndicatorData } from '@/types/indicator'

interface CandlestickChartProps {
  data: IndicatorData[]
}

const CANDLE_UP = '#22c55e'
const CANDLE_DOWN = '#ef4444'

interface CandleData {
  shortDate: string
  date: string
  open: number
  close: number
  high: number
  low: number
  body: [number, number]
  wick: [number, number]
  isUp: boolean
  value: number
}

function CandlestickTooltip({ active, payload }: {
  active?: boolean
  payload?: Array<{ payload: CandleData }>
  label?: string
}) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="rounded-lg border border-border-mid bg-elevated px-3 py-2 shadow-lg text-xs">
      <p className="text-muted mb-1">{d.date}</p>
      <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
        <span className="text-muted">시가</span><span className="text-body">{formatPrice(d.open)}</span>
        <span className="text-muted">고가</span><span className="text-green-400">{formatPrice(d.high)}</span>
        <span className="text-muted">저가</span><span className="text-red-400">{formatPrice(d.low)}</span>
        <span className="text-muted">종가</span><span className="text-body">{formatPrice(d.close)}</span>
      </div>
    </div>
  )
}

export function CandlestickChart({ data }: CandlestickChartProps) {
  const hasOHLC = data.some((d) => d.open != null && d.close != null)

  if (!hasOHLC) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-faint text-xs">OHLC 데이터가 없습니다</p>
      </div>
    )
  }

  const formatted: CandleData[] = data
    .filter((d) => d.open != null && d.close != null && d.high != null && d.low != null)
    .map((d) => {
      const open = d.open!
      const close = d.close!
      const high = d.high!
      const low = d.low!
      const isUp = close >= open
      return {
        shortDate: formatChartShortDate(new Date(d.date)),
        date: formatChartFullDate(new Date(d.date)),
        open,
        close,
        high,
        low,
        body: isUp ? [open, close] : [close, open],
        wick: [low, high],
        isUp,
        value: close,
      }
    })

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={formatted}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--th-chart-grid)" />
        <XAxis dataKey="shortDate" tick={{ fill: 'var(--th-chart-tick)', fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis
          tick={{ fill: 'var(--th-chart-tick)', fontSize: 11 }} axisLine={false} tickLine={false}
          tickFormatter={(v) => formatPrice(v)} width={60}
          domain={['auto', 'auto']}
        />
        <Tooltip content={<CandlestickTooltip />} />
        {/* Wick (high-low) */}
        <Bar dataKey="wick" barSize={2} isAnimationActive={false}>
          {formatted.map((entry, idx) => (
            <Cell key={idx} fill={entry.isUp ? CANDLE_UP : CANDLE_DOWN} />
          ))}
        </Bar>
        {/* Body (open-close) */}
        <Bar dataKey="body" barSize={8} isAnimationActive={false}>
          {formatted.map((entry, idx) => (
            <Cell key={idx} fill={entry.isUp ? CANDLE_UP : CANDLE_DOWN} />
          ))}
        </Bar>
      </ComposedChart>
    </ResponsiveContainer>
  )
}
