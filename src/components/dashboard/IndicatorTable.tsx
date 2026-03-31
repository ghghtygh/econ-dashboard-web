import type { IndicatorItem } from '@/hooks/useDashboardData'
import type { PeriodId } from './constants'
import { fmtNum, chgColor, chgText, CATEGORY_ICONS } from './constants'
import { PeriodPills } from './PeriodPills'

function Tabs({ tabs, active, onChange }: { tabs: { id: string; label: string }[]; active: string; onChange: (id: string) => void }) {
  return (
    <div className="flex gap-0 border-b border-slate-200 mb-4">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={`
            px-4 py-2 text-[13px] bg-transparent border-none cursor-pointer transition-all duration-150 font-inherit
            ${active === t.id
              ? 'font-semibold text-indigo-600 border-b-2 border-b-indigo-600'
              : 'font-normal text-slate-400 border-b-2 border-b-transparent'}
          `}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}

interface Props {
  groups: Record<string, IndicatorItem[]>
  stockTab: string
  onTabChange: (tab: string) => void
  localPeriod: PeriodId | null
  effectivePeriod: PeriodId
  onLocalChange: (p: PeriodId) => void
  onReset: () => void
}

export function IndicatorTable({ groups, stockTab, onTabChange, localPeriod, effectivePeriod, onLocalChange, onReset }: Props) {
  const items = groups[stockTab] ?? []

  return (
    <div className="card" style={{ animationDelay: '0.45s' }}>
      <div className="flex justify-between items-center mb-0">
        <Tabs
          tabs={Object.keys(groups).map((cat) => ({
            id: cat,
            label: `${CATEGORY_ICONS[cat] || ''} ${cat}`,
          }))}
          active={stockTab}
          onChange={onTabChange}
        />
        <div className="flex items-center gap-1.5 mb-4">
          {localPeriod && (
            <span className="text-[9px] text-indigo-600 bg-indigo-50 px-1.5 py-px rounded font-semibold">
              LOCAL
            </span>
          )}
          <PeriodPills
            active={effectivePeriod}
            onChange={onLocalChange}
            size="sm"
            showReset={!!localPeriod}
            onReset={onReset}
          />
        </div>
      </div>
      <div className="grid grid-cols-[1fr_100px_80px_70px] gap-2 pb-2 border-b border-slate-200">
        {['Name', 'Value', 'Change', 'Unit'].map((h, i) => (
          <span
            key={h}
            className={`text-[10px] text-slate-400 font-semibold tracking-wider uppercase ${i > 0 ? 'text-right' : 'text-left'}`}
          >
            {h}
          </span>
        ))}
      </div>
      {items.map((item, i) => (
        <div
          key={item.indicator.id}
          className="stock-row"
          style={{ animation: 'fadeUp 0.3s ease both', animationDelay: `${0.5 + i * 0.03}s` }}
        >
          <div>
            <div className="text-[13px] font-medium text-slate-800">{item.indicator.name}</div>
            <div className="text-[10px] text-slate-400 font-mono">{item.indicator.symbol}</div>
          </div>
          <div className="text-right font-mono text-[13px] font-medium text-slate-900">
            {item.latest ? fmtNum(item.latest.value) : '--'}
          </div>
          <div className="text-right text-xs font-semibold" style={{ color: chgColor(item.change) }}>
            <span className="sr-only">{item.change >= 0 ? '상승' : '하락'}</span>
            {chgText(item.change)}
          </div>
          <div className="text-right text-[11px] text-slate-400">{item.indicator.unit}</div>
        </div>
      ))}
      {items.length === 0 && (
        <div className="text-center text-slate-400 text-[13px] py-8">No data available</div>
      )}
    </div>
  )
}
