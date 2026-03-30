import { useMemo } from 'react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
} from 'recharts'
import { cn } from '@/lib/utils'
import { getIndicatorDescription } from '@/data/indicatorDescriptions'
import { InfoTooltip, IndicatorTooltipContent } from '@/components/ui/InfoTooltip'
import type { Indicator, IndicatorData } from '@/types/indicator'

interface BondSpreadWidgetProps {
  indicators: Indicator[]
  dataMap: Record<number, IndicatorData[]>
}

/** 심볼로 지표를 찾는 헬퍼 */
function findBySymbol(indicators: Indicator[], symbol: string) {
  return indicators.find((i) => i.symbol === symbol)
}

/** 최신 값 가져오기 */
function getLatestValue(series: IndicatorData[]): number | null {
  if (series.length === 0) return null
  return series[series.length - 1].value
}

/** 스프레드 시계열 차트 데이터 */
function buildSpreadSeries(series: IndicatorData[]) {
  return series.map((d) => ({
    date: d.date,
    value: d.value,
    positive: d.value >= 0 ? d.value : 0,
    negative: d.value < 0 ? d.value : 0,
  }))
}

export function BondSpreadWidget({ indicators, dataMap }: BondSpreadWidgetProps) {
  const bondIndicators = useMemo(
    () => indicators.filter((i) => i.category === 'BOND'),
    [indicators],
  )

  // 핵심 지표 찾기
  const spreadIndicator = findBySymbol(bondIndicators, 'T10Y2Y')
  const tenYearIndicator = findBySymbol(bondIndicators, '^TNX')
  const twoYearIndicator = findBySymbol(bondIndicators, '^IRX')
  const korea10YIndicator = findBySymbol(bondIndicators, 'KR10Y')

  // 시계열 데이터
  const spreadSeries = useMemo(
    () => (spreadIndicator ? (dataMap[spreadIndicator.id] ?? []) : []),
    [spreadIndicator, dataMap],
  )

  // 최신 값
  const spreadValue = spreadIndicator ? getLatestValue(dataMap[spreadIndicator.id] ?? []) : null
  const tenYearValue = tenYearIndicator ? getLatestValue(dataMap[tenYearIndicator.id] ?? []) : null
  const twoYearValue = twoYearIndicator ? getLatestValue(dataMap[twoYearIndicator.id] ?? []) : null
  const korea10YValue = korea10YIndicator ? getLatestValue(dataMap[korea10YIndicator.id] ?? []) : null

  const isInverted = spreadValue !== null && spreadValue < 0

  // 차트 데이터
  const chartData = useMemo(() => buildSpreadSeries(spreadSeries), [spreadSeries])

  // T10Y2Y 임계값 정보
  const spreadDesc = getIndicatorDescription('T10Y2Y', 'BOND')

  // 개별 채권 지표 목록
  const bondCards = useMemo(() => {
    const cards: { symbol: string; name: string; value: number | null; indicator?: Indicator }[] = []
    if (tenYearIndicator) {
      cards.push({ symbol: '^TNX', name: '미국 10년물', value: tenYearValue, indicator: tenYearIndicator })
    }
    if (twoYearIndicator) {
      cards.push({ symbol: '^IRX', name: '미국 2년물', value: twoYearValue, indicator: twoYearIndicator })
    }
    if (korea10YIndicator) {
      cards.push({ symbol: 'KR10Y', name: '한국 10년물', value: korea10YValue, indicator: korea10YIndicator })
    }
    return cards
  }, [tenYearIndicator, twoYearIndicator, korea10YIndicator, tenYearValue, twoYearValue, korea10YValue])

  if (bondIndicators.length === 0) return null

  return (
    <div className="rounded-lg border border-border-dim bg-surface p-5">
      {/* Section Header */}
      <div className="mb-5">
        <h2 className="text-base font-semibold text-heading">채권 시장</h2>
      </div>

      {/* ── 장단기 금리차 메인 영역 ── */}
      <div className="mb-5">
        <div className="flex items-center gap-1.5 mb-3">
          <h3 className="text-[13px] font-medium text-heading">장단기 금리차 (10Y-2Y)</h3>
          {spreadIndicator && (
            <InfoTooltip>
              <IndicatorTooltipContent {...spreadDesc} />
            </InfoTooltip>
          )}
        </div>

        {/* 스프레드 현재값 & 상태 */}
        {spreadValue !== null ? (
          <div className="flex items-center gap-3 mb-3">
            <span
              className={cn(
                'text-2xl font-bold tabular-nums',
                isInverted ? 'text-red-500' : 'text-emerald-500',
              )}
            >
              {spreadValue >= 0 ? '+' : ''}{spreadValue.toFixed(2)}%
            </span>

            {/* 상태 뱃지 */}
            <span
              className={cn(
                'text-[10px] font-medium px-2.5 py-1 rounded-full',
                isInverted
                  ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                  : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
              )}
            >
              {isInverted ? '역전 (Inverted)' : '정상 (Normal)'}
            </span>
          </div>
        ) : (
          <p className="text-faint text-sm mb-3">데이터 없음</p>
        )}

        {/* 스프레드 바 시각화 — 0 기준 수평 바 */}
        {spreadValue !== null && (
          <div className="relative h-10 rounded-lg bg-elevated overflow-hidden mb-3">
            {/* 중앙선 (0 기준) */}
            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-border-mid z-10" />
            <span className="absolute left-1/2 -translate-x-1/2 top-0.5 text-[9px] text-faint z-10">
              0
            </span>

            {/* 스프레드 바 */}
            {isInverted ? (
              <div
                className="absolute top-1/2 -translate-y-1/2 h-5 rounded-r-sm"
                style={{
                  right: '50%',
                  width: `${Math.min(Math.abs(spreadValue) * 20, 45)}%`,
                  background: 'rgba(239, 68, 68, 0.7)',
                  boxShadow: '0 0 12px rgba(239, 68, 68, 0.5)',
                  animation: 'pulse 2s ease-in-out infinite',
                }}
              />
            ) : (
              <div
                className="absolute top-1/2 -translate-y-1/2 h-5 rounded-l-sm"
                style={{
                  left: '50%',
                  width: `${Math.min(spreadValue * 20, 45)}%`,
                  background: 'rgba(16, 185, 129, 0.6)',
                }}
              />
            )}
          </div>
        )}

      </div>

      {/* ── 스프레드 시계열 차트 ── */}
      {chartData.length > 1 && (
        <div className="mb-5">
          <p className="text-[11px] text-muted mb-2">금리차 추이</p>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <XAxis
                  dataKey="date"
                  tick={{ fill: 'var(--th-chart-tick)', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: string) => {
                    const d = new Date(v)
                    return `${d.getMonth() + 1}/${d.getDate()}`
                  }}
                  minTickGap={40}
                />
                <YAxis
                  tick={{ fill: 'var(--th-chart-tick)', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) => `${v.toFixed(1)}%`}
                />
                <Tooltip
                  contentStyle={{
                    background: 'var(--th-surface)',
                    border: '1px solid var(--th-border-mid)',
                    borderRadius: '8px',
                    fontSize: '11px',
                  }}
                  formatter={(val: unknown) => [`${Number(val).toFixed(2)}%`, '금리차']}
                  labelFormatter={(label: unknown) => {
                    const d = new Date(String(label))
                    return `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()}`
                  }}
                />
                <ReferenceLine
                  y={0}
                  stroke="var(--th-border-mid)"
                  strokeDasharray="4 3"
                  label={{
                    value: '0 (기준선)',
                    position: 'right',
                    fontSize: 9,
                    fill: 'var(--th-chart-tick)',
                  }}
                />
                {/* 양수 영역 (파란/초록) */}
                <Area
                  type="monotone"
                  dataKey="positive"
                  stroke="#10b981"
                  fill="#10b981"
                  fillOpacity={0.15}
                  strokeWidth={0}
                  connectNulls
                />
                {/* 음수 영역 (빨강) */}
                <Area
                  type="monotone"
                  dataKey="negative"
                  stroke="#ef4444"
                  fill="#ef4444"
                  fillOpacity={0.2}
                  strokeWidth={0}
                  connectNulls
                />
                {/* 실제 라인 */}
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={isInverted ? '#ef4444' : '#10b981'}
                  fill="none"
                  strokeWidth={1.5}
                  dot={false}
                  connectNulls
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ── 임계값 시각화 ── */}
      {spreadDesc.thresholds && spreadDesc.thresholds.length > 0 && (
        <div className="mb-5">
          <p className="text-[11px] text-muted mb-2">금리차 해석 기준</p>
          <div className="flex flex-col gap-1.5">
            {spreadDesc.thresholds.map((t) => (
              <div key={t.level} className="flex items-center gap-2">
                <span
                  className={cn(
                    'w-2 h-2 rounded-full flex-shrink-0',
                    t.severity === 'safe' && 'bg-emerald-500',
                    t.severity === 'warning' && 'bg-amber-500',
                    t.severity === 'danger' && 'bg-red-500',
                  )}
                />
                <span className="text-[11px] text-heading font-medium tabular-nums w-14">
                  {t.level > 0 ? '+' : ''}{t.level}%
                </span>
                <span className="text-[11px] text-muted">{t.label}</span>
                {/* 현재 위치 표시 */}
                {spreadValue !== null && (() => {
                  const thresholds = spreadDesc.thresholds!
                  const idx = thresholds.indexOf(t)
                  // 간단한 방식: 가장 가까운 임계값에 표시
                  const distances = thresholds.map((th) => Math.abs(spreadValue - th.level))
                  const minDist = Math.min(...distances)
                  if (distances[idx] === minDist) {
                    return (
                      <span className="text-[9px] text-heading bg-elevated px-1.5 py-0.5 rounded-full">
                        현재
                      </span>
                    )
                  }
                  return null
                })()}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 개별 채권 지표 ── */}
      <div className="border-t border-border-dim pt-4 mb-5">
        <p className="text-[11px] text-muted mb-3 uppercase tracking-wide">개별 채권 금리</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {bondCards.map((card) => {
            const desc = getIndicatorDescription(card.symbol, 'BOND')
            return (
              <div
                key={card.symbol}
                className="rounded-lg border border-border-dim bg-elevated p-3"
              >
                <div className="flex items-center gap-1 mb-1">
                  <p className="text-[10px] text-faint uppercase tracking-wide">
                    {card.symbol}
                  </p>
                  <InfoTooltip>
                    <IndicatorTooltipContent {...desc} />
                  </InfoTooltip>
                </div>
                <p className="text-[12px] font-medium text-heading mb-1">{card.name}</p>
                {card.value !== null ? (
                  <p className="text-lg font-semibold text-heading tabular-nums">
                    {card.value.toFixed(2)}%
                  </p>
                ) : (
                  <p className="text-faint text-sm">데이터 없음</p>
                )}
              </div>
            )
          })}
        </div>
      </div>

    </div>
  )
}
