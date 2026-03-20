import {
  ResponsiveContainer,
  LineChart as RechartsLineChart,
  BarChart as RechartsBarChart,
  AreaChart as RechartsAreaChart,
  Line,
  Bar,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import type { ChartType, IndicatorData } from '@/types/indicator'

interface ChartRendererProps {
  type: ChartType
  data: IndicatorData[]
  color?: string
  unit?: string
}

function formatPrice(value: number): string {
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`
  if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(1)}K`
  if (Math.abs(value) < 1) return value.toFixed(4)
  return value.toLocaleString('ko-KR', { maximumFractionDigits: 2 })
}

function CustomTooltip({ active, payload, label, unit, color }: {
  active?: boolean
  payload?: Array<{ value: number }>
  label?: string
  unit?: string
  color?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 shadow-lg">
      <p className="text-xs text-slate-400 mb-1">{label}</p>
      <p className="text-sm font-semibold" style={{ color }}>
        {formatPrice(payload[0].value)}{unit ? ` ${unit}` : ''}
      </p>
    </div>
  )
}

function formatData(data: IndicatorData[]) {
  return data.map((d) => ({
    date: format(new Date(d.date), 'yyyy.MM.dd (EEE)', { locale: ko }),
    shortDate: format(new Date(d.date), 'MM/dd'),
    value: d.value,
  }))
}

function NumberCard({ data, color, unit }: { data: IndicatorData[]; color: string; unit?: string }) {
  if (data.length === 0) return <p className="text-slate-600 text-sm">데이터 없음</p>
  const latest = data[data.length - 1]
  const prev = data.length > 1 ? data[data.length - 2] : null
  const changePercent = prev && prev.value !== 0
    ? ((latest.value - prev.value) / prev.value) * 100
    : (latest.change ?? 0)
  const isPositive = changePercent > 0
  const isNegative = changePercent < 0

  return (
    <div className="flex flex-col items-center justify-center h-full gap-2">
      <p className="text-4xl font-bold text-white">
        {latest.value.toLocaleString(undefined, { maximumFractionDigits: 2 })}
      </p>
      {unit && <p className="text-sm text-slate-400">{unit}</p>}
      <div className={`flex items-center gap-1 text-sm ${isPositive ? 'text-green-400' : isNegative ? 'text-red-400' : 'text-slate-400'}`}>
        {isPositive ? <TrendingUp size={16} /> : isNegative ? <TrendingDown size={16} /> : <Minus size={16} />}
        <span style={{ color }}>{changePercent >= 0 ? '+' : ''}{changePercent.toFixed(2)}%</span>
      </div>
    </div>
  )
}

export function ChartRenderer({ type, data, color = '#3b82f6', unit }: ChartRendererProps) {
  if (data.length === 0) {
    return <p className="text-slate-600 text-sm text-center py-8">데이터 없음</p>
  }

  if (type === 'number') {
    return <NumberCard data={data} color={color} unit={unit} />
  }

  const formatted = formatData(data)
  const commonAxis = (
    <>
      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
      <XAxis dataKey="shortDate" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
      <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false}
        tickFormatter={(v) => formatPrice(v)} width={60} />
      <Tooltip content={<CustomTooltip unit={unit} color={color} />} />
    </>
  )

  return (
    <ResponsiveContainer width="100%" height="100%">
      {type === 'bar' ? (
        <RechartsBarChart data={formatted}>
          {commonAxis}
          <Bar dataKey="value" fill={color} radius={[2, 2, 0, 0]} />
        </RechartsBarChart>
      ) : type === 'area' ? (
        <RechartsAreaChart data={formatted}>
          {commonAxis}
          <defs>
            <linearGradient id={`gradient-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.3} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2}
            fill={`url(#gradient-${color.replace('#', '')})`} />
        </RechartsAreaChart>
      ) : (
        <RechartsLineChart data={formatted}>
          {commonAxis}
          <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={false} />
        </RechartsLineChart>
      )}
    </ResponsiveContainer>
  )
}
