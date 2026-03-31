import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts'
import type { Indicator } from '@/types/indicator'

const COLORS = ['#378ADD', '#E24B4A', '#1D9E75', '#EF9F27', '#7F77DD']

interface OverlayLineChartProps {
  chartData: Record<string, string | number>[]
  selectedIndicators: Indicator[]
  selectedIds: number[]
  normalized: boolean
}

export function OverlayLineChart({ chartData, selectedIndicators, selectedIds, normalized }: OverlayLineChartProps) {
  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} accessibilityLayer>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--th-chart-grid)" />
          <XAxis
            dataKey="date"
            tick={{ fill: 'var(--th-chart-tick)', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: string) => {
              if (!v) return ''
              const parts = v.split('-')
              return parts.length >= 3 ? `${parts[1]}/${parts[2]}` : v
            }}
          />
          {normalized ? (
            <YAxis
              tick={{ fill: 'var(--th-chart-tick)', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              domain={['auto', 'auto']}
              tickFormatter={(v: number) => `${v.toFixed(0)}`}
              label={{
                value: '인덱스 (시작=100)',
                angle: -90,
                position: 'insideLeft',
                fontSize: 10,
                fill: 'var(--th-chart-tick)',
              }}
            />
          ) : (
            <>
              <YAxis
                yAxisId="left"
                tick={{ fill: COLORS[0], fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                domain={['auto', 'auto']}
                tickFormatter={(v: number) =>
                  v >= 10000 ? `${(v / 1000).toFixed(0)}k` : v.toFixed(v < 10 ? 2 : 0)
                }
              />
              {selectedIds.length >= 2 && (
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fill: COLORS[1], fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  domain={['auto', 'auto']}
                  tickFormatter={(v: number) =>
                    v >= 10000 ? `${(v / 1000).toFixed(0)}k` : v.toFixed(v < 10 ? 2 : 0)
                  }
                />
              )}
            </>
          )}
          <Tooltip
            contentStyle={{
              background: 'var(--th-surface)',
              border: '1px solid var(--th-border-mid)',
              borderRadius: '8px',
              fontSize: '11px',
            }}
            labelFormatter={(date) => `${date}`}
          />
          <Legend wrapperStyle={{ fontSize: '11px', overflow: 'visible', whiteSpace: 'normal' }} verticalAlign="bottom" />
          {selectedIndicators.map((ind, idx) => (
            <Line
              key={ind.id}
              type="monotone"
              dataKey={ind.name}
              stroke={COLORS[idx % COLORS.length]}
              strokeWidth={2}
              dot={false}
              connectNulls
              {...(normalized
                ? {}
                : { yAxisId: idx === 0 ? 'left' : idx === 1 ? 'right' : 'left' })}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
