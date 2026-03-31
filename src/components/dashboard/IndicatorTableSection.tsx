import { Tabs, PeriodPills, CATEGORY_ICONS, fmtNum, chgColor, chgText } from './primitives'
import type { PeriodId, IndicatorGroup } from './primitives'

interface Props {
  groups: IndicatorGroup
  activeTab: string
  onTabChange: (id: string) => void
  localPeriod: PeriodId | null
  effectivePeriod: PeriodId
  onLocalChange: (p: PeriodId) => void
  onReset: () => void
}

export function IndicatorTableSection({
  groups,
  activeTab,
  onTabChange,
  localPeriod,
  effectivePeriod,
  onLocalChange,
  onReset,
}: Props) {
  const rows = groups[activeTab] ?? []
  return (
    <div className="card" style={{ animationDelay: '0.45s' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 0 }}>
        <Tabs
          tabs={Object.keys(groups).map(cat => ({ id: cat, label: `${CATEGORY_ICONS[cat] || ''} ${cat}` }))}
          active={activeTab}
          onChange={onTabChange}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
          {localPeriod && (
            <span style={{ fontSize: 9, color: '#4F46E5', background: '#EEF2FF', padding: '1px 5px', borderRadius: 3, fontWeight: 600 }}>LOCAL</span>
          )}
          <PeriodPills active={effectivePeriod} onChange={onLocalChange} size="sm" showReset={!!localPeriod} onReset={onReset} />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 80px 70px', padding: '0 0 8px', gap: 8, borderBottom: '1px solid #E2E8F0' }}>
        {['Name', 'Value', 'Change', 'Unit'].map((h, i) => (
          <span key={h} style={{ fontSize: 10, color: '#94A3B8', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', textAlign: i > 0 ? 'right' : 'left' }}>
            {h}
          </span>
        ))}
      </div>
      {rows.map((item, i) => (
        <div key={item.indicator.id} className="stock-row" style={{ animation: 'fadeUp 0.3s ease both', animationDelay: `${0.5 + i * 0.03}s` }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500, color: '#1E293B' }}>{item.indicator.name}</div>
            <div style={{ fontSize: 10, color: '#94A3B8', fontFamily: "'DM Mono', monospace" }}>{item.indicator.symbol}</div>
          </div>
          <div style={{ textAlign: 'right', fontFamily: "'DM Mono', monospace", fontSize: 13, fontWeight: 500, color: '#0F172A' }}>
            {item.latest ? fmtNum(item.latest.value) : '--'}
          </div>
          <div style={{ textAlign: 'right', fontSize: 12, fontWeight: 600, color: chgColor(item.change) }}>{chgText(item.change)}</div>
          <div style={{ textAlign: 'right', fontSize: 11, color: '#94A3B8' }}>{item.indicator.unit}</div>
        </div>
      ))}
      {rows.length === 0 && (
        <div style={{ textAlign: 'center', color: '#94A3B8', fontSize: 13, padding: 32 }}>No data available</div>
      )}
    </div>
  )
}
