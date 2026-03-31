import { CardHeader, CATEGORY_COLORS, CATEGORY_ICONS, fmtNum, chgColor } from './primitives'
import type { PeriodId, IndicatorGroupItem } from './primitives'

interface Props {
  commodityIndicators: IndicatorGroupItem[]
  localPeriod: PeriodId | null
  onLocalChange: (p: PeriodId) => void
  onReset: () => void
  globalPeriod: PeriodId
}

export function CommoditiesSection({ commodityIndicators, localPeriod, onLocalChange, onReset, globalPeriod }: Props) {
  return (
    <div className="card" style={{ animationDelay: '0.3s' }}>
      <CardHeader title="Commodities" localPeriod={localPeriod} onLocalChange={onLocalChange} onReset={onReset} globalPeriod={globalPeriod} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {commodityIndicators.length === 0 ? (
          <div style={{ color: '#94A3B8', fontSize: 12, textAlign: 'center', padding: 20 }}>No data</div>
        ) : commodityIndicators.slice(0, 4).map(c => (
          <div key={c.indicator.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 8,
              background: `${CATEGORY_COLORS.COMMODITY}0D`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 700, color: CATEGORY_COLORS.COMMODITY,
              flexShrink: 0, border: `1px solid ${CATEGORY_COLORS.COMMODITY}20`,
            }}>
              {CATEGORY_ICONS.COMMODITY}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#1E293B' }}>{c.indicator.name}</span>
                <span style={{ fontSize: 13, fontFamily: "'DM Mono', monospace", fontWeight: 500, color: '#0F172A' }}>
                  {c.latest ? fmtNum(c.latest.value) : '--'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3 }}>
                <span style={{ fontSize: 10, color: '#94A3B8' }}>{c.indicator.unit}</span>
                <span style={{ fontSize: 10, fontWeight: 600, color: chgColor(c.change) }}>
                  {c.change >= 0 ? '▲' : '▼'} {Math.abs(c.change).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
