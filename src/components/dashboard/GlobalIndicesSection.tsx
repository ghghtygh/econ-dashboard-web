import type { IndicatorItem } from '@/hooks/useDashboardData'
import type { PeriodId } from './constants'
import { fmtNum, chgColor, chgText } from './constants'
import { PeriodPills } from './PeriodPills'
import { Sparkline } from './Sparkline'

interface Props {
  items: IndicatorItem[]
  localPeriod: PeriodId | null
  effectivePeriod: PeriodId
  onLocalChange: (p: PeriodId) => void
  onReset: () => void
}

export function GlobalIndicesSection({ items, localPeriod, effectivePeriod, onLocalChange, onReset }: Props) {
  return (
    <>
      <div className="flex justify-between items-center mb-2.5">
        <div className="flex items-center gap-2">
          <h3 className="text-[13px] font-semibold text-slate-600">Global Indices</h3>
          {localPeriod && (
            <span className="text-[9px] text-indigo-600 bg-indigo-50 px-1.5 py-px rounded font-semibold tracking-wide">
              LOCAL
            </span>
          )}
        </div>
        <PeriodPills
          active={effectivePeriod}
          onChange={onLocalChange}
          size="sm"
          showReset={!!localPeriod}
          onReset={onReset}
        />
      </div>
      <div
        className="grid gap-3 mb-5"
        style={{ gridTemplateColumns: `repeat(${Math.min(items.length || 1, 6)}, 1fr)` }}
      >
        {items.length === 0 ? (
          <div className="card col-span-full text-center text-slate-400 text-[13px]">
            Loading indicators...
          </div>
        ) : (
          items.map((item, i) => {
            const sparkData = item.series.map((d) => d.value)
            return (
              <div
                key={item.indicator.id}
                className="card !p-4"
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[11px] text-slate-400 font-semibold tracking-wide">
                    {item.indicator.symbol}
                  </span>
                  <span
                    className="badge"
                    style={{
                      background: item.change >= 0 ? '#F0FDF4' : '#FEF2F2',
                      color: chgColor(item.change),
                    }}
                  >
                    {chgText(item.change)}
                  </span>
                </div>
                <div className="text-lg font-bold font-mono text-slate-900 tracking-tight">
                  {item.latest ? fmtNum(item.latest.value) : '--'}
                </div>
                <div className="mt-2.5">
                  <Sparkline data={sparkData} color={chgColor(item.change)} width={120} height={24} />
                </div>
              </div>
            )
          })
        )}
      </div>
    </>
  )
}
