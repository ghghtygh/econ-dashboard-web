import { Sparkline, PeriodPills, fmtNum, chgColor, chgText } from './primitives'
import type { PeriodId, IndicatorGroupItem } from './primitives'

interface Props {
  topIndices: IndicatorGroupItem[]
  localPeriod: PeriodId | null
  effectivePeriod: PeriodId
  onLocalChange: (p: PeriodId) => void
  onReset: () => void
}

export function GlobalIndicesSection({ topIndices, localPeriod, effectivePeriod, onLocalChange, onReset }: Props) {
  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <h3 style={{ fontSize: 13, fontWeight: 600, color: '#475569' }}>Global Indices</h3>
          {localPeriod && (
            <span style={{ fontSize: 9, color: '#4F46E5', background: '#EEF2FF', padding: '1px 5px', borderRadius: 3, fontWeight: 600 }}>LOCAL</span>
          )}
        </div>
        <PeriodPills active={effectivePeriod} onChange={onLocalChange} size="sm" showReset={!!localPeriod} onReset={onReset} />
      </div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${Math.min(topIndices.length || 1, 6)}, 1fr)`,
        gap: 12,
        marginBottom: 20,
      }}>
        {topIndices.length === 0 ? (
          <div className="card" style={{ gridColumn: '1/-1', textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>
            Loading indicators...
          </div>
        ) : topIndices.map((item, i) => {
          const sparkData = item.series.map(d => d.value)
          return (
            <div key={item.indicator.id} className="card" style={{ padding: 16, animationDelay: `${i * 0.05}s` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600, letterSpacing: '0.03em' }}>{item.indicator.symbol}</span>
                <span className="badge" style={{ background: item.change >= 0 ? '#F0FDF4' : '#FEF2F2', color: chgColor(item.change) }}>
                  {chgText(item.change)}
                </span>
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, fontFamily: "'DM Mono', monospace", color: '#0F172A', letterSpacing: '-0.02em' }}>
                {item.latest ? fmtNum(item.latest.value) : '--'}
              </div>
              <div style={{ marginTop: 10 }}>
                <Sparkline data={sparkData} color={chgColor(item.change)} width={120} height={24} />
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}
