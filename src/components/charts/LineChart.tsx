import {
  ResponsiveContainer,
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'
import type { IndicatorData } from '@/types/indicator'
import { format } from 'date-fns'

interface LineChartProps {
  data: IndicatorData[]
  title?: string
  color?: string
  unit?: string
}

export function LineChart({ data, title, color = '#3b82f6', unit }: LineChartProps) {
  const formatted = data.map((d) => ({
    date: format(new Date(d.timestamp), 'MM/dd'),
    value: d.value,
  }))

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
      {title && <h3 className="text-sm font-medium text-slate-300 mb-4">{title}</h3>}
      <ResponsiveContainer width="100%" height={200}>
        <RechartsLineChart data={formatted}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false}
            tickFormatter={(v) => `${v}${unit ?? ''}`} />
          <Tooltip
            contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
            labelStyle={{ color: '#94a3b8' }}
            itemStyle={{ color: color }}
          />
          <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={false} />
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  )
}
