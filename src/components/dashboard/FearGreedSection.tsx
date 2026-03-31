import type { IndicatorItem } from '@/hooks/useDashboardData'
import { fmtNum, chgColor } from './constants'

function MiniBar({ value, max = 100 }: { value: number; max?: number }) {
  const pct = Math.min(Math.max((value / max) * 100, 0), 100)
  const c = value <= 25 ? '#DC2626' : value <= 45 ? '#D97706' : value <= 55 ? '#9CA3AF' : value <= 75 ? '#65A30D' : '#16A34A'
  return (
    <div className="w-full h-[5px] rounded bg-slate-100 overflow-hidden">
      <div className="h-full rounded transition-[width] duration-1000 ease-out" style={{ width: `${pct}%`, background: c }} />
    </div>
  )
}

function FearGreedGauge({ value }: { value: number }) {
  const label = value <= 25 ? 'Extreme Fear' : value <= 45 ? 'Fear' : value <= 55 ? 'Neutral' : value <= 75 ? 'Greed' : 'Extreme Greed'
  const c = value <= 25 ? '#DC2626' : value <= 45 ? '#D97706' : value <= 55 ? '#9CA3AF' : value <= 75 ? '#65A30D' : '#16A34A'
  const angle = (value / 100) * 180 - 90
  return (
    <div className="text-center">
      <svg width="152" height="86" viewBox="0 0 152 86">
        <defs>
          <linearGradient id="g-arc" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#DC2626" /><stop offset="25%" stopColor="#D97706" />
            <stop offset="50%" stopColor="#9CA3AF" /><stop offset="75%" stopColor="#65A30D" />
            <stop offset="100%" stopColor="#16A34A" />
          </linearGradient>
        </defs>
        <path d="M 12 76 A 64 64 0 0 1 140 76" fill="none" stroke="#F1F5F9" strokeWidth="10" strokeLinecap="round" />
        <path d="M 12 76 A 64 64 0 0 1 140 76" fill="none" stroke="url(#g-arc)" strokeWidth="8" strokeLinecap="round" />
        <line
          x1="76" y1="76"
          x2={76 + Math.cos((angle * Math.PI) / 180) * 46}
          y2={76 + Math.sin((angle * Math.PI) / 180) * 46}
          stroke={c} strokeWidth="2" strokeLinecap="round"
        />
        <circle cx="76" cy="76" r="3.5" fill={c} />
      </svg>
      <div className="text-[26px] font-bold font-mono -mt-0.5" style={{ color: c }}>{value}</div>
      <div className="text-[10px] text-slate-400 mt-0.5 tracking-widest uppercase font-medium">{label}</div>
    </div>
  )
}

interface Props {
  macroIndicators: IndicatorItem[]
}

export function FearGreedSection({ macroIndicators }: Props) {
  return (
    <div className="card flex flex-col items-center justify-center" style={{ animationDelay: '0.4s' }}>
      <h3 className="text-[10px] font-semibold text-slate-400 mb-3 tracking-widest uppercase">
        Fear & Greed Index
      </h3>
      <FearGreedGauge value={28} />
      <div className="mt-4 w-full flex flex-col gap-2.5">
        {macroIndicators.slice(0, 2).map((m) => (
          <div key={m.indicator.id}>
            <div className="flex justify-between text-[11px] text-slate-500 mb-1">
              <span className="font-medium">{m.indicator.symbol}</span>
              <span className="font-semibold font-mono" style={{ color: chgColor(m.change) }}>
                {m.latest ? fmtNum(m.latest.value) : '--'}
              </span>
            </div>
            <MiniBar value={50 + m.change * 2} />
          </div>
        ))}
      </div>
    </div>
  )
}
