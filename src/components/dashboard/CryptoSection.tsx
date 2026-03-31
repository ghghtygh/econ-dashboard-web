import type { IndicatorItem } from '@/hooks/useDashboardData'
import type { PeriodId } from './constants'
import { fmtNum, chgColor, chgText, CATEGORY_COLORS, CATEGORY_ICONS } from './constants'
import { CardHeader } from './CommoditySection'
import { Sparkline } from './Sparkline'

interface Props {
  items: IndicatorItem[]
  localPeriod: PeriodId | null
  globalPeriod: PeriodId
  onLocalChange: (p: PeriodId) => void
  onReset: () => void
}

export function CryptoSection({ items, localPeriod, globalPeriod, onLocalChange, onReset }: Props) {
  return (
    <div className="card" style={{ animationDelay: '0.35s' }}>
      <CardHeader
        title="Cryptocurrency"
        localPeriod={localPeriod}
        onLocalChange={onLocalChange}
        onReset={onReset}
        globalPeriod={globalPeriod}
      />
      <div className="grid grid-cols-2 gap-2.5">
        {items.length === 0 ? (
          <div className="col-span-full text-slate-400 text-xs text-center py-5">No data</div>
        ) : (
          items.slice(0, 4).map((c) => {
            const sparkData = c.series.map((d) => d.value)
            return (
              <div
                key={c.indicator.id}
                className="bg-slate-50 rounded-[10px] p-3.5 border border-slate-200"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold"
                    style={{
                      background: `${CATEGORY_COLORS.CRYPTO}10`,
                      color: CATEGORY_COLORS.CRYPTO,
                      border: `1px solid ${CATEGORY_COLORS.CRYPTO}20`,
                    }}
                  >
                    {CATEGORY_ICONS.CRYPTO}
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-800">{c.indicator.name}</div>
                    <div className="text-[10px] text-slate-400">{c.indicator.symbol}</div>
                  </div>
                </div>
                <div className="text-[17px] font-bold font-mono text-slate-900 tracking-tight">
                  {c.latest ? fmtNum(c.latest.value) : '--'}
                </div>
                <div className="flex justify-between items-end mt-1.5">
                  <span className="text-[11px] font-semibold" style={{ color: chgColor(c.change) }}>
                    {chgText(c.change)}
                  </span>
                </div>
                <div className="mt-1.5">
                  <Sparkline data={sparkData} color={chgColor(c.change)} width={140} height={22} />
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
