import { useState, useMemo, useEffect, useRef } from 'react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'
import { X } from 'lucide-react'
import { formatChartData, formatPrice } from '@/components/charts/chartFormatters'
import { PeriodPills } from './primitives'
import { fmtNum, chgColor, chgText } from './primitives.helpers'
import type { PeriodId, IndicatorGroupItem } from './primitives.helpers'

interface Props {
  item: IndicatorGroupItem | null
  open: boolean
  onClose: () => void
}

function filterByPeriod(item: IndicatorGroupItem, period: PeriodId): IndicatorGroupItem {
  const now = new Date()
  const cutoff = new Date()
  switch (period) {
    case '1D': cutoff.setDate(now.getDate() - 1); break
    case '1W': cutoff.setDate(now.getDate() - 7); break
    case '1M': cutoff.setMonth(now.getMonth() - 1); break
    case '3M': cutoff.setMonth(now.getMonth() - 3); break
    case '1Y': cutoff.setFullYear(now.getFullYear() - 1); break
  }
  const filtered = item.series.filter(d => new Date(d.date) >= cutoff)
  const series = filtered.length >= 2 ? filtered : item.series
  const latest = series.length > 0 ? series[series.length - 1] : undefined
  const prev = series.length > 1 ? series[0] : undefined
  const change = latest && prev && prev.value !== 0
    ? ((latest.value - prev.value) / prev.value) * 100
    : item.change
  return { ...item, series, latest, prev, change }
}

function DetailTooltip({ active, payload, label, unit, color }: {
  active?: boolean
  payload?: Array<{ value: number }>
  label?: string
  unit?: string
  color?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: '#fff', border: '1px solid #E2E8F0', borderRadius: 8,
      padding: '8px 12px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
    }}>
      <div style={{ fontSize: 11, color: '#64748B', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 700, fontFamily: "'DM Mono', monospace", color }}>
        {formatPrice(payload[0].value)}{unit ? ` ${unit}` : ''}
      </div>
    </div>
  )
}

export function IndicatorDetailModal({ item, open, onClose }: Props) {
  const [period, setPeriod] = useState<PeriodId>('1M')
  const dialogRef = useRef<HTMLDivElement>(null)

  const filtered = useMemo(
    () => item ? filterByPeriod(item, period) : null,
    [item, period],
  )

  useEffect(() => {
    if (!open) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'Tab' && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        if (focusable.length === 0) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (e.shiftKey) {
          if (document.activeElement === first) { e.preventDefault(); last.focus() }
        } else {
          if (document.activeElement === last) { e.preventDefault(); first.focus() }
        }
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    const prevFocus = document.activeElement as HTMLElement | null
    dialogRef.current?.focus()
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      prevFocus?.focus()
    }
  }, [open, onClose])

  if (!open || !item || !filtered) return null

  const chartData = formatChartData(filtered.series)
  const color = chgColor(filtered.change)
  const gradientId = `detail-gradient-${item.indicator.id}`

  const values = filtered.series.map(d => d.value)
  const high = Math.max(...values)
  const low = Math.min(...values)
  const avg = values.reduce((s, v) => s + v, 0) / values.length

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(4px)' }} aria-hidden="true" />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={item.indicator.name}
        tabIndex={-1}
        style={{
        position: 'relative', zIndex: 10,
        width: '100%', maxWidth: 640,
        background: '#fff', borderRadius: 16,
        border: '1px solid #E2E8F0',
        boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
        padding: 28,
        animation: 'fadeIn 0.2s ease',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600, letterSpacing: '0.04em', marginBottom: 4 }}>
              {item.indicator.symbol} &middot; {item.indicator.category}
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#0F172A' }}>{item.indicator.name}</div>
          </div>
          <button
            onClick={onClose}
            aria-label="닫기"
            style={{
              background: '#F1F5F9', border: 'none', borderRadius: 8,
              width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: '#64748B',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Value + Change */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 20 }}>
          <span style={{ fontSize: 28, fontWeight: 700, fontFamily: "'DM Mono', monospace", color: '#0F172A' }}>
            {filtered.latest ? fmtNum(filtered.latest.value) : '--'}
          </span>
          <span style={{ fontSize: 14, fontWeight: 600, color }}>
            {chgText(filtered.change)}
          </span>
          {item.indicator.unit && (
            <span style={{ fontSize: 12, color: '#64748B' }}>{item.indicator.unit}</span>
          )}
        </div>

        {/* Period Pills */}
        <div style={{ marginBottom: 16 }}>
          <PeriodPills active={period} onChange={setPeriod} size="md" />
        </div>

        {/* Chart */}
        <div style={{ height: 260, marginBottom: 20 }} role="img" aria-label={`${item.indicator.name} ${period} 기간 차트`}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.2} />
                  <stop offset="100%" stopColor={color} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis
                dataKey="shortDate"
                tick={{ fill: '#64748B', fontSize: 10 }}
                axisLine={false} tickLine={false}
              />
              <YAxis
                tick={{ fill: '#64748B', fontSize: 10 }}
                axisLine={false} tickLine={false}
                tickFormatter={(v) => formatPrice(v)}
                width={56}
              />
              <Tooltip content={<DetailTooltip unit={item.indicator.unit} color={color} />} />
              <Area
                type="monotone" dataKey="value"
                stroke={color} strokeWidth={2}
                fill={`url(#${gradientId})`}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Stats */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
          gap: 12, background: '#F8FAFC', borderRadius: 10, padding: 14,
        }}>
          {[
            { label: 'High', value: high },
            { label: 'Low', value: low },
            { label: 'Average', value: avg },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 10, color: '#64748B', fontWeight: 500, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {s.label}
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, fontFamily: "'DM Mono', monospace", color: '#0F172A' }}>
                {fmtNum(s.value)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
