import { useMemo, useState, useCallback } from 'react'
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
import { Layers, X, ChevronDown, ChevronUp, ToggleLeft, ToggleRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Indicator, IndicatorData } from '@/types/indicator'

interface ChartOverlayProps {
  indicators: Indicator[]
  dataMap: Record<number, IndicatorData[]>
}

const COLORS = ['#378ADD', '#E24B4A', '#1D9E75', '#EF9F27', '#7F77DD']

const MAX_INDICATORS = 5
const MIN_INDICATORS = 2

interface PresetComparison {
  id: string
  label: string
  /** indicator names (matched against Indicator.name with includes) */
  keywords: [string, string]
  explanation: string
}

const PRESET_COMPARISONS: PresetComparison[] = [
  {
    id: 'cpi-rate',
    label: 'CPI vs 기준금리',
    keywords: ['CPI', '기준금리'],
    explanation: '',
  },
  {
    id: 'vix-sp500',
    label: 'VIX vs S&P 500',
    keywords: ['VIX', 'S&P 500'],
    explanation: '',
  },
  {
    id: 'usdkrw-kospi',
    label: '달러/원 vs KOSPI',
    keywords: ['USD/KRW', 'KOSPI'],
    explanation: '',
  },
  {
    id: 'gold-bond',
    label: '금 vs 10년 국채',
    keywords: ['Gold', '10Y'],
    explanation: '',
  },
]

/**
 * 피어슨 상관계수를 계산합니다.
 */
function pearsonCorrelation(xs: number[], ys: number[]): number | null {
  const n = Math.min(xs.length, ys.length)
  if (n < 3) return null

  const x = xs.slice(0, n)
  const y = ys.slice(0, n)

  const meanX = x.reduce((a, b) => a + b, 0) / n
  const meanY = y.reduce((a, b) => a + b, 0) / n

  let num = 0
  let denX = 0
  let denY = 0
  for (let i = 0; i < n; i++) {
    const dx = x[i] - meanX
    const dy = y[i] - meanY
    num += dx * dy
    denX += dx * dx
    denY += dy * dy
  }

  const den = Math.sqrt(denX * denY)
  if (den === 0) return null
  return num / den
}

/**
 * 시계열 값을 첫 값을 100 기준으로 정규화합니다.
 */
function normalizeToBase100(values: number[]): number[] {
  if (values.length === 0) return []
  const base = values[0]
  if (base === 0) return values.map(() => 0)
  return values.map((v) => (v / base) * 100)
}

/**
 * 날짜 기준으로 두 시리즈의 공통 날짜를 정렬하여 반환합니다.
 */
function alignByDate(
  seriesMap: Record<number, IndicatorData[]>,
  ids: number[],
): { dates: string[]; valuesByIndicator: Record<number, number[]> } {
  // 각 지표의 date→value 맵
  const dateMaps = ids.map((id) => {
    const map = new Map<string, number>()
    for (const d of seriesMap[id] ?? []) {
      map.set(d.date, d.value)
    }
    return { id, map }
  })

  // 모든 날짜 수집 후 정렬
  const allDates = new Set<string>()
  for (const { map } of dateMaps) {
    for (const date of map.keys()) allDates.add(date)
  }
  const sortedDates = Array.from(allDates).sort()

  // 모든 지표에 값이 있는 날짜만
  const commonDates = sortedDates.filter((date) =>
    dateMaps.every(({ map }) => map.has(date)),
  )

  const valuesByIndicator: Record<number, number[]> = {}
  for (const { id, map } of dateMaps) {
    valuesByIndicator[id] = commonDates.map((date) => map.get(date)!)
  }

  return { dates: commonDates, valuesByIndicator }
}

