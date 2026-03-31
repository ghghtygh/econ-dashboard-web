import type { IndicatorItem } from '@/hooks/useDashboardData'
import type { PeriodId } from './constants'
import { fmtNum, chgColor, CATEGORY_COLORS, CATEGORY_ICONS } from './constants'
import { PeriodPills } from './PeriodPills'

interface CardHeaderProps {
  title: string
  localPeriod: PeriodId | null
  onLocalChange: (p: PeriodId) => void
  onReset: () => void
  globalPeriod: PeriodId
  children?: React.ReactNode
}

export function CardHeader({ title, localPeriod, onLocalChange, onReset, globalPeriod, children }: CardHeaderProps) {
  const isOverridden = localPeriod !== null
  const effective = localPeriod || globalPeriod
  return (
    <div className="flex justify-between items-center mb-4 min-h-[26px]">
      <div className="flex items-center gap-2">
        <h3 className="text-[13px] font-semibold text-slate-600">{title}</h3>
        {isOverridden && (
          <span className="text-[9px] text-indigo-600 bg-indigo-50 px-1.5 py-px rounded font-semibold tracking-wide">
            LOCAL
          </span>
        )}
      </div>
      <div className="flex items-center gap-1.5">
        {children}
        <PeriodPills active={effective} onChange={onLocalChange} size="sm" showReset={isOverridden} onReset={onReset} />
      </div>
    </div>
  )
}

interface Props {
  items: IndicatorItem[]
  localPeriod: PeriodId | null
  globalPeriod: PeriodId
  onLocalChange: (p: PeriodId) => void
  onReset: () => void
}

export function CommoditySection({ items, localPeriod, globalPeriod, onLocalChange, onReset }: Props) {
  return (
    <div className="card" style={{ animationDelay: '0.3s' }}>
      <CardHeader
        title="Commodities"
        localPeriod={localPeriod}
        onLocalChange={onLocalChange}
        onReset={onReset}
        globalPeriod={globalPeriod}
      />
      <div className="flex flex-col gap-3.5">
        {items.length === 0 ? (
          <div className="text-slate-400 text-xs text-center py-5">No data</div>
        ) : (
          items.slice(0, 4).map((c) => (
            <div key={c.indicator.id} className="flex items-center gap-2.5">
              <div
                className="w-[34px] h-[34px] rounded-lg flex items-center justify-center text-[13px] font-bold shrink-0"
                style={{
                  background: `${CATEGORY_COLORS.COMMODITY}0D`,
                  color: CATEGORY_COLORS.COMMODITY,
                  border: `1px solid ${CATEGORY_COLORS.COMMODITY}20`,
                }}
              >
                {CATEGORY_ICONS.COMMODITY}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-baseline">
                  <span className="text-[13px] font-semibold text-slate-800">{c.indicator.name}</span>
                  <span className="text-[13px] font-mono font-medium text-slate-900">
                    {c.latest ? fmtNum(c.latest.value) : '--'}
                  </span>
                </div>
                <div className="flex justify-between mt-0.5">
                  <span className="text-[10px] text-slate-400">{c.indicator.unit}</span>
                  <span className="text-[10px] font-semibold" style={{ color: chgColor(c.change) }}>
                    {c.change >= 0 ? '▲' : '▼'} {Math.abs(c.change).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
