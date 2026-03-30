import { useState, useMemo } from 'react'
import { ChevronDown, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getIndicatorDescription } from '@/data/indicatorDescriptions'
import type { ThresholdLevel } from '@/data/indicatorDescriptions'
import type { Indicator, IndicatorData } from '@/types/indicator'

interface MacroIndicatorPanelProps {
  indicators: Indicator[]
  dataMap: Record<number, IndicatorData[]>
}

const SEVERITY_COLORS: Record<string, string> = {
  safe: '#1D9E75',
  warning: '#EF9F27',
  danger: '#E24B4A',
}

const SEVERITY_LABELS: Record<string, string> = {
  safe: '안정',
  warning: '주의',
  danger: '위험',
}

/**
 * Determine severity for a value based on thresholds.
 * Thresholds are ordered from "good" to "bad" (ascending or descending).
 * We find the closest threshold and return its severity.
 */
function getSeverityForValue(
  value: number,
  thresholds: ThresholdLevel[],
  symbol: string,
): ThresholdLevel | undefined {
  if (thresholds.length === 0) return undefined

  // For indicators where higher = worse (CPI, unemployment, PCE)
  // thresholds are ascending: safe < warning < danger
  // For indicators where lower = worse (PMI, consumer sentiment)
  // thresholds are descending: safe > warning > danger
  const isAscending = thresholds[0].level < thresholds[thresholds.length - 1].level

  // Special handling for inverted indicators (PMI, consumer sentiment)
  // where higher values are better
  const invertedSymbols = ['ISM_PMI', 'UMCSENT', 'GDP']
  const isInverted = invertedSymbols.includes(symbol)

  if (isAscending && !isInverted) {
    // Normal ascending: value above danger threshold = danger, etc.
    for (let i = thresholds.length - 1; i >= 0; i--) {
      if (value >= thresholds[i].level) return thresholds[i]
    }
    return thresholds[0]
  } else {
    // Inverted or descending: value below danger threshold = danger, etc.
    for (let i = thresholds.length - 1; i >= 0; i--) {
      if (value <= thresholds[i].level) return thresholds[i]
    }
    return thresholds[0]
  }
}

/**
 * Calculate position (0-100%) for the threshold bar visualization.
 */
function getBarPosition(value: number, thresholds: ThresholdLevel[]): number {
  if (thresholds.length < 2) return 50

  const levels = thresholds.map((t) => t.level)
  const min = Math.min(...levels)
  const max = Math.max(...levels)
  const range = max - min
  if (range === 0) return 50

  // Add 20% padding on each side
  const paddedMin = min - range * 0.2
  const paddedMax = max + range * 0.2
  const paddedRange = paddedMax - paddedMin

  const pos = ((value - paddedMin) / paddedRange) * 100
  return Math.max(2, Math.min(98, pos))
}

export function MacroIndicatorPanel({ indicators, dataMap }: MacroIndicatorPanelProps) {
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set())

  const macroIndicators = useMemo(
    () => indicators.filter((ind) => ind.category === 'MACRO'),
    [indicators],
  )

  const toggleExpand = (id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  if (macroIndicators.length === 0) {
    return (
      <section>
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-heading">거시경제 지표</h2>
          <p className="text-xs text-muted mt-0.5">
            핵심 경제 건강 지표 — 클릭하면 학습 정보를 볼 수 있습니다
          </p>
        </div>
        <div className="rounded-lg border border-border-dim bg-surface p-8 text-center">
          <p className="text-muted text-sm">
            거시경제 지표 데이터가 아직 없습니다.
          </p>
          <p className="text-faint text-xs mt-1">
            CPI, 실업률, PCE 등의 데이터가 수집되면 여기에 표시됩니다.
          </p>
        </div>
      </section>
    )
  }

  return (
    <section>
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-heading">거시경제 지표</h2>
        <p className="text-xs text-muted mt-0.5">
          핵심 경제 건강 지표 — 클릭하면 학습 정보를 볼 수 있습니다
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {macroIndicators.map((indicator) => (
          <MacroCard
            key={indicator.id}
            indicator={indicator}
            series={dataMap[indicator.id] ?? []}
            isExpanded={expandedIds.has(indicator.id)}
            onToggle={() => toggleExpand(indicator.id)}
          />
        ))}
      </div>
    </section>
  )
}

interface MacroCardProps {
  indicator: Indicator
  series: IndicatorData[]
  isExpanded: boolean
  onToggle: () => void
}

