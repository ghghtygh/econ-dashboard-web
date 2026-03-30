import { useMemo, useState } from 'react'
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
import { History, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useIndicatorSeries } from '@/hooks/useIndicators'
import type { Indicator, IndicatorData } from '@/types/indicator'

interface HistoricalComparisonProps {
  indicators: Indicator[]
  dataMap: Record<number, IndicatorData[]>
  selectedId?: number
  onSelect?: (id: number) => void
}

/** 사전 정의 위기 시점 */
const CRISIS_PRESETS = [
  { id: '2008', label: '2008 금융위기', startDate: '2007-10-01', description: '서브프라임 모기지 → 리먼 파산 → 글로벌 금융위기' },
  { id: '2020', label: '2020 코로나', startDate: '2020-01-01', description: 'COVID-19 팬데믹 → 경기침체 → 초저금리' },
  { id: '2022', label: '2022 긴축', startDate: '2022-01-01', description: '인플레이션 급등 → 급격한 금리 인상 사이클' },
] as const

const COLORS = ['#378ADD', '#EF9F27', '#E24B4A', '#1D9E75']

/**
 * 시계열을 기준 시점(t=0) 기준으로 정규화하여 비교 가능하게 만듭니다.
 * 첫 번째 값을 100으로 놓고, 이후 값을 (value / firstValue) * 100 으로 변환.
 */
function normalizeToIndex(data: IndicatorData[]): { day: number; value: number; date: string }[] {
  if (data.length === 0) return []
  const first = data[0].value
  if (first === 0) return []
  return data.map((d, i) => ({
    day: i,
    value: (d.value / first) * 100,
    date: d.date,
  }))
}

/**
 * 지정된 기간의 데이터를 필터링합니다.
 */
function filterByPeriod(data: IndicatorData[], startDate: string, months: number): IndicatorData[] {
  const start = new Date(startDate)
  const end = new Date(startDate)
  end.setMonth(end.getMonth() + months)
  return data.filter((d) => {
    const date = new Date(d.date)
    return date >= start && date <= end
  })
}

