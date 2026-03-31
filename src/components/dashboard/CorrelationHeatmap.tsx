import { Fragment, useMemo, useState } from 'react'
import { Check, ChevronDown, ChevronUp, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useIndicatorSeries, type DateRange } from '@/hooks/useIndicators'
import type { Indicator, IndicatorData } from '@/types/indicator'

interface CorrelationHeatmapProps {
  indicators: Indicator[]
  dataMap: Record<number, IndicatorData[]>
  selectedId?: number
  onSelect?: (id: number) => void
}

const RANGE_OPTIONS: { value: DateRange; label: string }[] = [
  { value: '1M', label: '1개월' },
  { value: '3M', label: '3개월' },
  { value: '1Y', label: '1년' },
]

function toReturns(values: number[]): number[] {
  const returns: number[] = []
  for (let i = 1; i < values.length; i++) {
    if (values[i - 1] === 0) continue
    returns.push((values[i] - values[i - 1]) / values[i - 1])
  }
  return returns
}

function alignByDate(
  aData: IndicatorData[],
  bData: IndicatorData[],
): { aValues: number[]; bValues: number[] } {
  const bMap = new Map(bData.map((d) => [d.date, d.value]))
  const aValues: number[] = []
  const bValues: number[] = []
  for (const d of aData) {
    const bVal = bMap.get(d.date)
    if (bVal != null) {
      aValues.push(d.value)
      bValues.push(bVal)
    }
  }
  return { aValues, bValues }
}

function pearson(a: number[], b: number[]): number {
  const n = a.length
  if (n < 2) return 0
  const meanA = a.reduce((s, v) => s + v, 0) / n
  const meanB = b.reduce((s, v) => s + v, 0) / n
  let cov = 0, varA = 0, varB = 0
  for (let i = 0; i < n; i++) {
    const da = a[i] - meanA
    const db = b[i] - meanB
    cov += da * db
    varA += da * da
    varB += db * db
  }
  const denom = Math.sqrt(varA * varB)
  return denom === 0 ? 0 : cov / denom
}

function getConfidence(sampleCount: number): { label: string; color: string } {
  if (sampleCount >= 60) return { label: '신뢰도 높음', color: '#1D9E75' }
  if (sampleCount >= 20) return { label: '참고용', color: '#EF9F27' }
  return { label: '데이터 부족', color: '#E24B4A' }
}

function getStrengthLabel(val: number): { text: string; color: string } {
  const abs = Math.abs(val)
  const dir = val >= 0 ? '양' : '음'
  if (abs > 0.8) return { text: `매우 강한 ${dir}의 상관`, color: val >= 0 ? '#1D9E75' : '#E24B4A' }
  if (abs > 0.5) return { text: `${dir}의 상관`, color: val >= 0 ? '#378ADD' : '#EF9F27' }
  if (abs > 0.2) return { text: `약한 ${dir}의 상관`, color: '#94a3b8' }
  return { text: '거의 무관', color: '#64748b' }
}

/**
 * 연속 색상 그라데이션: -1(빨강) ~ 0(중립) ~ +1(파랑)
 * 대각선(자기 자신)은 별도 처리
 */
function getCorrColor(val: number, isDiagonal: boolean): { bg: string; text: string } {
  if (isDiagonal) return { bg: 'var(--corr-strong)', text: 'var(--corr-strong-text)' }

  const abs = Math.abs(val)
  const alpha = 0.15 + abs * 0.55 // 0.15 ~ 0.70

  if (val >= 0) {
    return {
      bg: `rgba(55, 138, 221, ${alpha})`,   // blue
      text: abs > 0.4 ? '#bfdbfe' : 'var(--corr-weak-text)',
    }
  }
  return {
    bg: `rgba(226, 75, 74, ${alpha})`,     // red
    text: abs > 0.4 ? '#fecaca' : '#E24B4A',
  }
}

type ViewMode = 'matrix' | 'bar'

const MAX_SELECTABLE = 8