export function ChartOverlay({ indicators, dataMap }: ChartOverlayProps) {
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [normalized, setNormalized] = useState(false)
  const [selectorOpen, setSelectorOpen] = useState(false)
  const [activePreset, setActivePreset] = useState<string | null>(null)

  const toggleIndicator = useCallback(
    (id: number) => {
      setSelectedIds((prev) => {
        if (prev.includes(id)) return prev.filter((x) => x !== id)
        if (prev.length >= MAX_INDICATORS) return prev
        return [...prev, id]
      })
      setActivePreset(null)
    },
    [],
  )

  const removeIndicator = useCallback((id: number) => {
    setSelectedIds((prev) => prev.filter((x) => x !== id))
    setActivePreset(null)
  }, [])

  const applyPreset = useCallback(
    (preset: PresetComparison) => {
      const matched: number[] = []
      for (const keyword of preset.keywords) {
        const found = indicators.find(
          (ind) =>
            ind.name.includes(keyword) ||
            ind.symbol.includes(keyword) ||
            ind.description?.includes(keyword),
        )
        if (found && !matched.includes(found.id)) matched.push(found.id)
      }
      if (matched.length >= 2) {
        setSelectedIds(matched)
        setActivePreset(preset.id)
        setNormalized(true)
      }
    },
    [indicators],
  )

  const selectedIndicators = useMemo(
    () => indicators.filter((ind) => selectedIds.includes(ind.id)),
    [indicators, selectedIds],
  )

  // 정렬된 데이터
  const aligned = useMemo(
    () => (selectedIds.length >= MIN_INDICATORS ? alignByDate(dataMap, selectedIds) : null),
    [dataMap, selectedIds],
  )

  // 차트 데이터
  const chartData = useMemo(() => {
    if (!aligned || aligned.dates.length === 0) return []

    const { dates, valuesByIndicator } = aligned

    // 정규화 여부에 따른 값
    const processedValues: Record<number, number[]> = {}
    for (const id of selectedIds) {
      processedValues[id] = normalized
        ? normalizeToBase100(valuesByIndicator[id])
        : valuesByIndicator[id]
    }

    return dates.map((date, i) => {
      const point: Record<string, string | number> = {
        date: date.length > 10 ? date.slice(0, 10) : date,
      }
      for (const id of selectedIds) {
        const ind = indicators.find((x) => x.id === id)
        if (ind) {
          point[ind.name] = Number(processedValues[id][i].toFixed(2))
        }
      }
      return point
    })
  }, [aligned, selectedIds, normalized, indicators])

  // 상관계수 행렬
  const correlations = useMemo(() => {
    if (!aligned || selectedIds.length < 2) return []
    const { valuesByIndicator } = aligned
    const results: { a: string; b: string; r: number }[] = []
    for (let i = 0; i < selectedIds.length; i++) {
      for (let j = i + 1; j < selectedIds.length; j++) {
        const idA = selectedIds[i]
        const idB = selectedIds[j]
        const r = pearsonCorrelation(valuesByIndicator[idA], valuesByIndicator[idB])
        if (r !== null) {
          const nameA = indicators.find((x) => x.id === idA)?.name ?? String(idA)
          const nameB = indicators.find((x) => x.id === idB)?.name ?? String(idB)
          results.push({ a: nameA, b: nameB, r })
        }
      }
    }
    return results
  }, [aligned, selectedIds, indicators])

  return (
    <div className="rounded-lg border border-border-dim bg-surface p-5">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <Layers size={16} className="text-muted" />
          <div>
            <h3 className="text-base font-semibold text-heading">지표 비교</h3>
          </div>
        </div>

        {/* Normalization toggle */}
        <button
          onClick={() => setNormalized((v) => !v)}
          className="flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-lg border border-border-dim bg-elevated text-muted hover:text-heading hover:border-border-mid transition-colors"
        >
          {normalized ? <ToggleRight size={14} className="text-[#378ADD]" /> : <ToggleLeft size={14} />}
          {normalized ? '정규화 (100 기준)' : '원래 값'}
        </button>
      </div>

      {/* Controls row */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {/* Indicator selector dropdown */}
        <div className="relative">
          <button
            onClick={() => setSelectorOpen(!selectorOpen)}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-border-dim bg-elevated text-heading hover:border-border-mid transition-colors"
          >
            지표 선택 ({selectedIds.length}/{MAX_INDICATORS})
            {selectorOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
          {selectorOpen && (
            <div className="absolute left-0 top-full mt-1 z-40 w-60 max-h-56 overflow-y-auto rounded-lg border border-border-mid bg-surface shadow-lg animate-fadeIn">
              {indicators.map((ind) => {
                const selected = selectedIds.includes(ind.id)
                const disabled = !selected && selectedIds.length >= MAX_INDICATORS
                return (
                  <button
                    key={ind.id}
                    onClick={() => !disabled && toggleIndicator(ind.id)}
                    disabled={disabled}
                    className={cn(
                      'w-full text-left px-3 py-1.5 text-[11px] transition-colors flex items-center gap-2',
                      selected
                        ? 'text-heading font-medium bg-elevated'
                        : disabled
                          ? 'text-faint cursor-not-allowed'
                          : 'text-muted hover:bg-elevated',
                    )}
                  >
                    <span
                      className={cn(
                        'w-3 h-3 rounded-sm border flex-shrink-0 flex items-center justify-center text-[8px]',
                        selected ? 'border-[#378ADD] bg-[#378ADD] text-white' : 'border-border-mid',
                      )}
                    >
                      {selected && '✓'}
                    </span>
                    <span className="truncate">{ind.name}</span>
                    <span className="ml-auto text-faint flex-shrink-0">{ind.category}</span>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Selected indicator tags */}
        {selectedIndicators.map((ind, idx) => (
          <span
            key={ind.id}
            className="inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-full border border-border-dim"
            style={{ color: COLORS[idx % COLORS.length], borderColor: COLORS[idx % COLORS.length] + '40' }}
          >
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: COLORS[idx % COLORS.length] }}
            />
            {ind.name}
            <button
              onClick={() => removeIndicator(ind.id)}
              className="ml-0.5 hover:opacity-70 transition-opacity"
            >
              <X size={10} />
            </button>
          </span>
        ))}
      </div>

      {/* Preset comparison buttons */}
      <div className="flex flex-wrap items-center gap-1.5 mb-4">
        <span className="text-[10px] text-faint mr-1">프리셋:</span>
        {PRESET_COMPARISONS.map((preset) => (
          <button
            key={preset.id}
            onClick={() => applyPreset(preset)}
            className={cn(
              'text-[10px] px-2.5 py-1 rounded-full border transition-colors',
              activePreset === preset.id
                ? 'bg-elevated text-heading border-border-mid'
                : 'border-border-dim text-faint hover:text-muted hover:border-border-mid',
            )}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Chart */}
      {chartData.length > 0 && selectedIds.length >= MIN_INDICATORS ? (
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
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
              <Legend wrapperStyle={{ fontSize: '11px' }} />
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
      ) : (
        <div className="h-72 flex items-center justify-center">
          <p className="text-faint text-xs">
            {selectedIds.length < MIN_INDICATORS
              ? '2개 이상 선택'
              : '공통 데이터 없음'}
          </p>
        </div>
      )}

      {/* Correlation coefficients */}
      {correlations.length > 0 && (
        <div className="mt-4 pt-3 border-t border-border-dim">
          <h4 className="text-[11px] font-medium text-heading mb-2">상관계수 (피어슨)</h4>
          <div className="flex flex-wrap gap-2">
            {correlations.map(({ a, b, r }) => {
              const absR = Math.abs(r)
              const severity =
                absR >= 0.7 ? 'strong' : absR >= 0.4 ? 'moderate' : 'weak'
              return (
                <div
                  key={`${a}-${b}`}
                  className={cn(
                    'text-[10px] px-2.5 py-1.5 rounded-lg border border-border-dim',
                    severity === 'strong' && 'bg-elevated',
                  )}
                >
                  <span className="text-muted">{a} ↔ {b}: </span>
                  <span
                    className={cn(
                      'font-mono font-medium',
                      r > 0 ? 'text-[#1D9E75]' : 'text-[#E24B4A]',
                    )}
                  >
                    {r > 0 ? '+' : ''}{r.toFixed(3)}
                  </span>
                  <span className="text-faint ml-1">
                    ({severity === 'strong' ? '강한' : severity === 'moderate' ? '보통' : '약한'}{' '}
                    {r > 0 ? '양의' : '음의'} 상관)
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

    </div>
  )
}
