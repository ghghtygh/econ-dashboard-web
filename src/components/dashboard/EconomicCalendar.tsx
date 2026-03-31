import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, Calendar, List, Clock, X, Loader2, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCalendarEvents } from '@/hooks/useCalendarEvents'
import type { EconomicEvent, EventImportance } from '@/types/calendar'

type ViewMode = 'monthly' | 'list'
type ImportanceFilter = 'all' | 'high' | 'medium'

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']

const EVENT_CATEGORY_COLORS: Record<string, string> = {
  FOMC: '#378ADD',
  CPI: '#E24B4A',
  '고용': '#1D9E75',
  GDP: '#7F77DD',
  PCE: '#EF9F27',
  PMI: '#F59E0B',
  ECB: '#6366F1',
  BOK: '#EC4899',
}

const IMPORTANCE_LABELS: Record<string, { label: string; color: string }> = {
  high: { label: '매우 중요', color: '#E24B4A' },
  medium: { label: '중요', color: '#EF9F27' },
  low: { label: '참고', color: '#94a3b8' },
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`
}

function isSameDay(dateStr: string, year: number, month: number, day: number): boolean {
  const d = new Date(dateStr + 'T00:00:00')
  return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day
}

function toDateStr(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function ImportanceBadge({ importance }: { importance: EventImportance }) {
  const info = IMPORTANCE_LABELS[importance]
  return (
    <span
      className="inline-block rounded-full px-2 py-0.5 text-[11px] font-medium"
      style={{ backgroundColor: info.color + '20', color: info.color }}
    >
      {info.label}
    </span>
  )
}

function CategoryTag({ category }: { category: string }) {
  const color = EVENT_CATEGORY_COLORS[category] ?? '#64748b'
  return (
    <span
      className="inline-block rounded px-1.5 py-0.5 text-[11px] font-medium"
      style={{ backgroundColor: color + '18', color }}
    >
      {category}
    </span>
  )
}

function ValueComparison({ event }: { event: EconomicEvent }) {
  if (!event.actual && !event.forecast && !event.previous) return null
  return (
    <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
      {event.actual != null && (
        <div className="rounded-lg bg-elevated px-2 py-1.5 text-center">
          <div className="text-faint mb-0.5">실제</div>
          <div className="font-semibold text-heading">{event.actual}</div>
        </div>
      )}
      {event.forecast != null && (
        <div className="rounded-lg bg-elevated px-2 py-1.5 text-center">
          <div className="text-faint mb-0.5">예측</div>
          <div className="font-semibold text-heading">{event.forecast}</div>
        </div>
      )}
      {event.previous != null && (
        <div className="rounded-lg bg-elevated px-2 py-1.5 text-center">
          <div className="text-faint mb-0.5">이전</div>
          <div className="font-semibold text-heading">{event.previous}</div>
        </div>
      )}
    </div>
  )
}

function EventDetail({
  event,
  onClose,
}: {
  event: EconomicEvent
  onClose: () => void
}) {
  return (
    <div className="animate-fadeIn rounded-lg border border-border-dim bg-surface p-4">
      <div className="flex items-start justify-between gap-2 mb-3">
        <h4 className="text-base font-semibold text-heading">{event.title}</h4>
        <button
          onClick={onClose}
          className="shrink-0 text-muted hover:text-heading transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-3 text-xs text-muted">
        <span className="flex items-center gap-1">
          <Calendar size={12} />
          {formatDate(event.date)}
        </span>
        {event.time && (
          <span className="flex items-center gap-1">
            <Clock size={12} />
            {event.time} KST
          </span>
        )}
        <CategoryTag category={event.category} />
        <ImportanceBadge importance={event.importance} />
      </div>

      <p className="text-xs leading-relaxed text-muted">{event.description}</p>

      <ValueComparison event={event} />
    </div>
  )
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted">
      <Loader2 size={16} className="animate-spin" />
      데이터를 불러오는 중...
    </div>
  )
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center gap-2 py-12 text-sm text-muted">
      <AlertCircle size={20} />
      <p>캘린더 데이터를 불러오지 못했습니다.</p>
      <button
        onClick={onRetry}
        className="rounded-lg border border-border-dim px-3 py-1 text-xs hover:bg-hover transition-colors"
      >
        다시 시도
      </button>
    </div>
  )
}

// ── Monthly View ──

function MonthlyView({
  events,
  importanceFilter,
}: {
  events: EconomicEvent[]
  importanceFilter: ImportanceFilter
}) {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<EconomicEvent | null>(null)

  const filteredEvents = useMemo(
    () =>
      events.filter(
        (e) => importanceFilter === 'all' || e.importance === importanceFilter,
      ),
    [events, importanceFilter],
  )

  const firstDayOfWeek = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const weeks = useMemo(() => {
    const cells: (number | null)[] = []
    for (let i = 0; i < firstDayOfWeek; i++) cells.push(null)
    for (let d = 1; d <= daysInMonth; d++) cells.push(d)
    while (cells.length % 7 !== 0) cells.push(null)

    const rows: (number | null)[][] = []
    for (let i = 0; i < cells.length; i += 7) {
      rows.push(cells.slice(i, i + 7))
    }
    return rows
  }, [firstDayOfWeek, daysInMonth])

  function eventsForDay(day: number): EconomicEvent[] {
    return filteredEvents.filter((e) => isSameDay(e.date, year, month, day))
  }

  const selectedDayEvents = selectedDay ? eventsForDay(selectedDay) : []

  const isToday = (day: number) =>
    day === today.getDate() &&
    month === today.getMonth() &&
    year === today.getFullYear()

  function navigate(dir: -1 | 1) {
    setSelectedDay(null)
    setSelectedEvent(null)
    const next = new Date(year, month + dir, 1)
    setYear(next.getFullYear())
    setMonth(next.getMonth())
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => navigate(-1)}
          className="rounded-lg p-1.5 text-muted hover:bg-hover hover:text-heading transition-colors"
        >
          <ChevronLeft size={18} />
        </button>
        <span className="text-base font-semibold text-heading">
          {year}년 {month + 1}월
        </span>
        <button
          onClick={() => navigate(1)}
          className="rounded-lg p-1.5 text-muted hover:bg-hover hover:text-heading transition-colors"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAY_LABELS.map((label) => (
          <div
            key={label}
            className="text-center text-[11px] font-medium text-faint py-1"
          >
            {label}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7">
        {weeks.map((week, wi) =>
          week.map((day, di) => {
            if (day === null) {
              return <div key={`${wi}-${di}`} className="p-1" />
            }
            const dayEvents = eventsForDay(day)
            const selected = selectedDay === day
            return (
              <button
                key={`${wi}-${di}`}
                onClick={() => {
                  setSelectedDay(day)
                  setSelectedEvent(null)
                }}
                className={cn(
                  'relative flex flex-col items-center rounded-lg p-1.5 text-xs transition-colors',
                  selected
                    ? 'bg-hover text-heading font-semibold'
                    : 'hover:bg-hover text-body',
                  isToday(day) && !selected && 'ring-2 ring-blue-400/60 ring-offset-1 ring-offset-surface',
                )}
              >
                <span>{day}</span>
                {dayEvents.length > 0 && (
                  <div className="flex gap-0.5 mt-0.5">
                    {dayEvents.slice(0, 3).map((ev) => (
                      <span
                        key={ev.id}
                        className="block h-1.5 w-1.5 rounded-full"
                        style={{
                          backgroundColor:
                            EVENT_CATEGORY_COLORS[ev.category] ?? '#64748b',
                        }}
                      />
                    ))}
                  </div>
                )}
              </button>
            )
          }),
        )}
      </div>

      {/* Selected day events */}
      {selectedDay !== null && (
        <div className="mt-4 space-y-2">
          {selectedDayEvents.length === 0 ? (
            <p className="text-xs text-faint text-center py-3">
              이 날에 예정된 이벤트가 없습니다
            </p>
          ) : selectedEvent ? (
            <EventDetail
              event={selectedEvent}
              onClose={() => setSelectedEvent(null)}
            />
          ) : (
            selectedDayEvents.map((ev) => (
              <button
                key={ev.id}
                onClick={() => setSelectedEvent(ev)}
                className="w-full flex items-center gap-2 rounded-lg border border-border-dim bg-elevated px-3 py-2 text-left text-xs hover:bg-hover transition-colors"
              >
                <span
                  className="block h-2 w-2 shrink-0 rounded-full"
                  style={{
                    backgroundColor:
                      EVENT_CATEGORY_COLORS[ev.category] ?? '#64748b',
                  }}
                />
                <span className="flex-1 font-medium text-heading truncate">
                  {ev.title}
                </span>
                {ev.time && <span className="text-faint">{ev.time}</span>}
                <ImportanceBadge importance={ev.importance} />
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}

// ── List View ──

function ListView({
  events,
  importanceFilter,
}: {
  events: EconomicEvent[]
  importanceFilter: ImportanceFilter
}) {
  const [showPast, setShowPast] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const todayStr = new Date().toISOString().slice(0, 10)

  const filteredEvents = useMemo(() => {
    let list = events.filter(
      (e) => importanceFilter === 'all' || e.importance === importanceFilter,
    )
    if (!showPast) {
      list = list.filter((e) => e.date >= todayStr)
    }
    return list.sort((a, b) => a.date.localeCompare(b.date))
  }, [events, importanceFilter, showPast, todayStr])

  return (
    <div>
      {/* Toggle past events */}
      <div className="flex items-center justify-end mb-3">
        <button
          onClick={() => setShowPast((v) => !v)}
          className={cn(
            'text-[11px] font-medium rounded-full px-3 py-1 transition-colors',
            showPast
              ? 'bg-hover text-heading'
              : 'text-muted hover:text-heading',
          )}
        >
          {showPast ? '과거 이벤트 숨기기' : '과거 이벤트 보기'}
        </button>
      </div>

      {filteredEvents.length === 0 ? (
        <p className="text-xs text-faint text-center py-6">
          조건에 맞는 이벤트가 없습니다
        </p>
      ) : (
        <div className="space-y-2">
          {filteredEvents.map((ev) => {
            const expanded = expandedId === ev.id
            const isPast = ev.date < todayStr
            return (
              <div
                key={ev.id}
                className={cn(
                  'rounded-xl border border-border-dim transition-colors',
                  isPast ? 'opacity-70' : '',
                )}
              >
                <button
                  onClick={() =>
                    setExpandedId(expanded ? null : ev.id)
                  }
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-left text-xs hover:bg-hover rounded-xl transition-colors"
                >
                  {/* Date column */}
                  <div className="shrink-0 w-16 text-center">
                    <div className="text-[11px] text-faint">
                      {new Date(ev.date + 'T00:00:00').toLocaleDateString(
                        'ko-KR',
                        { month: 'short', day: 'numeric' },
                      )}
                    </div>
                    {ev.time && (
                      <div className="text-[10px] text-faint">{ev.time}</div>
                    )}
                  </div>

                  {/* Color dot */}
                  <span
                    className="block h-2 w-2 shrink-0 rounded-full"
                    style={{
                      backgroundColor:
                        EVENT_CATEGORY_COLORS[ev.category] ?? '#64748b',
                    }}
                  />

                  {/* Title */}
                  <span className="flex-1 font-medium text-heading truncate">
                    {ev.title}
                  </span>

                  {/* Badges */}
                  <CategoryTag category={ev.category} />
                  <ImportanceBadge importance={ev.importance} />
                </button>

                {/* Expanded detail */}
                {expanded && (
                  <div className="animate-fadeIn px-3 pb-3 pt-1">
                    <p className="text-xs leading-relaxed text-muted mb-2">
                      {ev.description}
                    </p>
                    <ValueComparison event={ev} />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Main Component ──

function getDateRange(): { from: string; to: string } {
  const now = new Date()
  const from = new Date(now.getFullYear(), now.getMonth() - 3, 1)
  const to = new Date(now.getFullYear(), now.getMonth() + 6, 0)
  return {
    from: toDateStr(from.getFullYear(), from.getMonth(), from.getDate()),
    to: toDateStr(to.getFullYear(), to.getMonth(), to.getDate()),
  }
}

export function EconomicCalendar() {
  const [view, setView] = useState<ViewMode>('monthly')
  const [importanceFilter, setImportanceFilter] =
    useState<ImportanceFilter>('all')

  const { from, to } = useMemo(getDateRange, [])
  const { data: events, isLoading, isError, refetch } = useCalendarEvents(from, to)

  return (
    <section className="rounded-lg border border-border-dim bg-surface p-5">
      {/* Section title */}
      <div className="mb-4">
        <h3 className="text-base font-semibold text-heading">경제 캘린더</h3>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {/* View toggle */}
        <div className="flex rounded-lg border border-border-dim overflow-hidden">
          <button
            onClick={() => setView('monthly')}
            className={cn(
              'flex items-center gap-1 px-3 py-1.5 text-[12px] font-medium transition-colors',
              view === 'monthly'
                ? 'bg-hover text-heading'
                : 'text-muted hover:text-heading',
            )}
          >
            <Calendar size={13} />
            월간
          </button>
          <button
            onClick={() => setView('list')}
            className={cn(
              'flex items-center gap-1 px-3 py-1.5 text-[12px] font-medium transition-colors',
              view === 'list'
                ? 'bg-hover text-heading'
                : 'text-muted hover:text-heading',
            )}
          >
            <List size={13} />
            목록
          </button>
        </div>

        {/* Importance filter */}
        <div className="flex rounded-lg border border-border-dim overflow-hidden ml-auto">
          {(
            [
              ['all', '전체'],
              ['high', '매우 중요'],
              ['medium', '중요'],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              onClick={() => setImportanceFilter(value)}
              className={cn(
                'px-3 py-1.5 text-[12px] font-medium transition-colors',
                importanceFilter === value
                  ? 'bg-hover text-heading'
                  : 'text-muted hover:text-heading',
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <LoadingState />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : view === 'monthly' ? (
        <MonthlyView events={events ?? []} importanceFilter={importanceFilter} />
      ) : (
        <ListView events={events ?? []} importanceFilter={importanceFilter} />
      )}
    </section>
  )
}
