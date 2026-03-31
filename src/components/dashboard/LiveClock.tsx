import { useState, useEffect, memo } from 'react'

const fmt = (d: Date) =>
  d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })

const fmtDate = (d: Date) =>
  d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })

export const LiveClock = memo(function LiveClock() {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    let id: ReturnType<typeof setInterval> | null = setInterval(() => setTime(new Date()), 1000)
    const handleVisibility = () => {
      if (document.hidden) {
        if (id) { clearInterval(id); id = null }
      } else {
        setTime(new Date())
        if (!id) id = setInterval(() => setTime(new Date()), 1000)
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => {
      if (id) clearInterval(id)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [])

  return (
    <div className="db-time-row">
      <span className="dot-live" aria-hidden="true" />
      <span className="db-clock" aria-label={`현재 시각 ${fmt(time)}`} role="timer">{fmt(time)}</span>
      <span className="db-time-sep" aria-hidden="true">·</span>
      <span>{fmtDate(time)}</span>
    </div>
  )
})
