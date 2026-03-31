import { format } from 'date-fns'
import { ko, enUS } from 'date-fns/locale'
import i18n from '@/i18n'
import type { TFunction } from 'i18next'

/* ── Locale helpers ── */

export function getLocale(): string {
  return i18n.language === 'ko' ? 'ko-KR' : 'en-US'
}

export function getDateFnsLocale() {
  return i18n.language === 'ko' ? ko : enUS
}

/* ── Date formatters ── */

/** "2026년 4월 1일 수요일" */
export function formatFullDate(date: Date): string {
  return date.toLocaleDateString(getLocale(), {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  })
}

/** "4월 1일" / "Apr 1" */
export function formatShortDate(date: Date): string {
  return date.toLocaleDateString(getLocale(), { month: 'short', day: 'numeric' })
}

/** "4월 1일 (수)" / "Apr 1, Wed" */
export function formatEventDate(date: Date): string {
  return date.toLocaleDateString(getLocale(), { month: 'long', day: 'numeric', weekday: 'short' })
}

/** "2026년 4월 1일" */
export function formatCalendarDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`
}

/** "2026.04.01 (수)" — for chart tooltips */
export function formatChartFullDate(date: Date): string {
  return format(date, 'yyyy.MM.dd (EEE)', { locale: getDateFnsLocale() })
}

/** "04/01" — for chart x-axis */
export function formatChartShortDate(date: Date): string {
  return format(date, 'MM/dd')
}

/* ── Time formatters ── */

/** "14:30:05" */
export function formatClockTime(date: Date): string {
  return date.toLocaleTimeString(getLocale(), {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
}

/* ── Relative time ── */

/** "방금 전", "3분 전", "2시간 전", "3일 전", or short date */
export function formatTimeAgo(dateStr: string, t: TFunction): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return t('time.justNow')
  if (diffMin < 60) return t('time.minutesAgo', { count: diffMin })
  const diffHour = Math.floor(diffMin / 60)
  if (diffHour < 24) return t('time.hoursAgo', { count: diffHour })
  const diffDay = Math.floor(diffHour / 24)
  if (diffDay < 7) return t('time.daysAgo', { count: diffDay })
  return formatShortDate(date)
}
