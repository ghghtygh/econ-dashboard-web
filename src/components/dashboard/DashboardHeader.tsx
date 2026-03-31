import { useTranslation } from 'react-i18next'
import { useClock } from '@/hooks/useClock'
import { AlertBanner } from './AlertBanner'
import { formatClockTime, formatFullDate } from '@/lib/dateUtils'

interface Props {
  title: string
}

export function DashboardHeader({ title }: Props) {
  useTranslation()
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
            <span className="font-mono font-medium text-slate-500">{formatClockTime(time)}</span>
            <span className="text-slate-300">·</span>
            <span>{formatFullDate(time)}</span>
          </div>
        </div>
      </div>
    </>
  )
}

export function DashboardFooter() {
  const { t } = useTranslation()
  const time = useClock()

  return (
    <div className="mt-7 pt-3.5 border-t border-slate-200 flex justify-between">
      <span className="text-[11px] text-slate-400">{t('dashboard.dataFromApi')}</span>
      <span className="text-[11px] text-slate-400 font-mono">{t('dashboard.lastRefreshed', { time: formatClockTime(time) })}</span>
    </div>
  )
}
