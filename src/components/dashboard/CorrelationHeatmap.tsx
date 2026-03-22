import { Fragment, useMemo, useState } from 'react'
import { cn } from '@/lib/utils'
import type { Indicator, IndicatorData } from '@/types/indicator'

interface CorrelationHeatmapProps {
  indicators: Indicator[]
  dataMap: Record<number, IndicatorData[]>
  selectedId?: number
  onSelect?: (id: number) => void
}

/**
 * 가격 원본(level)이 아니라 일별 수익률(daily returns)로 피어슨 상관계수를 계산합니다.
 * 가격 수준은 대부분 우상향이라 원본끼리 비교하면 거의 모든 조합이 양의 상관으로 나옵니다.
 * 수익률 = (오늘 가격 - 어제 가격) / 어제 가격 으로 변환 후 비교해야
 * "같이 오르고 같이 내리는가"를 정확히 측정할 수 있습니다.
 */
function toReturns(values: number[]): number[] {
  const returns: number[] = []
  for (let i = 1; i < values.length; i++) {
    if (values[i - 1] === 0) continue
    returns.push((values[i] - values[i - 1]) / values[i - 1])
  }
  return returns
}

/**
 * 날짜 기반으로 두 시계열을 매칭합니다.
 * 같은 날짜에 데이터가 있는 포인트만 추출하여 정확한 비교를 보장합니다.
 */
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

/** 표본 수 기반 신뢰도 판정 */
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

function getRelationDescription(nameA: string, nameB: string, corr: number): string {
  const abs = Math.abs(corr)
  if (abs < 0.2) return `${nameA}와 ${nameB}는 뚜렷한 상관관계가 없습니다.`
  const dir = corr > 0 ? '같은 방향' : '반대 방향'
  const strength = abs > 0.7 ? '강하게' : '다소'
  return `${nameA}과(와) ${nameB}는 ${strength} ${dir}으로 움직이는 경향이 있습니다.`
}

type ViewMode = 'matrix' | 'bar'

export function CorrelationHeatmap({ indicators, dataMap, selectedId, onSelect }: CorrelationHeatmapProps) {
  const items = indicators.slice(0, 5)
  const [viewMode, setViewMode] = useState<ViewMode>('bar')

  const { matrix, sampleCounts } = useMemo(() => {
    const mat: number[][] = []
    const counts: number[][] = []
    for (let i = 0; i < items.length; i++) {
      const row: number[] = []
      const countRow: number[] = []
      const aData = dataMap[items[i].id] ?? []
      for (let j = 0; j < items.length; j++) {
        if (i === j) { row.push(1); countRow.push(0); continue }
        const bData = dataMap[items[j].id] ?? []
        // 1) 날짜 기준으로 두 시계열 매칭
        const { aValues, bValues } = alignByDate(aData, bData)
        // 2) 가격 → 일별 수익률로 변환
        const aReturns = toReturns(aValues)
        const bReturns = toReturns(bValues)
        // 3) 수익률 간 피어슨 상관계수
        row.push(pearson(aReturns, bReturns))
        countRow.push(aReturns.length)
      }
      mat.push(row)
      counts.push(countRow)
    }
    return { matrix: mat, sampleCounts: counts }
  }, [items, dataMap])

  // Selected indicator's correlations with others (sorted by abs value)
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
    <div className="rounded-xl border border-border-dim bg-surface p-5 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-start justify-between mb-1">
        <h3 className="text-[13px] font-medium text-heading">지표 간 상관관계</h3>
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
      <p className="text-[11px] text-muted mb-3">
        {selectedName
          ? `${selectedName}과(와) 다른 지표의 상관관계`
          : '지표를 클릭하면 관계가 시각화됩니다'}
      </p>

      {items.length === 0 ? (
        <p className="text-faint text-xs text-center py-4">데이터를 불러오는 중...</p>
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
                    {/* Name + value row */}
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[12px] text-heading font-medium">{shortName(ind.name)}</span>
                      <span className="text-[11px] font-mono" style={{ color: strength.color }}>
                        {corr >= 0 ? '+' : ''}{corr.toFixed(2)}
                      </span>
                    </div>
                    {/* Bar */}
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
                    {/* Strength + confidence */}
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-[10px] text-faint">{strength.text}</p>
                      <p className="text-[9px]" style={{ color: confidence.color }}>
                        n={samples} · {confidence.label}
                      </p>
                    </div>
                  </div>
                )
              })}
              {/* Relationship description */}
              {selectedCorrelations.length > 0 && (
                <div className="mt-auto pt-2 border-t border-border-dim">
                  <p className="text-[11px] text-muted leading-relaxed">
                    {getRelationDescription(
                      selectedName ?? '',
                      selectedCorrelations[0].indicator.name,
                      selectedCorrelations[0].corr,
                    )}
                  </p>
                  <p className="text-[10px] text-faint mt-1">
                    * 일별 수익률 기반 피어슨 상관계수 (가격 수준이 아닌 변화율 비교)
                  </p>
                </div>
              )}
            </>
          ) : (
            /* No selection: show clickable indicator list */
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
        /* ── Matrix View ── */
        <div className="flex-1 min-h-0 overflow-auto">
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
                  const abs = Math.abs(val)
                  // Color: positive = blue, negative = red/orange, diagonal = accent
                  let bg: string
                  let textColor: string
                  if (i === j) {
                    bg = 'var(--corr-strong)'
                    textColor = 'var(--corr-strong-text)'
                  } else if (val >= 0) {
                    bg = abs > 0.5 ? 'var(--corr-mid)' : abs > 0.2 ? 'var(--corr-weak)' : 'var(--corr-none)'
                    textColor = abs > 0.5 ? 'var(--corr-mid-text)' : abs > 0.2 ? 'var(--corr-weak-text)' : 'var(--corr-none-text)'
                  } else {
                    // Negative correlations use warm tones
                    bg = abs > 0.5
                      ? 'rgba(226,75,74,0.25)'
                      : abs > 0.2 ? 'rgba(226,75,74,0.12)' : 'var(--corr-none)'
                    textColor = abs > 0.5
                      ? '#E24B4A'
                      : abs > 0.2 ? '#E24B4A' : 'var(--corr-none-text)'
                  }
                  return (
                    <div
                      key={`cell-${i}-${j}`}
                      className={cn(
                        'h-7 rounded flex items-center justify-center text-[10px] font-medium transition-opacity cursor-pointer',
                        !isHighlighted && selectedId != null && 'opacity-30',
                      )}
                      style={{ background: bg, color: textColor }}
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
