import { useId, type ReactNode } from 'react'
import { PERIODS } from './primitives.helpers'
import type { PeriodId } from './primitives.helpers'

// ── Sparkline ────────────────────────────────────────────────────────
export function Sparkline({
  data,
  color = '#6366F1',
  width = 80,
  height = 28,
}: {
  data: number[]
  color?: string
  width?: number
  height?: number
}) {
  const instanceId = useId()
  if (!data || data.length < 2) return null
  const safeData = data.filter((v) => Number.isFinite(v))
  if (safeData.length < 2) return null
  const min = Math.min(...safeData)
  const max = Math.max(...safeData)
  const range = max - min || 1
  const pts = safeData
    .map((v, i) => `${(i / (safeData.length - 1)) * width},${height - ((v - min) / range) * (height - 4) - 2}`)
    .join(' ')
  const uid = `sp-${instanceId.replace(/:/g, '')}`
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: 'block' }} role="img" aria-label="추세 차트">
      <defs>
        <linearGradient id={uid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.12} />
          <stop offset="100%" stopColor={color} stopOpacity={0.01} />
        </linearGradient>
      </defs>
      <polygon points={`${pts} ${width},${height} 0,${height}`} fill={`url(#${uid})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}

// ── MiniBar ──────────────────────────────────────────────────────────
export function MiniBar({ value, max = 100 }: { value: number; max?: number }) {
  const pct = Math.min(Math.max((value / max) * 100, 0), 100)
  const c =
    value <= 25 ? '#DC2626'
    : value <= 45 ? '#D97706'
    : value <= 55 ? '#9CA3AF'
    : value <= 75 ? '#65A30D'
    : '#16A34A'
  return (
    <div style={{ width: '100%', height: 5, borderRadius: 3, background: '#F1F5F9', overflow: 'hidden' }}>
      <div style={{ width: `${pct}%`, height: '100%', borderRadius: 3, background: c, transition: 'width 1s ease' }} />
    </div>
  )
}

// ── Fear & Greed Gauge ───────────────────────────────────────────────
export function FearGreedGauge({ value }: { value: number }) {
  const label =
    value <= 25 ? 'Extreme Fear'
    : value <= 45 ? 'Fear'
    : value <= 55 ? 'Neutral'
    : value <= 75 ? 'Greed'
    : 'Extreme Greed'
  const c =
    value <= 25 ? '#DC2626'
    : value <= 45 ? '#D97706'
    : value <= 55 ? '#9CA3AF'
    : value <= 75 ? '#65A30D'
    : '#16A34A'
  const angle = (value / 100) * 180 - 90
  return (
    <div style={{ textAlign: 'center' }}>
      <svg width="152" height="86" viewBox="0 0 152 86" role="img" aria-label={`Fear & Greed 게이지: ${value}점, ${label}`}>
        <defs>
          <linearGradient id="g-arc" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#DC2626" />
            <stop offset="25%" stopColor="#D97706" />
            <stop offset="50%" stopColor="#9CA3AF" />
            <stop offset="75%" stopColor="#65A30D" />
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
      <div style={{ fontSize: 26, fontWeight: 700, color: c, marginTop: -2, fontFamily: "'DM Mono', monospace" }}>{value}</div>
      <div style={{ fontSize: 10, color: '#64748B', marginTop: 2, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 500 }}>{label}</div>
    </div>
  )
}

// ── Period Pill Selector ─────────────────────────────────────────────
export function PeriodPills({
  active,
  onChange,
  size = 'md',
  showReset,
  onReset,
}: {
  active: string
  onChange: (p: PeriodId) => void
  size?: 'sm' | 'md'
  showReset?: boolean
  onReset?: () => void
}) {
  const isSm = size === 'sm'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: isSm ? 2 : 3, background: '#F1F5F9', borderRadius: 7, padding: 2 }}>
      {PERIODS.map(p => (
        <button
          key={p.id}
          onClick={() => onChange(p.id)}
          style={{
            padding: isSm ? '2px 6px' : '3px 10px',
            fontSize: isSm ? 10 : 11,
            fontWeight: active === p.id ? 600 : 500,
            color: active === p.id ? '#4F46E5' : '#94A3B8',
            background: active === p.id ? '#FFFFFF' : 'transparent',
            border: 'none', borderRadius: 5, cursor: 'pointer', transition: 'all 0.15s',
            fontFamily: "'DM Mono', monospace",
            boxShadow: active === p.id ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
            lineHeight: 1.4,
          }}
        >
          {p.label}
        </button>
      ))}
      {showReset && (
        <button
          onClick={onReset}
          title="Reset to global"
          style={{
            padding: isSm ? '2px 5px' : '3px 7px',
            fontSize: isSm ? 9 : 10,
            color: '#64748B', background: 'transparent', border: 'none',
            cursor: 'pointer', fontFamily: 'inherit', lineHeight: 1,
            borderLeft: '1px solid #E2E8F0', marginLeft: 2,
          }}
        >↻</button>
      )}
    </div>
  )
}

// ── Card Header ──────────────────────────────────────────────────────
export function CardHeader({
  title,
  localPeriod,
  onLocalChange,
  onReset,
  globalPeriod,
  children,
}: {
  title: string
  localPeriod: PeriodId | null
  onLocalChange: (p: PeriodId) => void
  onReset: () => void
  globalPeriod: PeriodId
  children?: ReactNode
}) {
  const isOverridden = localPeriod !== null
  const effective = localPeriod || globalPeriod
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, minHeight: 26 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <h2 style={{ fontSize: 13, fontWeight: 600, color: '#475569' }}>{title}</h2>
        {isOverridden && (
          <span style={{ fontSize: 9, color: '#4F46E5', background: '#EEF2FF', padding: '1px 5px', borderRadius: 3, fontWeight: 600, letterSpacing: '0.04em' }}>LOCAL</span>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {children}
        <PeriodPills active={effective} onChange={onLocalChange} size="sm" showReset={isOverridden} onReset={onReset} />
      </div>
    </div>
  )
}

// ── Tabs ─────────────────────────────────────────────────────────────
export function Tabs({
  tabs,
  active,
  onChange,
}: {
  tabs: { id: string; label: string }[]
  active: string
  onChange: (id: string) => void
}) {
  return (
    <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid #E2E8F0', marginBottom: 16 }}>
      {tabs.map(t => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          style={{
            padding: '8px 16px', fontSize: 13,
            fontWeight: active === t.id ? 600 : 400,
            color: active === t.id ? '#4F46E5' : '#94A3B8',
            background: 'none', border: 'none',
            borderBottom: active === t.id ? '2px solid #4F46E5' : '2px solid transparent',
            cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'inherit',
          }}
        >{t.label}</button>
      ))}
    </div>
  )
}
