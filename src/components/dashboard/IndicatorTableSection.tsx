import { Tabs, PeriodPills } from './primitives'
import { CATEGORY_ICONS, fmtNum, chgColor, chgText } from './primitives.helpers'
import type { PeriodId, IndicatorGroup } from './primitives.helpers'

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
      <div className="indicator-table-wrap" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <table className="indicator-table" style={{ width: '100%', borderCollapse: 'collapse', minWidth: 400 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
              {['Name', 'Value', 'Change', 'Unit'].map((h, i) => (
                <th
                  key={h}
                  scope="col"
                  style={{
                    fontSize: 10,
                    color: '#94A3B8',
                    fontWeight: 600,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    textAlign: i > 0 ? 'right' : 'left',
                    padding: '0 0 8px',
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((item, i) => (
              <tr key={item.indicator.id} className="stock-row" style={{ animation: 'fadeUp 0.3s ease both', animationDelay: `${0.5 + i * 0.03}s` }}>
                <td style={{ padding: '8px 0' }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: '#1E293B' }}>{item.indicator.name}</div>
                  <div style={{ fontSize: 10, color: '#94A3B8', fontFamily: "'DM Mono', monospace" }}>{item.indicator.symbol}</div>
                </td>
                <td style={{ textAlign: 'right', fontFamily: "'DM Mono', monospace", fontSize: 13, fontWeight: 500, color: '#0F172A', padding: '8px 0' }}>
                  {item.latest ? fmtNum(item.latest.value) : '--'}
                </td>
                <td style={{ textAlign: 'right', fontSize: 12, fontWeight: 600, color: chgColor(item.change), padding: '8px 0' }}>
                  {chgText(item.change)}
                </td>
                <td style={{ textAlign: 'right', fontSize: 11, color: '#94A3B8', padding: '8px 0' }}>
                  {item.indicator.unit}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length === 0 && (
        <div style={{ textAlign: 'center', color: '#94A3B8', fontSize: 13, padding: 32 }}>No data available</div>
      )}
    </div>
  )
}