export function HistoricalComparison({ indicators, dataMap, selectedId, onSelect }: HistoricalComparisonProps) {
  const [selectedCrises, setSelectedCrises] = useState<string[]>(['2022'])
  const [comparisonMonths] = useState(12)
  const [selectorOpen, setSelectorOpen] = useState(false)

  // 비교에 사용할 지표 (선택된 것 또는 기본 첫번째)
  const activeIndicator = selectedId
    ? indicators.find((i) => i.id === selectedId)
    : indicators[0]

  // 1년 데이터 fetch (비교 기간 커버)
  const allIds = indicators.map((i) => i.id)
  const { data: yearData } = useIndicatorSeries(allIds, '1Y')
  const effectiveData = yearData ?? dataMap

  // 현재 기간 데이터 (최근 N개월)
  const currentData = useMemo(() => {
    if (!activeIndicator) return []
    const series = effectiveData[activeIndicator.id] ?? []
    // 최근 comparisonMonths 개월의 데이터
    const cutoff = new Date()
    cutoff.setMonth(cutoff.getMonth() - comparisonMonths)
    return series.filter((d) => new Date(d.date) >= cutoff)
  }, [activeIndicator, effectiveData, comparisonMonths])

  // 차트 데이터 구성: 현재 + 각 위기 시점을 정규화하여 합침
  const chartData = useMemo(() => {
    if (!activeIndicator) return []

    const series = effectiveData[activeIndicator.id] ?? []
    const currentNorm = normalizeToIndex(currentData)

    // 위기 시점별 정규화 데이터
    const crisisNorms = selectedCrises.map((crisisId) => {
      const preset = CRISIS_PRESETS.find((p) => p.id === crisisId)
      if (!preset) return { id: crisisId, data: [] as ReturnType<typeof normalizeToIndex> }
      const filtered = filterByPeriod(series, preset.startDate, comparisonMonths)
      return { id: crisisId, data: normalizeToIndex(filtered) }
    })

    // 최대 길이 기준으로 합치기
    const maxLen = Math.max(currentNorm.length, ...crisisNorms.map((c) => c.data.length))
    const combined = []

    for (let i = 0; i < maxLen; i++) {
      const point: Record<string, number | string | undefined> = { day: i }
      if (currentNorm[i]) {
        point['현재'] = Number(currentNorm[i].value.toFixed(2))
        point['currentDate'] = currentNorm[i].date
      }
      for (const crisis of crisisNorms) {
        const label = CRISIS_PRESETS.find((p) => p.id === crisis.id)?.label ?? crisis.id
        if (crisis.data[i]) {
          point[label] = Number(crisis.data[i].value.toFixed(2))
        }
      }
      combined.push(point)
    }

    return combined
  }, [activeIndicator, effectiveData, currentData, selectedCrises, comparisonMonths])

  const toggleCrisis = (id: string) => {
    setSelectedCrises((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    )
  }

  const lineKeys = useMemo(() => {
    const keys = ['현재']
    for (const id of selectedCrises) {
      const preset = CRISIS_PRESETS.find((p) => p.id === id)
      if (preset) keys.push(preset.label)
    }
    return keys
  }, [selectedCrises])

  return (
    <div className="rounded-lg border border-border-dim bg-surface p-5">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <History size={16} className="text-muted" />
          <div>
            <h3 className="text-base font-semibold text-heading">이력 비교 모드</h3>
            <p className="text-[11px] text-muted mt-0.5">과거 위기 시점과 현재를 정규화하여 비교</p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {/* Indicator selector */}
        <div className="relative">
          <button
            onClick={() => setSelectorOpen(!selectorOpen)}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-border-dim bg-elevated text-heading hover:border-border-mid transition-colors"
          >
            {activeIndicator?.name ?? '지표 선택'}
            {selectorOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
          {selectorOpen && (
            <div className="absolute left-0 top-full mt-1 z-40 w-52 max-h-48 overflow-y-auto rounded-lg border border-border-mid bg-surface shadow-lg animate-fadeIn">
              {indicators.map((ind) => (
                <button
                  key={ind.id}
                  onClick={() => {
                    onSelect?.(ind.id)
                    setSelectorOpen(false)
                  }}
                  className={cn(
                    'w-full text-left px-3 py-1.5 text-[11px] hover:bg-elevated transition-colors',
                    ind.id === activeIndicator?.id ? 'text-heading font-medium' : 'text-muted',
                  )}
                >
                  {ind.name}
                  <span className="ml-1 text-faint">{ind.category}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Crisis presets */}
        <div className="flex items-center gap-1">
          {CRISIS_PRESETS.map((preset) => {
            const active = selectedCrises.includes(preset.id)
            return (
              <button
                key={preset.id}
                onClick={() => toggleCrisis(preset.id)}
                title={preset.description}
                className={cn(
                  'text-[10px] px-2.5 py-1 rounded-full border transition-colors',
                  active
                    ? 'bg-elevated text-heading border-border-mid'
                    : 'border-border-dim text-faint hover:text-muted hover:border-border-mid',
                )}
              >
                {preset.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Chart */}
      {chartData.length > 0 ? (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--th-chart-grid)" />
              <XAxis
                dataKey="day"
                tick={{ fill: 'var(--th-chart-tick)', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                label={{ value: '거래일(t=0 기준)', position: 'insideBottomRight', offset: -5, fontSize: 10, fill: 'var(--th-chart-tick)' }}
              />
              <YAxis
                tick={{ fill: 'var(--th-chart-tick)', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                domain={['auto', 'auto']}
                tickFormatter={(v: number) => `${v.toFixed(0)}`}
                label={{ value: '인덱스 (시작=100)', angle: -90, position: 'insideLeft', fontSize: 10, fill: 'var(--th-chart-tick)' }}
              />
              <Tooltip
                contentStyle={{
                  background: 'var(--th-surface)',
                  border: '1px solid var(--th-border-mid)',
                  borderRadius: '8px',
                  fontSize: '11px',
                }}
                labelFormatter={(day) => `Day ${day}`}
              />
              <Legend
                wrapperStyle={{ fontSize: '11px' }}
              />
              {lineKeys.map((key, idx) => (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={COLORS[idx % COLORS.length]}
                  strokeWidth={key === '현재' ? 2.5 : 1.5}
                  strokeDasharray={key === '현재' ? undefined : '4 3'}
                  dot={false}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-64 flex items-center justify-center">
          <p className="text-faint text-xs">지표를 선택하면 비교 차트가 표시됩니다</p>
        </div>
      )}

      {/* Legend description */}
      <div className="mt-3 pt-3 border-t border-border-dim">
        <p className="text-[10px] text-faint leading-relaxed">
          * 각 기간의 시작 시점을 100으로 정규화하여 비교합니다. 실선은 현재, 점선은 과거 위기 시점입니다.
        </p>
        {selectedCrises.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {selectedCrises.map((id) => {
              const preset = CRISIS_PRESETS.find((p) => p.id === id)
              if (!preset) return null
              return (
                <span key={id} className="text-[10px] text-muted">
                  <span className="font-medium">{preset.label}</span>: {preset.description}
                </span>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
