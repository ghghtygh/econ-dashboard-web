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
    explanation:
      '물가(CPI)가 상승하면 중앙은행은 인플레이션을 억제하기 위해 기준금리를 인상합니다. 금리 인상은 시차를 두고 물가 안정으로 이어지며, 이 두 지표의 시차 관계를 관찰하면 통화정책의 효과를 가늠할 수 있습니다.',
  },
  {
    id: 'vix-sp500',
    label: 'VIX vs S&P 500',
    keywords: ['VIX', 'S&P 500'],
    explanation:
      'VIX(공포 지수)와 S&P 500은 대표적인 역상관 관계를 보입니다. 시장이 급락하면 옵션 내재변동성이 치솟아 VIX가 급등하고, 시장이 안정되면 VIX는 하락합니다. VIX 30 이상은 극도의 공포, 15 이하는 안도를 나타냅니다.',
  },
  {
    id: 'usdkrw-kospi',
    label: '달러/원 vs KOSPI',
    keywords: ['USD/KRW', 'KOSPI'],
    explanation:
      '원화 약세(환율 상승)와 KOSPI는 역상관 경향이 있습니다. 외국인 투자자가 한국 주식을 매도하면 원화가 약세를 보이고 KOSPI가 하락합니다. 반대로 외국인 매수 유입 시 원화 강세와 주가 상승이 동시에 나타납니다.',
  },
  {
    id: 'gold-bond',
    label: '금 vs 10년 국채',
    keywords: ['Gold', '10Y'],
    explanation:
      '금과 미국 10년 국채 수익률은 역상관 관계가 많습니다. 국채 금리 상승은 이자 없는 금의 기회비용을 높여 금 가격을 압박합니다. 반면 금리 하락이나 불확실성 증가 시 안전자산인 금에 자금이 유입됩니다.',
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

  const currentPreset = PRESET_COMPARISONS.find((p) => p.id === activePreset)

  return (
    <div className="rounded-lg border border-border-dim bg-surface p-5">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <Layers size={16} className="text-muted" />
          <div>
            <h3 className="text-base font-semibold text-heading">지표 비교 오버레이</h3>
            <p className="text-[11px] text-muted mt-0.5">
              다중 지표를 겹쳐 비교하고 상관관계를 발견하세요
            </p>
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
              ? '비교할 지표를 2개 이상 선택하세요'
              : '선택한 지표의 공통 날짜 데이터가 없습니다'}
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

      {/* Educational panel */}
      {currentPreset && (
        <div className="mt-3 pt-3 border-t border-border-dim animate-fadeIn">
          <div className="flex items-start gap-2 p-3 rounded-lg bg-elevated">
            <span className="text-[13px] mt-0.5">💡</span>
            <div>
              <h4 className="text-[11px] font-medium text-heading mb-1">
                {currentPreset.label} — 관계 해설
              </h4>
              <p className="text-[11px] text-muted leading-relaxed">
                {currentPreset.explanation}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Footer note */}
      <div className="mt-3 pt-3 border-t border-border-dim">
        <p className="text-[10px] text-faint leading-relaxed">
          * 정규화 모드에서는 각 지표의 첫 번째 값을 100으로 놓고 비교합니다. 원래 값 모드에서는 좌측 Y축에 첫 번째 지표, 우측 Y축에 두 번째 지표를 표시합니다.
        </p>
      </div>
    </div>
  )
}