function MacroCard({ indicator, series, isExpanded, onToggle }: MacroCardProps) {
  const latest = series.length > 0 ? series[series.length - 1] : undefined
  const prev = series.length > 1 ? series[series.length - 2] : undefined

  const changePercent = useMemo(() => {
    if (!latest || !prev || prev.value === 0) return latest?.change ?? 0
    return ((latest.value - prev.value) / prev.value) * 100
  }, [latest, prev])

  const desc = useMemo(
    () => getIndicatorDescription(indicator.symbol, indicator.category),
    [indicator.symbol, indicator.category],
  )
  const { thresholds, interpretation, learnMore } = desc

  const currentSeverity = useMemo(() => {
    if (!latest || !thresholds || thresholds.length === 0) return undefined
    return getSeverityForValue(latest.value, thresholds, indicator.symbol)
  }, [latest, thresholds, indicator.symbol])

  const barPosition = useMemo(() => {
    if (!latest || !thresholds || thresholds.length === 0) return 50
    return getBarPosition(latest.value, thresholds)
  }, [latest, thresholds])

  const isUp = changePercent >= 0

  return (
    <div
      className={cn(
        'rounded-lg border bg-surface transition-colors cursor-pointer',
        isExpanded ? 'border-purple-400/60' : 'border-border-dim hover:border-border-mid',
      )}
      onClick={onToggle}
    >
      {/* Header */}
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] text-faint uppercase tracking-wide">
              MACRO · {indicator.symbol}
            </p>
            <h3 className="text-[13px] font-medium text-heading mt-0.5">
              {indicator.name}
            </h3>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Severity badge */}
            {currentSeverity && (
              <span
                className="text-[10px] px-2 py-0.5 rounded-full font-medium text-white"
                style={{ backgroundColor: SEVERITY_COLORS[currentSeverity.severity] }}
              >
                {SEVERITY_LABELS[currentSeverity.severity]}
              </span>
            )}
            {/* Expand chevron */}
            <ChevronDown
              size={14}
              className={cn(
                'text-faint transition-transform duration-200',
                isExpanded && 'rotate-180',
              )}
            />
          </div>
        </div>

        {/* Value & change */}
        {latest ? (
          <div className="flex items-baseline gap-3 mt-2">
            <p className="text-xl font-medium text-heading">
              {latest.value.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </p>
            <span
              className={cn(
                'inline-flex items-center gap-0.5 text-xs font-medium',
                isUp
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400',
              )}
            >
              {isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {isUp ? '+' : ''}{changePercent.toFixed(2)}%
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-1 mt-2 text-faint">
            <Minus size={14} />
            <span className="text-sm">데이터 없음</span>
          </div>
        )}

        {/* Threshold bar */}
        {thresholds && thresholds.length > 0 && latest && (
          <div className="mt-3">
            <div className="relative h-2 rounded-full bg-elevated overflow-hidden">
              {/* Gradient background */}
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  background: `linear-gradient(to right, ${SEVERITY_COLORS.safe}, ${SEVERITY_COLORS.warning}, ${SEVERITY_COLORS.danger})`,
                  opacity: 0.25,
                }}
              />
              {/* Current value marker */}
              <div
                className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-white dark:border-gray-900 shadow-sm"
                style={{
                  left: `${barPosition}%`,
                  transform: `translate(-50%, -50%)`,
                  backgroundColor: currentSeverity
                    ? SEVERITY_COLORS[currentSeverity.severity]
                    : SEVERITY_COLORS.warning,
                }}
              />
            </div>
            {/* Threshold labels */}
            <div className="flex justify-between mt-1">
              {thresholds.map((t) => (
                <span
                  key={t.level}
                  className="text-[9px] text-faint"
                  style={{ color: SEVERITY_COLORS[t.severity] }}
                >
                  {t.level}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Brief interpretation (always visible) */}
        {interpretation && (
          <p className="text-[11px] text-muted mt-2 leading-relaxed line-clamp-2">
            {interpretation}
          </p>
        )}
      </div>

      {/* Expanded learning content */}
      {isExpanded && (
        <div
          className="border-t border-border-dim px-4 sm:px-5 py-4 space-y-3 animate-fadeIn"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Definition */}
          <div>
            <p className="text-[11px] font-medium text-heading mb-0.5">정의</p>
            <p className="text-xs text-body leading-relaxed">{desc.definition}</p>
          </div>

          {/* Importance */}
          <div>
            <p className="text-[11px] font-medium text-heading mb-0.5">왜 중요한가</p>
            <p className="text-xs text-body leading-relaxed">{desc.importance}</p>
          </div>

          {/* Full interpretation */}
          {interpretation && (
            <div>
              <p className="text-[11px] font-medium text-heading mb-0.5">해석 가이드</p>
              <p className="text-xs text-muted leading-relaxed">{interpretation}</p>
            </div>
          )}

          {/* Thresholds detail */}
          {thresholds && thresholds.length > 0 && (
            <div>
              <p className="text-[11px] font-medium text-heading mb-1">주요 기준값</p>
              <div className="space-y-1">
                {thresholds.map((t) => (
                  <div key={t.level} className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ background: SEVERITY_COLORS[t.severity] }}
                    />
                    <span className="font-mono text-[11px] text-heading w-12 shrink-0">
                      {t.level}
                    </span>
                    <span className="text-[11px] text-muted">{t.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Related indicators */}
          {desc.related.length > 0 && (
            <div>
              <p className="text-[11px] font-medium text-heading mb-1">관련 지표</p>
              <div className="flex flex-wrap gap-1">
                {desc.related.map((r) => (
                  <span
                    key={r}
                    className="px-1.5 py-0.5 rounded bg-elevated text-muted text-[10px]"
                  >
                    {r}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Learn more */}
          {learnMore && (
            <div className="pt-2 border-t border-border-dim">
              <p className="text-[11px] font-medium text-heading mb-0.5">학습 팁</p>
              <p className="text-[11px] text-faint leading-relaxed">{learnMore}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
