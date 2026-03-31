import { useClock } from '@/hooks/useClock'
import { AlertBanner } from './AlertBanner'

const fmt = (d: Date) =>
  d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })

const fmtDate = (d: Date) =>
  d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })

interface Props {
  title: string
}

export function DashboardHeader({ title }: Props) {
  const time = useClock()

  return (
    <>
      <AlertBanner />
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight text-slate-900 mb-1.5">
            {title}
          </h1>
          <div className="flex items-center gap-2 text-slate-400 text-[13px]">
            <span className="dot-live" />
            <span className="font-mono font-medium text-slate-500">{fmt(time)}</span>
            <span className="text-slate-300">·</span>
            <span>{fmtDate(time)}</span>
          </div>
        </div>
      </div>
    </>
  )
}

export function DashboardFooter() {
  const time = useClock()

  return (
    <div className="mt-7 pt-3.5 border-t border-slate-200 flex justify-between">
      <span className="text-[11px] text-slate-400">Market Pulse Dashboard — Data from API</span>
      <span className="text-[11px] text-slate-400 font-mono">Last refreshed: {fmt(time)}</span>
    </div>
  )
}
