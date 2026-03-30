import { useMemo, useState } from 'react'
import { ChevronDown, ChevronUp, Activity } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getIndicatorDescription } from '@/data/indicatorDescriptions'
import type { Indicator, IndicatorData } from '@/types/indicator'

interface MarketSentimentWidgetProps {
  indicators: Indicator[]
  dataMap: Record<number, IndicatorData[]>
}

/** symbol 기준으로 indicator + latest data 를 찾는 헬퍼 */
function useIndicatorBySymbol(
  indicators: Indicator[],
  dataMap: Record<number, IndicatorData[]>,
  symbol: string,
) {
  return useMemo(() => {
    const ind = indicators.find((i) => i.symbol === symbol)
    if (!ind) return { indicator: undefined, latest: undefined, prev: undefined, series: [] as IndicatorData[] }
    const series = dataMap[ind.id] ?? []
    const latest = series.length > 0 ? series[series.length - 1] : undefined
    const prev = series.length > 1 ? series[series.length - 2] : undefined
    return { indicator: ind, latest, prev, series }
  }, [indicators, dataMap, symbol])
}

// ────────────────────────────────────────────
// VIX 색상 판정
// ────────────────────────────────────────────
function getVixColor(value: number): { bg: string; text: string; label: string } {
  if (value < 15) return { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400', label: '낮은 변동성' }
  if (value <= 30) return { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-400', label: '보통' }
  return { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', label: '높은 공포' }
}

// ────────────────────────────────────────────
// Fear & Greed 구간 정의
// ────────────────────────────────────────────
const FG_ZONES = [
  { min: 0, max: 25, label: '극도의 공포', color: '#991b1b' },
  { min: 25, max: 45, label: '공포', color: '#E24B4A' },
  { min: 45, max: 55, label: '중립', color: '#6b7280' },
  { min: 55, max: 75, label: '탐욕', color: '#1D9E75' },
  { min: 75, max: 100, label: '극도의 탐욕', color: '#166534' },
] as const

function getFearGreedZone(value: number) {
  return FG_ZONES.find((z) => value >= z.min && value < z.max) ?? FG_ZONES[FG_ZONES.length - 1]
}

// ────────────────────────────────────────────
// SVG 반원 게이지
// ────────────────────────────────────────────
function SentimentGauge({ value }: { value: number }) {
  const cx = 100
  const cy = 90
  const r = 70
  const startAngle = Math.PI // 180 degrees (left)

  // 구간별 호 그리기
  const arcs = FG_ZONES.map((zone) => {
    const a1 = startAngle - (zone.min / 100) * Math.PI
    const a2 = startAngle - (zone.max / 100) * Math.PI
    const x1 = cx + r * Math.cos(a1)
    const y1 = cy - r * Math.sin(a1)
    const x2 = cx + r * Math.cos(a2)
    const y2 = cy - r * Math.sin(a2)
    const largeArc = (zone.max - zone.min) / 100 * Math.PI > Math.PI ? 1 : 0
    return (
      <path
        key={zone.label}
        d={`M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 0 ${x2} ${y2}`}
        fill="none"
        stroke={zone.color}
        strokeWidth={12}
        strokeLinecap="butt"
      />
    )
  })

  // 바늘 각도 (0 → 왼쪽 180도, 100 → 오른쪽 0도)
  const clampedValue = Math.max(0, Math.min(100, value))
  const needleAngle = startAngle - (clampedValue / 100) * Math.PI
  const needleLen = r - 10
  const nx = cx + needleLen * Math.cos(needleAngle)
  const ny = cy - needleLen * Math.sin(needleAngle)

  const zone = getFearGreedZone(clampedValue)

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 200 110" className="w-full max-w-[240px]">
        {/* 배경 호 */}
        {arcs}

        {/* 바늘 */}
        <line
          x1={cx}
          y1={cy}
          x2={nx}
          y2={ny}
          stroke="var(--th-heading)"
          strokeWidth={2}
          strokeLinecap="round"
        />
        {/* 중심점 */}
        <circle cx={cx} cy={cy} r={4} fill="var(--th-heading)" />

        {/* 양쪽 라벨 */}
        <text x={cx - r - 8} y={cy + 4} textAnchor="end" fontSize={9} fill="var(--th-muted)">0</text>
        <text x={cx + r + 8} y={cy + 4} textAnchor="start" fontSize={9} fill="var(--th-muted)">100</text>
      </svg>

      {/* 값 & 라벨 */}
      <div className="text-center -mt-2">
        <p className="text-2xl font-bold text-heading">{clampedValue}</p>
        <p className="text-xs font-medium mt-0.5" style={{ color: zone.color }}>
          {zone.label}
        </p>
      </div>
    </div>
  )
}

// ────────────────────────────────────────────
// 스파크라인 (추가 주가지수용)
// ────────────────────────────────────────────
function MiniSparkline({ series, color }: { series: IndicatorData[]; color: string }) {
  const points = useMemo(() => {
    if (series.length < 2) return ''
    const last8 = series.slice(-8)
    const min = Math.min(...last8.map((d) => d.value))
    const max = Math.max(...last8.map((d) => d.value))
    const range = max - min || 1
    return last8
      .map((d, i) => {
        const x = (i / (last8.length - 1)) * 100
        const y = 28 - ((d.value - min) / range) * 24
        return `${x},${y}`
      })
      .join(' ')
  }, [series])

  if (!points) return null
  return (
    <svg className="w-20 h-7 shrink-0" viewBox="0 0 100 32" preserveAspectRatio="none">
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" />
    </svg>
  )
}

// ────────────────────────────────────────────
// 추가 주가지수 행
// ────────────────────────────────────────────
function IndexRow({
  indicator,
  latest,
  prev,
  series,
  note,
  expanded,
  onToggle,
}: {
  indicator: Indicator | undefined
  latest: IndicatorData | undefined
  prev: IndicatorData | undefined
  series: IndicatorData[]
  note: string
  expanded: boolean
  onToggle: () => void
}) {
  const changePercent = useMemo(() => {
    if (!latest || !prev || prev.value === 0) return latest?.change ?? 0
    return ((latest.value - prev.value) / prev.value) * 100
  }, [latest, prev])

  const isUp = changePercent >= 0
  const desc = indicator ? getIndicatorDescription(indicator.symbol, indicator.category) : undefined

  return (
    <div className="border-b border-border-dim last:border-b-0">
      <button
        type="button"
        className="w-full flex items-center gap-3 py-3 px-1 text-left hover:bg-hover/50 transition-colors rounded"
        onClick={onToggle}
      >
        {/* 이름 */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-heading truncate">
            {indicator?.name ?? '--'}
          </p>
          <p className="text-[10px] text-faint">{note}</p>
        </div>

        {/* 스파크라인 */}
        <MiniSparkline series={series} color={isUp ? '#1D9E75' : '#E24B4A'} />

        {/* 값 */}
        <div className="text-right shrink-0 w-24">
          <p className="text-sm font-medium text-heading">
            {latest ? latest.value.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '--'}
          </p>
          {latest && (
            <p
              className={cn(
                'text-[11px] font-medium',
                isUp ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400',
              )}
            >
              {isUp ? '+' : ''}{changePercent.toFixed(2)}%
            </p>
          )}
        </div>

        {/* 토글 */}
        {expanded ? (
          <ChevronUp size={14} className="text-faint shrink-0" />
        ) : (
          <ChevronDown size={14} className="text-faint shrink-0" />
        )}
      </button>

      {/* 확장 영역: 해석 & 학습 */}
      {expanded && desc && (
        <div className="px-2 pb-3 space-y-1.5 animate-fadeIn">
          {desc.interpretation && (
            <p className="text-xs text-muted leading-relaxed">
              <span className="font-medium text-heading">해석:</span> {desc.interpretation}
            </p>
          )}
          {desc.learnMore && (
            <p className="text-[11px] text-faint leading-relaxed">
              {desc.learnMore}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

// ────────────────────────────────────────────
// 메인 위젯
// ────────────────────────────────────────────
export function MarketSentimentWidget({ indicators, dataMap }: MarketSentimentWidgetProps) {
  const vix = useIndicatorBySymbol(indicators, dataMap, '^VIX')
  const fearGreed = useIndicatorBySymbol(indicators, dataMap, 'FEAR_GREED')
  const kosdaq = useIndicatorBySymbol(indicators, dataMap, '^KQ11')
  const dow = useIndicatorBySymbol(indicators, dataMap, '^DJI')
  const russell = useIndicatorBySymbol(indicators, dataMap, '^RUT')

  const [expandedVix, setExpandedVix] = useState(false)
  const [expandedFg, setExpandedFg] = useState(false)
  const [expandedIndices, setExpandedIndices] = useState<Record<string, boolean>>({})

  const vixDesc = getIndicatorDescription('^VIX', 'STOCK')
  const fgDesc = getIndicatorDescription('FEAR_GREED', 'STOCK')

  const vixColor = vix.latest ? getVixColor(vix.latest.value) : null

  const toggleIndex = (symbol: string) => {
    setExpandedIndices((prev) => ({ ...prev, [symbol]: !prev[symbol] }))
  }

  return (
    <section>
      {/* 섹션 헤더 */}
      <div className="flex items-center gap-2 mb-1">
        <Activity size={16} className="text-muted" />
        <h2 className="text-base font-semibold text-heading">시장 심리 & 추가 지수</h2>
      </div>
      <p className="text-xs text-muted mb-4">투자 심리와 시장 폭을 한눈에</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* ── 심리 지표 섹션 ── */}
        <div className="rounded-lg border border-border-dim bg-surface p-4 sm:p-5 space-y-5">
          <p className="section-label">심리 지표</p>

          {/* VIX */}
          <div>
            <button
              type="button"
              className="w-full text-left"
              onClick={() => setExpandedVix(!expandedVix)}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-heading">VIX 공포 지수</p>
                  {expandedVix ? (
                    <ChevronUp size={13} className="text-faint" />
                  ) : (
                    <ChevronDown size={13} className="text-faint" />
                  )}
                </div>
                {vix.latest && vixColor && (
                  <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', vixColor.bg, vixColor.text)}>
                    {vixColor.label}
                  </span>
                )}
              </div>

              {/* VIX 바 */}
              <div className="relative h-8 rounded-lg overflow-hidden flex">
                <div className="flex-1 bg-green-200 dark:bg-green-900/40" />
                <div className="flex-1 bg-yellow-200 dark:bg-yellow-900/40" />
                <div className="flex-1 bg-red-200 dark:bg-red-900/40" />

                {/* 임계값 라벨 */}
                <span className="absolute left-[calc(15/60*100%)] top-0 h-full border-l border-green-600/30 dark:border-green-400/30" />
                <span className="absolute left-[calc(30/60*100%)] top-0 h-full border-l border-red-600/30 dark:border-red-400/30" />
                <span className="absolute left-[calc(15/60*100%)] -top-0.5 -translate-x-1/2 text-[8px] text-muted">15</span>
                <span className="absolute left-[calc(30/60*100%)] -top-0.5 -translate-x-1/2 text-[8px] text-muted">30</span>

                {/* 현재 값 마커 */}
                {vix.latest && (
                  <div
                    className="absolute top-0 h-full w-0.5 bg-heading"
                    style={{ left: `${Math.min((vix.latest.value / 60) * 100, 100)}%` }}
                  >
                    <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-xs font-bold text-heading whitespace-nowrap">
                      {vix.latest.value.toFixed(1)}
                    </span>
                  </div>
                )}
              </div>

              {!vix.latest && <p className="text-sm text-faint">--</p>}
            </button>

            {/* VIX 확장 */}
            {expandedVix && (
              <div className="mt-2 space-y-1.5 animate-fadeIn">
                {vixDesc.interpretation && (
                  <p className="text-xs text-muted leading-relaxed">
                    <span className="font-medium text-heading">해석:</span> {vixDesc.interpretation}
                  </p>
                )}
                {vixDesc.learnMore && (
                  <p className="text-[11px] text-faint leading-relaxed">{vixDesc.learnMore}</p>
                )}
                {vixDesc.thresholds && (
                  <div className="flex flex-wrap gap-2 mt-1">
                    {vixDesc.thresholds.map((t) => (
                      <span
                        key={t.level}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-elevated text-muted"
                      >
                        {t.level}: {t.label}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 구분선 */}
          <hr className="border-border-dim" />

          {/* Fear & Greed Index */}
          <div>
            <button
              type="button"
              className="w-full text-left"
              onClick={() => setExpandedFg(!expandedFg)}
            >
              <div className="flex items-center gap-2 mb-3">
                <p className="text-sm font-medium text-heading">Fear & Greed Index</p>
                {expandedFg ? (
                  <ChevronUp size={13} className="text-faint" />
                ) : (
                  <ChevronDown size={13} className="text-faint" />
                )}
              </div>
            </button>

            {fearGreed.latest ? (
              <SentimentGauge value={fearGreed.latest.value} />
            ) : (
              <div className="flex flex-col items-center py-4">
                <p className="text-2xl font-bold text-faint">--</p>
                <p className="text-xs text-faint mt-1">데이터 없음</p>
              </div>
            )}

            {/* 버핏 명언 */}
            {fgDesc.interpretation && (
              <p className="text-[11px] text-muted text-center mt-3 italic leading-relaxed">
                "{fgDesc.interpretation}"
              </p>
            )}

            {/* F&G 확장 */}
            {expandedFg && (
              <div className="mt-3 space-y-1.5 animate-fadeIn">
                {fgDesc.learnMore && (
                  <p className="text-[11px] text-faint leading-relaxed">{fgDesc.learnMore}</p>
                )}
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {FG_ZONES.map((z) => (
                    <span
                      key={z.label}
                      className="text-[10px] px-1.5 py-0.5 rounded font-medium text-white"
                      style={{ backgroundColor: z.color }}
                    >
                      {z.min}-{z.max}: {z.label}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── 추가 주가지수 섹션 ── */}
        <div className="rounded-lg border border-border-dim bg-surface p-4 sm:p-5">
          <p className="section-label">추가 주가지수</p>

          <IndexRow
            indicator={kosdaq.indicator}
            latest={kosdaq.latest}
            prev={kosdaq.prev}
            series={kosdaq.series}
            note="중소형 성장주 · 개인투자자 바로미터"
            expanded={!!expandedIndices['^KQ11']}
            onToggle={() => toggleIndex('^KQ11')}
          />
          <IndexRow
            indicator={dow.indicator}
            latest={dow.latest}
            prev={dow.prev}
            series={dow.series}
            note="미국 대형 우량주 30선 · 130년 역사"
            expanded={!!expandedIndices['^DJI']}
            onToggle={() => toggleIndex('^DJI')}
          />
          <IndexRow
            indicator={russell.indicator}
            latest={russell.latest}
            prev={russell.prev}
            series={russell.series}
            note="미국 소형주 2000개 · 내수 경제 바로미터"
            expanded={!!expandedIndices['^RUT']}
            onToggle={() => toggleIndex('^RUT')}
          />
        </div>
      </div>
    </section>
  )
}
