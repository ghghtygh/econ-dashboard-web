import { CardHeader, Sparkline, CATEGORY_COLORS, CATEGORY_ICONS, fmtNum, chgColor, chgText } from './primitives'
import type { PeriodId, IndicatorGroupItem } from './primitives'

interface Props {
  cryptoIndicators: IndicatorGroupItem[]
  localPeriod: PeriodId | null
  onLocalChange: (p: PeriodId) => void
  onReset: () => void
  globalPeriod: PeriodId
}

export function CryptoSection({ cryptoIndicators, localPeriod, onLocalChange, onReset, globalPeriod }: Props) {
  return (
    <div className="card" style={{ animationDelay: '0.35s' }}>
      <CardHeader title="Cryptocurrency" localPeriod={localPeriod} onLocalChange={onLocalChange} onReset={onReset} globalPeriod={globalPeriod} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {cryptoIndicators.length === 0 ? (
          <div style={{ gridColumn: '1/-1', color: '#94A3B8', fontSize: 12, textAlign: 'center', padding: 20 }}>No data</div>
        ) : cryptoIndicators.slice(0, 4).map(c => {
          const sparkData = c.series.map(d => d.value)
          return (
            <div key={c.indicator.id} style={{ background: '#F8FAFC', borderRadius: 10, padding: 14, border: '1px solid #E2E8F0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: `${CATEGORY_COLORS.CRYPTO}10`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, fontWeight: 700, color: CATEGORY_COLORS.CRYPTO,
                  border: `1px solid ${CATEGORY_COLORS.CRYPTO}20`,
                }}>
                  {CATEGORY_ICONS.CRYPTO}
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#1E293B' }}>{c.indicator.name}</div>
                  <div style={{ fontSize: 10, color: '#94A3B8' }}>{c.indicator.symbol}</div>
                </div>
              </div>
              <div style={{ fontSize: 17, fontWeight: 700, fontFamily: "'DM Mono', monospace", color: '#0F172A', letterSpacing: '-0.02em' }}>
                {c.latest ? fmtNum(c.latest.value) : '--'}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: chgColor(c.change) }}>{chgText(c.change)}</span>
              </div>
              <div style={{ marginTop: 6 }}>
                <Sparkline data={sparkData} color={chgColor(c.change)} width={140} height={22} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
