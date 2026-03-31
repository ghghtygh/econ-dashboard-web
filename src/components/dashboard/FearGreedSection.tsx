import { useMemo } from 'react'
import { FearGreedGauge, MiniBar } from './primitives'
import { fmtNum, chgColor, chgText } from './primitives.helpers'
import type { IndicatorGroupItem } from './primitives.helpers'

interface Props {
  macroIndicators: IndicatorGroupItem[]
}

function computeFearGreed(indicators: IndicatorGroupItem[]): { value: number; missingSymbols: string[] } {
  if (indicators.length === 0) return { value: 50, missingSymbols: [] }
  const scores: number[] = []
  const missingSymbols: string[] = []
  for (const m of indicators) {
    if (!m.latest) {
      missingSymbols.push(m.indicator.symbol)
      continue
    }
    const sym = m.indicator.symbol
    if (sym === 'USCPI' || sym === 'CPIAUCSL') {
      scores.push(m.latest.value <= 2 ? 70 : m.latest.value <= 3 ? 50 : m.latest.value <= 5 ? 30 : 15)
    } else if (sym === 'US10Y') {
      scores.push(m.latest.value <= 3 ? 65 : m.latest.value <= 4 ? 50 : m.latest.value <= 5 ? 35 : 20)
    } else if (sym === 'FFR' || sym === 'BOK_BASE_RATE') {
      scores.push(m.latest.value <= 2 ? 70 : m.latest.value <= 4 ? 50 : m.latest.value <= 5.5 ? 30 : 15)
    } else if (sym === 'UNRATE') {
      scores.push(m.latest.value <= 4 ? 65 : m.latest.value <= 5 ? 50 : m.latest.value <= 6 ? 35 : 20)
    } else {
      scores.push(50 + m.change * 2)
    }
  }
  if (scores.length === 0) return { value: 50, missingSymbols }
  const avg = scores.reduce((s, v) => s + v, 0) / scores.length
  return { value: Math.max(0, Math.min(100, Math.round(avg))), missingSymbols }
}

export function FearGreedSection({ macroIndicators }: Props) {
  const { value: fgValue, missingSymbols } = useMemo(() => computeFearGreed(macroIndicators), [macroIndicators])

  return (
    <div className="card" style={{ animationDelay: '0.4s', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <h2 style={{ fontSize: 10, fontWeight: 600, color: '#64748B', marginBottom: 12, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
        Fear &amp; Greed Index
      </h2>
      <FearGreedGauge value={fgValue} />
      {missingSymbols.length > 0 && (
        <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 6, textAlign: 'center' }} role="status">
          ⚠ 일부 지표 데이터 없음: {missingSymbols.join(', ')}
        </div>
      )}
      <div style={{ marginTop: 18, width: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {macroIndicators.map(m => (
          <div key={m.indicator.id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#64748B', marginBottom: 4 }}>
              <span style={{ fontWeight: 500 }}>{m.indicator.symbol}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ fontWeight: 600, fontFamily: "'DM Mono', monospace", color: chgColor(m.change) }}>
                  {m.latest ? fmtNum(m.latest.value) : '--'}
                </span>
                <span style={{ fontSize: 9, fontWeight: 600, color: chgColor(m.change) }}>
                  {m.change >= 0 ? '▲' : '▼'} {chgText(m.change)}
                </span>
              </span>
            </div>
            <MiniBar value={50 + m.change * 2} />
          </div>
        ))}
      </div>
    </div>
  )
}