export function CorrelationHeatmap({ indicators, dataMap, selectedId, onSelect }: CorrelationHeatmapProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('bar')
  const [range, setRange] = useState<DateRange>('1M')
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [selectorOpen, setSelectorOpen] = useState(false)

  // 선택된 지표가 없으면 상위 5개 기본 표시
  const activeIds = selectedIds.length > 0
    ? selectedIds
    : indicators.slice(0, 5).map((i) => i.id)
  const items = indicators.filter((i) => activeIds.includes(i.id))

  // 기간별 데이터 fetch (기본 1M은 부모에서 받은 dataMap 사용)
  const { data: rangeResult } = useIndicatorSeries(
    range !== '1M' ? activeIds : [],
    range,
  )
  const effectiveData = range === '1M' ? dataMap : (rangeResult?.data ?? dataMap)

  const toggleIndicator = (id: number) => {
    setSelectedIds((prev) => {
      if (prev.length === 0) {
        // 초기: 기본 목록에서 시작
        const defaults = indicators.slice(0, 5).map((i) => i.id)
        if (defaults.includes(id)) return defaults.filter((d) => d !== id)
        return [...defaults, id].slice(0, MAX_SELECTABLE)
      }
      if (prev.includes(id)) return prev.filter((d) => d !== id)
      if (prev.length >= MAX_SELECTABLE) return prev
      return [...prev, id]
    })
  }

  const { matrix, sampleCounts } = useMemo(() => {
    const mat: number[][] = []
    const counts: number[][] = []
    for (let i = 0; i < items.length; i++) {
      const row: number[] = []
      const countRow: number[] = []
      const aData = effectiveData[items[i].id] ?? []
      for (let j = 0; j < items.length; j++) {
        if (i === j) { row.push(1); countRow.push(0); continue }
        const bData = effectiveData[items[j].id] ?? []
        const { aValues, bValues } = alignByDate(aData, bData)
        const aReturns = toReturns(aValues)
        const bReturns = toReturns(bValues)
        row.push(pearson(aReturns, bReturns))
        countRow.push(aReturns.length)
      }
      mat.push(row)
      counts.push(countRow)
    }
    return { matrix: mat, sampleCounts: counts }
  }, [items, effectiveData])

  const selectedCorrelations = useMemo(() => {
    if (selectedId == null) return null
    const idx = items.findIndex((i) => i.id === selectedId)
    if (idx === -1) return null
    return items
      .map((item, j) => ({
        indicator: item,
        corr: matrix[idx]?.[j] ?? 0,
        samples: sampleCounts[idx]?.[j] ?? 0,
      }))
      .filter((_, j) => j !== idx)
      .sort((a, b) => Math.abs(b.corr) - Math.abs(a.corr))
  }, [selectedId, items, matrix, sampleCounts])

  const shortName = (name: string) => {
    if (name.length <= 5) return name
    const map: Record<string, string> = {
      'S&P 500': 'S&P',
      '코스피': '코스피',
      '달러/원': '달러/원',
      '비트코인': 'BTC',
    }
    return map[name] ?? name.slice(0, 5)
  }

  const selectedName = items.find((i) => i.id === selectedId)?.name

  return (
    <div className="rounded-lg border border-border-dim bg-surface p-5 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-start justify-between mb-1">
        <h3 className="text-base font-semibold text-heading">지표 간 상관관계</h3>
        <div className="flex gap-1">
          <button
            onClick={() => setViewMode('bar')}
            className={cn(
              'text-[10px] px-2 py-0.5 rounded transition-colors',
              viewMode === 'bar' ? 'bg-elevated text-heading' : 'text-faint hover:text-muted',
            )}
          >
            차트
          </button>
          <button
            onClick={() => setViewMode('matrix')}
            className={cn(
              'text-[10px] px-2 py-0.5 rounded transition-colors',
              viewMode === 'matrix' ? 'bg-elevated text-heading' : 'text-faint hover:text-muted',
            )}
          >
            행렬
          </button>
        </div>
      </div>

      {/* Period selector + Indicator selector */}
      <div className="flex items-center gap-2 mb-3">
        {/* Period tabs */}
        <div className="flex gap-0.5">
          {RANGE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setRange(opt.value)}
              className={cn(
                'text-[10px] px-2 py-0.5 rounded-full border transition-colors',
                range === opt.value
                  ? 'bg-elevated text-heading border-border-mid'
                  : 'border-border-dim text-faint hover:text-muted hover:border-border-mid',
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Indicator selector dropdown */}
        <div className="relative ml-auto">
          <button
            onClick={() => setSelectorOpen(!selectorOpen)}
            className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border border-border-dim text-muted hover:text-heading hover:border-border-mid transition-colors"
          >
            지표 {activeIds.length}개
            {selectorOpen ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
          </button>

          {selectorOpen && (
            <div className="absolute right-0 top-full mt-1 z-40 w-52 max-h-56 overflow-y-auto rounded-lg border border-border-mid bg-surface shadow-lg animate-fadeIn">
              {indicators.map((ind) => {
                const checked = activeIds.includes(ind.id)
                const disabled = !checked && activeIds.length >= MAX_SELECTABLE
                return (
                  <button
                    key={ind.id}
                    onClick={() => toggleIndicator(ind.id)}
                    disabled={disabled}
                    className={cn(
                      'w-full flex items-center gap-2 px-3 py-1.5 text-left text-[11px] transition-colors',
                      checked ? 'text-heading' : 'text-muted',
                      disabled ? 'opacity-40 cursor-not-allowed' : 'hover:bg-elevated cursor-pointer',
                    )}
                  >
                    <div
                      className={cn(
                        'w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0',
                        checked ? 'bg-blue-600 border-blue-600' : 'border-border-mid',
                      )}
                    >
                      {checked && <Check size={10} className="text-white" />}
                    </div>
                    <span className="truncate">{ind.name}</span>
                    <span className="ml-auto text-[9px] text-faint">{ind.category}</span>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {selectedName && (
        <p className="text-[11px] text-muted mb-3">
          {selectedName}
        </p>
      )}

      {items.length === 0 ? (
        <div className="flex justify-center py-4"><Loader2 size={16} className="animate-spin text-faint" /></div>
      ) : viewMode === 'bar' ? (
        /* ── Bar Chart View ── */
        <div className="flex-1 flex flex-col gap-1.5 min-h-0 overflow-y-auto">
          {selectedCorrelations ? (
            <>
              {selectedCorrelations.map(({ indicator: ind, corr, samples }) => {
                const strength = getStrengthLabel(corr)
                const confidence = getConfidence(samples)
                const barWidth = Math.abs(corr) * 100
                return (
                  <div
                    key={ind.id}
                    className="group cursor-pointer rounded-lg p-2 hover:bg-elevated transition-colors"
                    onClick={() => onSelect?.(ind.id)}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[12px] text-heading font-medium">{shortName(ind.name)}</span>
                      <span className="text-[11px] font-mono" style={{ color: strength.color }}>
                        {corr >= 0 ? '+' : ''}{corr.toFixed(2)}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-elevated overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${barWidth}%`,
                          background: strength.color,
                          opacity: 0.7,
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-[10px] text-faint">{strength.text}</p>
                      <p className="text-[9px]" style={{ color: confidence.color }}>
                        n={samples} · {confidence.label}
                      </p>
                    </div>
                  </div>
                )
              })}
            </>
          ) : (
            <div className="flex flex-col gap-1">
              {items.map((ind) => (
                <button
                  key={ind.id}
                  onClick={() => onSelect?.(ind.id)}
                  className="flex items-center gap-2 rounded-lg p-2.5 text-left hover:bg-elevated transition-colors"
                >
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{
                      background:
                        ind.category === 'STOCK' ? '#378ADD'
                          : ind.category === 'FOREX' ? '#E24B4A'
                          : ind.category === 'COMMODITY' ? '#EF9F27'
                          : ind.category === 'BOND' ? '#1D9E75'
                          : ind.category === 'CRYPTO' ? '#F59E0B'
                          : '#7F77DD',
                    }}
                  />
                  <div>
                    <p className="text-[12px] text-heading">{ind.name}</p>
                    <p className="text-[10px] text-faint">{ind.category} · {ind.symbol}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* ── Matrix View (gradient heatmap) ── */
        <div className="flex-1 min-h-0 overflow-auto">
          {/* Color legend */}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[9px] text-faint">-1</span>
            <div
              className="flex-1 h-2 rounded-full"
              style={{
                background: 'linear-gradient(to right, rgba(226,75,74,0.7), rgba(226,75,74,0.15), rgba(148,163,184,0.15), rgba(55,138,221,0.15), rgba(55,138,221,0.7))',
              }}
            />
            <span className="text-[9px] text-faint">+1</span>
          </div>

          <div
            className="grid gap-[3px] text-[10px]"
            style={{
              gridTemplateColumns: `36px repeat(${items.length}, 1fr)`,
            }}
          >
            {/* Column headers */}
            <div />
            {items.map((ind) => (
              <div
                key={`col-${ind.id}`}
                className={cn(
                  'text-center pb-0.5 cursor-pointer truncate',
                  selectedId === ind.id ? 'text-heading font-medium' : 'text-muted',
                )}
                onClick={() => onSelect?.(ind.id)}
              >
                {shortName(ind.name)}
              </div>
            ))}

            {/* Rows */}
            {items.map((rowInd, i) => (
              <Fragment key={`row-${rowInd.id}`}>
                <div
                  className={cn(
                    'flex items-center justify-end pr-1 cursor-pointer truncate',
                    selectedId === rowInd.id ? 'text-heading font-medium' : 'text-muted',
                  )}
                  onClick={() => onSelect?.(rowInd.id)}
                >
                  {shortName(rowInd.name)}
                </div>
                {matrix[i]?.map((val, j) => {
                  const isHighlighted =
                    selectedId != null && (items[i].id === selectedId || items[j].id === selectedId)
                  const { bg, text } = getCorrColor(val, i === j)
                  return (
                    <div
                      key={`cell-${i}-${j}`}
                      className={cn(
                        'h-7 rounded flex items-center justify-center text-[10px] font-medium transition-opacity cursor-pointer',
                        !isHighlighted && selectedId != null && 'opacity-30',
                      )}
                      style={{ background: bg, color: text }}
                      title={`${shortName(items[i].name)} ↔ ${shortName(items[j].name)}: ${val.toFixed(2)}`}
                      onClick={() => onSelect?.(items[j].id)}
                    >
                      {val.toFixed(val === 1 ? 1 : 2)}
                    </div>
                  )
                })}
              </Fragment>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
