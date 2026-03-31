import { FearGreedGauge, MiniBar, fmtNum, chgColor } from './primitives'
import type { IndicatorGroupItem } from './primitives'

interface Props {
  macroIndicators: IndicatorGroupItem[]
}

export function FearGreedSection({ macroIndicators }: Props) {
  return (
    <div className="card" style={{ animationDelay: '0.4s', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <h3 style={{ fontSize: 10, fontWeight: 600, color: '#94A3B8', marginBottom: 12, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
        Fear &amp; Greed Index
      </h3>
      <FearGreedGauge value={28} />
      <div style={{ marginTop: 18, width: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {macroIndicators.slice(0, 2).map(m => (
          <div key={m.indicator.id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#64748B', marginBottom: 4 }}>
              <span style={{ fontWeight: 500 }}>{m.indicator.symbol}</span>
              <span style={{ fontWeight: 600, fontFamily: "'DM Mono', monospace", color: chgColor(m.change) }}>
                {m.latest ? fmtNum(m.latest.value) : '--'}
              </span>
            </div>
            <MiniBar value={50 + m.change * 2} />
          </div>
        ))}
      </div>
    </div>
  )
}
