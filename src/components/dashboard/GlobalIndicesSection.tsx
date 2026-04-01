import { useState } from 'react'
import { Sparkline, PeriodPills } from './primitives'
import { fmtNum, chgColor, chgText } from './primitives.helpers'
import { IndicatorDetailModal } from './IndicatorDetailModal'
import { GlobalIndicesCardSkeleton } from '@/components/ui/Skeleton'
import type { PeriodId, IndicatorGroupItem } from './primitives.helpers'

interface Props {
  topIndices: IndicatorGroupItem[]
  localPeriod: PeriodId | null
  effectivePeriod: PeriodId
  onLocalChange: (p: PeriodId) => void
  onReset: () => void
}

export function GlobalIndicesSection({ topIndices, localPeriod, effectivePeriod, onLocalChange, onReset }: Props) {
  const [selected, setSelected] = useState<IndicatorGroupItem | null>(null)

  return (
    <>
      <div className="flex justify-between items-center mb-3.5">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-slate-600">Global Indices</h2>
          {localPeriod && (
            <span className="text-[10px] text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-sm font-semibold">LOCAL</span>
          )}
        </div>
        <PeriodPills active={effectivePeriod} onChange={onLocalChange} size="sm" showReset={!!localPeriod} onReset={onReset} />
      </div>
      <div
        className="grid gap-4 mb-7"
        style={{ gridTemplateColumns: `repeat(${Math.min(topIndices.length || 1, 6)}, 1fr)` }}
      >
        {topIndices.length === 0 ? (
          <GlobalIndicesCardSkeleton />
        ) : topIndices.map((item, i) => {
          const sparkData = item.series.map(d => d.value)
          return (
            <button
              key={item.indicator.id}
              className="card p-5 cursor-pointer text-left w-full transition-[transform,box-shadow] duration-150 ease-in-out hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)]"
              onClick={() => setSelected(item)}
              aria-label={`${item.indicator.name} ${item.latest ? fmtNum(item.latest.value) : ''} ${chgText(item.change)}`}
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <div className="flex justify-between items-center mb-2.5">
                <span className="text-xs text-slate-500 font-semibold tracking-wide">{item.indicator.symbol}</span>
                <span className="badge" style={{ background: item.change >= 0 ? '#F0FDF4' : '#FEF2F2', color: chgColor(item.change) }}>
                  {chgText(item.change)}
                </span>
              </div>
              <div className="text-lg font-bold font-mono text-slate-900 tracking-tight">
                {item.latest ? fmtNum(item.latest.value) : '--'}
              </div>
              <div className="mt-2.5">
                <Sparkline data={sparkData} color={chgColor(item.change)} width={120} height={24} />
              </div>
            </button>
          )
        })}
      </div>
      <IndicatorDetailModal item={selected} open={!!selected} onClose={() => setSelected(null)} />
    </>
  )
}
