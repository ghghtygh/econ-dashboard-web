import { useState, useEffect, useMemo } from 'react'
import { Clock, Calendar, ChevronRight } from 'lucide-react'
import { ECONOMIC_EVENTS, EVENT_CATEGORY_COLORS, IMPORTANCE_LABELS } from '@/data/economicCalendar'
import { useUpcomingEvents } from '@/hooks/useCalendar'
import type { EconomicEvent, EventImportance } from '@/types/calendar'

function normalizeApiEvent(ev: Record<string, unknown>): EconomicEvent {
  const eventDate = String(ev.eventDate ?? '')
  return {
    id: String(ev.id),
    title: String(ev.title ?? ''),
    date: eventDate.slice(0, 10),
    time: eventDate.length > 10 ? eventDate.slice(11, 16) : undefined,
    importance: (String(ev.importance ?? 'medium').toLowerCase()) as EventImportance,
    category: String(ev.country ?? ev.category ?? ''),
    description: String(ev.description ?? ''),
    actual: ev.actual ? String(ev.actual) : undefined,
    forecast: ev.forecast ? String(ev.forecast) : undefined,
    previous: ev.previous ? String(ev.previous) : undefined,
    status: 'upcoming',
  }
}

function getTimeUntil(dateStr: string, timeStr?: string) {
  const dateTime = timeStr
    ? new Date(`${dateStr}T${timeStr}:00`)
    : new Date(`${dateStr}T00:00:00`)
  const now = new Date()
  const diff = dateTime.getTime() - now.getTime()

  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 }

  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((diff % (1000 * 60)) / 1000),
    total: diff,
  }
}

function CountdownUnit({ value, label }: { value: number; label: string }) {
  return (
    <div style={{ textAlign: 'center', minWidth: 44 }}>
      <div style={{
        fontSize: 20, fontWeight: 700, fontFamily: "'DM Mono', monospace",
        color: '#0F172A', letterSpacing: '-0.02em', lineHeight: 1.2,
      }}>
        {String(value).padStart(2, '0')}
      </div>
      <div style={{ fontSize: 9, color: '#94A3B8', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {label}
      </div>
    </div>
  )
}

function CountdownSeparator() {
  return (
    <span style={{ fontSize: 18, fontWeight: 700, color: '#CBD5E1', fontFamily: "'DM Mono', monospace", lineHeight: 1 }}>:</span>
  )
}

export function EventCountdown() {
  const [, setTick] = useState(0)
  const { data: apiData } = useUpcomingEvents(0, 5)

  const upcomingEvents = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10)

    if (apiData?.content && apiData.content.length > 0) {
      return apiData.content
        .map(ev => normalizeApiEvent(ev as unknown as Record<string, unknown>))
        .filter(e => e.date >= todayStr)
        .slice(0, 5)
    }

    return ECONOMIC_EVENTS
      .filter(e => e.date >= todayStr && e.status === 'upcoming')
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 5)
  }, [apiData])

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000)
    return () => clearInterval(id)
  }, [])

  const nextEvent = upcomingEvents[0]
  if (!nextEvent) return null

  const countdown = getTimeUntil(nextEvent.date, nextEvent.time)
  const impInfo = IMPORTANCE_LABELS[nextEvent.importance]
  const catColor = EVENT_CATEGORY_COLORS[nextEvent.category] ?? '#64748b'

  return (
    <div className="card" style={{ padding: 20, animationDelay: '0.5s' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <Calendar size={14} style={{ color: '#4F46E5' }} />
        <h3 style={{ fontSize: 13, fontWeight: 600, color: '#475569' }}>다음 경제 이벤트</h3>
      </div>

      {/* Featured next event */}
      <div style={{
        background: 'linear-gradient(135deg, #EEF2FF 0%, #F8FAFC 100%)',
        borderRadius: 10, padding: 16, marginBottom: 14,
        border: '1px solid #E0E7FF',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
          <span style={{
            display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
            background: catColor, flexShrink: 0,
          }} />
          <span style={{ fontSize: 14, fontWeight: 600, color: '#1E293B', flex: 1 }}>
            {nextEvent.title}
          </span>
          <span style={{
            fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 4,
            background: impInfo.color + '18', color: impInfo.color,
          }}>
            {impInfo.label}
          </span>
        </div>

        {/* Countdown */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, padding: '8px 0' }}>
          <CountdownUnit value={countdown.days} label="일" />
          <CountdownSeparator />
          <CountdownUnit value={countdown.hours} label="시간" />
          <CountdownSeparator />
          <CountdownUnit value={countdown.minutes} label="분" />
          <CountdownSeparator />
          <CountdownUnit value={countdown.seconds} label="초" />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 8 }}>
          <Clock size={11} style={{ color: '#94A3B8' }} />
          <span style={{ fontSize: 11, color: '#64748B' }}>
            {new Date(nextEvent.date + 'T00:00:00').toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })}
            {nextEvent.time && ` ${nextEvent.time} KST`}
          </span>
        </div>
      </div>

      {/* Upcoming list */}
      {upcomingEvents.length > 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {upcomingEvents.slice(1).map(ev => {
            const evCountdown = getTimeUntil(ev.date, ev.time)
            const evCatColor = EVENT_CATEGORY_COLORS[ev.category] ?? '#64748b'
            return (
              <div key={ev.id} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 10px', borderRadius: 8,
                background: '#F8FAFC', border: '1px solid #F1F5F9',
              }}>
                <span style={{
                  width: 6, height: 6, borderRadius: '50%', background: evCatColor, flexShrink: 0,
                }} />
                <span style={{ fontSize: 12, fontWeight: 500, color: '#1E293B', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {ev.title}
                </span>
                <span style={{ fontSize: 10, fontFamily: "'DM Mono', monospace", color: '#64748B', flexShrink: 0 }}>
                  {evCountdown.days > 0 ? `${evCountdown.days}일` : `${evCountdown.hours}시간`}
                </span>
                <ChevronRight size={12} style={{ color: '#CBD5E1', flexShrink: 0 }} />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
