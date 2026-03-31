import { useState, useEffect, useCallback } from 'react'
import { useIndicators, useIndicatorSeries } from '@/hooks/useIndicators'
import { EconomicCalendar } from '@/components/dashboard/EconomicCalendar'
import { EventCountdown } from '@/components/dashboard/EventCountdown'
import { AlertBanner } from '@/components/dashboard/AlertBanner'
import { NewsPage } from '@/pages/NewsPage'
import type { Indicator, IndicatorData } from '@/types/indicator'

// ── Time Periods ─────────────────────────────────────────────────────
const PERIODS = [
  { id: '1D', label: '1D' },
  { id: '1W', label: '1W' },
  { id: '1M', label: '1M' },
  { id: '3M', label: '3M' },
  { id: '1Y', label: '1Y' },
] as const

type PeriodId = (typeof PERIODS)[number]['id']

// ── Sparkline ────────────────────────────────────────────────────────
function Sparkline({ data, color = '#6366F1', width = 80, height = 28 }: { data: number[]; color?: string; width?: number; height?: number }) {
  if (!data || data.length < 2) return null
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * width},${height - ((v - min) / range) * (height - 4) - 2}`).join(' ')
  const uid = `sp${color.replace(/[^a-zA-Z0-9]/g, '')}${width}${height}`
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: 'block' }}>
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
function MiniBar({ value, max = 100 }: { value: number; max?: number }) {
  const pct = Math.min(Math.max((value / max) * 100, 0), 100)
  const c = value <= 25 ? '#DC2626' : value <= 45 ? '#D97706' : value <= 55 ? '#9CA3AF' : value <= 75 ? '#65A30D' : '#16A34A'
  return (
    <div style={{ width: '100%', height: 5, borderRadius: 3, background: '#F1F5F9', overflow: 'hidden' }}>
      <div style={{ width: `${pct}%`, height: '100%', borderRadius: 3, background: c, transition: 'width 1s ease' }} />
    </div>
  )
}

// ── Fear & Greed Gauge ──────────────────────────────────────────────
function FearGreedGauge({ value }: { value: number }) {
  const label = value <= 25 ? 'Extreme Fear' : value <= 45 ? 'Fear' : value <= 55 ? 'Neutral' : value <= 75 ? 'Greed' : 'Extreme Greed'
  const c = value <= 25 ? '#DC2626' : value <= 45 ? '#D97706' : value <= 55 ? '#9CA3AF' : value <= 75 ? '#65A30D' : '#16A34A'
  const angle = (value / 100) * 180 - 90
  return (
    <div style={{ textAlign: 'center' }}>
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
        <line x1="76" y1="76" x2={76 + Math.cos(angle * Math.PI / 180) * 46} y2={76 + Math.sin(angle * Math.PI / 180) * 46} stroke={c} strokeWidth="2" strokeLinecap="round" />
        <circle cx="76" cy="76" r="3.5" fill={c} />
      </svg>
      <div style={{ fontSize: 26, fontWeight: 700, color: c, marginTop: -2, fontFamily: "'DM Mono', monospace" }}>{value}</div>
      <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 2, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 500 }}>{label}</div>
    </div>
  )
}

// ── Period Pill Selector ─────────────────────────────────────────────
function PeriodPills({ active, onChange, size = 'md', showReset, onReset }: { active: string; onChange: (p: PeriodId) => void; size?: 'sm' | 'md'; showReset?: boolean; onReset?: () => void }) {
  const isSm = size === 'sm'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: isSm ? 2 : 3, background: '#F1F5F9', borderRadius: 7, padding: 2 }}>
      {PERIODS.map(p => (
        <button key={p.id} onClick={() => onChange(p.id)} style={{
          padding: isSm ? '2px 6px' : '3px 10px', fontSize: isSm ? 10 : 11, fontWeight: active === p.id ? 600 : 500,
          color: active === p.id ? '#4F46E5' : '#94A3B8', background: active === p.id ? '#FFFFFF' : 'transparent',
          border: 'none', borderRadius: 5, cursor: 'pointer', transition: 'all 0.15s', fontFamily: "'DM Mono', monospace",
          boxShadow: active === p.id ? '0 1px 2px rgba(0,0,0,0.06)' : 'none', lineHeight: 1.4,
        }}>{p.label}</button>
      ))}
      {showReset && (
        <button onClick={onReset} title="Reset to global" style={{
          padding: isSm ? '2px 5px' : '3px 7px', fontSize: isSm ? 9 : 10, color: '#94A3B8',
          background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit', lineHeight: 1,
          borderLeft: '1px solid #E2E8F0', marginLeft: 2,
        }}>↻</button>
      )}
    </div>
  )
}

// ── Card Header ─────────────────────────────────────────────────────
function CardHeader({ title, localPeriod, onLocalChange, onReset, globalPeriod, children }: {
  title: string; localPeriod: PeriodId | null; onLocalChange: (p: PeriodId) => void; onReset: () => void; globalPeriod: PeriodId; children?: React.ReactNode
}) {
  const isOverridden = localPeriod !== null
  const effective = localPeriod || globalPeriod
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, minHeight: 26 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <h3 style={{ fontSize: 13, fontWeight: 600, color: '#475569' }}>{title}</h3>
        {isOverridden && <span style={{ fontSize: 9, color: '#4F46E5', background: '#EEF2FF', padding: '1px 5px', borderRadius: 3, fontWeight: 600, letterSpacing: '0.04em' }}>LOCAL</span>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {children}
        <PeriodPills active={effective} onChange={onLocalChange} size="sm" showReset={isOverridden} onReset={onReset} />
      </div>
    </div>
  )
}

// ── Tabs ─────────────────────────────────────────────────────────────
function Tabs({ tabs, active, onChange }: { tabs: { id: string; label: string }[]; active: string; onChange: (id: string) => void }) {
  return (
    <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid #E2E8F0', marginBottom: 16 }}>
      {tabs.map(t => (
        <button key={t.id} onClick={() => onChange(t.id)} style={{
          padding: '8px 16px', fontSize: 13, fontWeight: active === t.id ? 600 : 400,
          color: active === t.id ? '#4F46E5' : '#94A3B8', background: 'none', border: 'none',
          borderBottom: active === t.id ? '2px solid #4F46E5' : '2px solid transparent',
          cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'inherit',
        }}>{t.label}</button>
      ))}
    </div>
  )
}

// ── Helpers ──────────────────────────────────────────────────────────
const fmtNum = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const chgColor = (v: number) => v >= 0 ? '#16A34A' : '#DC2626'
const chgText = (v: number) => `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`

const CATEGORY_COLORS: Record<string, string> = {
  STOCK: '#4F46E5', FOREX: '#2563EB', CRYPTO: '#EA580C', MACRO: '#7C3AED', BOND: '#0D9488', COMMODITY: '#CA8A04',
}

const CATEGORY_ICONS: Record<string, string> = {
  STOCK: '◩', FOREX: '$', CRYPTO: '₿', MACRO: '◫', BOND: '◧', COMMODITY: '◆',
}

// ── Build indicator groups from API data ─────────────────────────────
function groupIndicators(indicators: Indicator[], allData: Record<number, IndicatorData[]>) {
  const groups: Record<string, Array<{ indicator: Indicator; series: IndicatorData[]; latest?: IndicatorData; prev?: IndicatorData; change: number }>> = {}

  for (const ind of indicators) {
    const series = allData[ind.id] ?? []
    const latest = series.length > 0 ? series[series.length - 1] : undefined
    const prev = series.length > 1 ? series[series.length - 2] : undefined
    const change = latest && prev && prev.value !== 0 ? ((latest.value - prev.value) / prev.value) * 100 : (latest?.change ?? 0)

    if (!groups[ind.category]) groups[ind.category] = []
    groups[ind.category].push({ indicator: ind, series, latest, prev, change })
  }

  return groups
}

// ── Main ─────────────────────────────────────────────────────────────
export function DashboardPage() {
  const [time, setTime] = useState(new Date())
  const [collapsed, setCollapsed] = useState(false)
  const [navSel, setNavSel] = useState('overview')
  const [globalPeriod, setGlobalPeriod] = useState<PeriodId>('1M')
  const [localIndices, setLocalIndices] = useState<PeriodId | null>(null)
  const [localCrypto, setLocalCrypto] = useState<PeriodId | null>(null)
  const [localCommod, setLocalCommod] = useState<PeriodId | null>(null)
  const [localStocks, setLocalStocks] = useState<PeriodId | null>(null)
  const [stockTab, setStockTab] = useState('kr')

  const effectivePeriod = useCallback((local: PeriodId | null) => local || globalPeriod, [globalPeriod])

  // API data
  const { data: indicators } = useIndicators()
  const indicatorIds = indicators?.map(i => i.id) ?? []
  const { data: allData } = useIndicatorSeries(indicatorIds, globalPeriod as '1D' | '1W' | '1M' | '3M' | '1Y')

  const groups = groupIndicators(indicators ?? [], allData ?? {})

  // Derive display data from API
  const stockIndicators = groups['STOCK'] ?? []
  const cryptoIndicators = groups['CRYPTO'] ?? []
  const commodityIndicators = groups['COMMODITY'] ?? []
  const bondIndicators = groups['BOND'] ?? []
  const macroIndicators = groups['MACRO'] ?? []
  const forexIndicators = groups['FOREX'] ?? []

  // Top indices = STOCK + MACRO combined (first 6)
  const topIndices = [...stockIndicators, ...macroIndicators, ...forexIndicators, ...bondIndicators].slice(0, 6)

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const fmt = (d: Date) => d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
  const fmtDate = (d: Date) => d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })

  const ep = {
    indices: effectivePeriod(localIndices),
    crypto: effectivePeriod(localCrypto),
    commod: effectivePeriod(localCommod),
    stocks: effectivePeriod(localStocks),
  }

  const navItems = [
    { id: 'overview', label: 'Overview', icon: '◫' },
    { id: 'indices', label: 'Indices', icon: '◩' },
    { id: 'stocks', label: 'Stocks', icon: '◧' },
    { id: 'crypto', label: 'Crypto', icon: '◈' },
    { id: 'commodities', label: 'Commodities', icon: '◆' },
    { id: 'news', label: 'News Feed', icon: '◪' },
  ]

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Inter:wght@400;500;600;700&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { background: #F8FAFC; color: #0F172A; font-family: 'Inter', -apple-system, system-ui, sans-serif; -webkit-font-smoothing: antialiased; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.35; } }
        .card { background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 10px; padding: 20px; animation: fadeUp 0.4s ease both; box-shadow: 0 1px 2px rgba(0,0,0,0.04); transition: box-shadow 0.2s, border-color 0.2s; }
        .card:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.06); border-color: #CBD5E1; }
        .badge { display: inline-flex; align-items: center; padding: 2px 7px; border-radius: 4px; font-size: 10px; font-weight: 600; letter-spacing: 0.04em; }
        .stock-row { display: grid; grid-template-columns: 1fr 100px 80px 70px; align-items: center; padding: 9px 0; border-bottom: 1px solid #F1F5F9; gap: 8px; transition: background 0.12s; cursor: default; }
        .stock-row:hover { background: #F8FAFC; margin: 0 -12px; padding: 9px 12px; border-radius: 6px; }
        .stock-row:last-child { border-bottom: none; }
        .nav-item { display: flex; align-items: center; gap: 10px; padding: 8px 12px; border-radius: 8px; cursor: pointer; transition: all 0.12s; font-size: 13px; color: #94A3B8; border: 1px solid transparent; font-weight: 500; }
        .nav-item:hover { background: #F1F5F9; color: #475569; }
        .nav-item.on { background: #EEF2FF; color: #4F46E5; border-color: #C7D2FE; }
        .dot-live { width: 6px; height: 6px; border-radius: 50%; background: #16A34A; animation: pulse 2s ease infinite; display: inline-block; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 2px; }
      `}</style>

      <div style={{ display: 'flex', minHeight: '100vh', background: '#F8FAFC' }}>
        {/* Sidebar */}
        <aside style={{
          width: collapsed ? 56 : 224, flexShrink: 0, background: '#FFFFFF',
          borderRight: '1px solid #E2E8F0', padding: collapsed ? '20px 8px' : '20px 14px',
          display: 'flex', flexDirection: 'column', transition: 'width 0.25s ease', overflow: 'hidden',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32, minHeight: 32, paddingLeft: 2 }}>
            <div style={{
              width: 30, height: 30, borderRadius: 8, background: 'linear-gradient(135deg, #4F46E5, #818CF8)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, fontWeight: 700, color: '#fff', flexShrink: 0,
              boxShadow: '0 2px 8px rgba(79,70,229,0.25)',
            }}>M</div>
            {!collapsed && <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.03em', whiteSpace: 'nowrap', color: '#0F172A' }}>Market Pulse</span>}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
            {navItems.map(item => (
              <div key={item.id} className={`nav-item ${navSel === item.id ? 'on' : ''}`}
                onClick={() => setNavSel(item.id)}
                style={{ justifyContent: collapsed ? 'center' : 'flex-start' }}>
                <span style={{ fontSize: 14, flexShrink: 0, width: 20, textAlign: 'center', opacity: 0.7 }}>{item.icon}</span>
                {!collapsed && <span style={{ whiteSpace: 'nowrap' }}>{item.label}</span>}
              </div>
            ))}
          </div>
          <button onClick={() => setCollapsed(!collapsed)} style={{
            background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: '7px',
            color: '#94A3B8', cursor: 'pointer', fontSize: 12, marginTop: 8, fontFamily: 'inherit',
          }}>{collapsed ? '→' : '← Collapse'}</button>
        </aside>

        {/* Main */}
        <main style={{ flex: 1, overflow: 'auto', padding: '28px 32px', maxWidth: 1440 }}>
          {/* Alert Banner */}
          <AlertBanner />

          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.03em', color: '#0F172A', marginBottom: 5 }}>
                {navSel === 'news' ? 'News Feed' : navSel === 'overview' ? 'Market Overview' : navItems.find(n => n.id === navSel)?.label ?? 'Market Overview'}
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#94A3B8', fontSize: 13 }}>
                <span className="dot-live" />
                <span style={{ fontFamily: "'DM Mono', monospace", fontWeight: 500, color: '#64748B' }}>{fmt(time)}</span>
                <span style={{ color: '#CBD5E1' }}>·</span>
                <span>{fmtDate(time)}</span>
              </div>
            </div>
          </div>

          {/* News Feed page */}
          {navSel === 'news' ? (
            <NewsPage />
          ) : (
          <>

          {/* Global Period Bar */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, padding: '10px 16px',
            background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>Period</span>
              <span style={{ fontSize: 10, color: '#94A3B8' }}>— applies to all sections</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <PeriodPills active={globalPeriod} onChange={setGlobalPeriod} size="md" />
              {(localIndices || localCrypto || localCommod || localStocks) && (
                <button onClick={() => { setLocalIndices(null); setLocalCrypto(null); setLocalCommod(null); setLocalStocks(null) }}
                  style={{ fontSize: 11, color: '#4F46E5', background: '#EEF2FF', border: '1px solid #C7D2FE', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit' }}>
                  Reset all overrides
                </button>
              )}
            </div>
          </div>

          {/* Index Cards */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h3 style={{ fontSize: 13, fontWeight: 600, color: '#475569' }}>Global Indices</h3>
              {localIndices && <span style={{ fontSize: 9, color: '#4F46E5', background: '#EEF2FF', padding: '1px 5px', borderRadius: 3, fontWeight: 600 }}>LOCAL</span>}
            </div>
            <PeriodPills active={ep.indices} onChange={setLocalIndices} size="sm" showReset={!!localIndices} onReset={() => setLocalIndices(null)} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(topIndices.length || 1, 6)}, 1fr)`, gap: 12, marginBottom: 20 }}>
            {topIndices.length === 0 ? (
              <div className="card" style={{ gridColumn: '1/-1', textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>Loading indicators...</div>
            ) : topIndices.map((item, i) => {
              const sparkData = item.series.map(d => d.value)
              return (
                <div key={item.indicator.id} className="card" style={{ padding: 16, animationDelay: `${i * 0.05}s` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600, letterSpacing: '0.03em' }}>{item.indicator.symbol}</span>
                    <span className="badge" style={{ background: item.change >= 0 ? '#F0FDF4' : '#FEF2F2', color: chgColor(item.change) }}>
                      {chgText(item.change)}
                    </span>
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 700, fontFamily: "'DM Mono', monospace", color: '#0F172A', letterSpacing: '-0.02em' }}>
                    {item.latest ? fmtNum(item.latest.value) : '--'}
                  </div>
                  <div style={{ marginTop: 10 }}>
                    <Sparkline data={sparkData} color={chgColor(item.change)} width={120} height={24} />
                  </div>
                </div>
              )
            })}
          </div>

          {/* Middle Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr 200px', gap: 12, marginBottom: 20 }}>
            {/* Commodities */}
            <div className="card" style={{ animationDelay: '0.3s' }}>
              <CardHeader title="Commodities" localPeriod={localCommod} onLocalChange={setLocalCommod} onReset={() => setLocalCommod(null)} globalPeriod={globalPeriod} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {commodityIndicators.length === 0 ? (
                  <div style={{ color: '#94A3B8', fontSize: 12, textAlign: 'center', padding: 20 }}>No data</div>
                ) : commodityIndicators.slice(0, 4).map(c => (
                  <div key={c.indicator.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 8, background: `${CATEGORY_COLORS.COMMODITY}0D`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: CATEGORY_COLORS.COMMODITY, flexShrink: 0, border: `1px solid ${CATEGORY_COLORS.COMMODITY}20` }}>
                      {CATEGORY_ICONS.COMMODITY}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#1E293B' }}>{c.indicator.name}</span>
                        <span style={{ fontSize: 13, fontFamily: "'DM Mono', monospace", fontWeight: 500, color: '#0F172A' }}>{c.latest ? fmtNum(c.latest.value) : '--'}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3 }}>
                        <span style={{ fontSize: 10, color: '#94A3B8' }}>{c.indicator.unit}</span>
                        <span style={{ fontSize: 10, fontWeight: 600, color: chgColor(c.change) }}>
                          {c.change >= 0 ? '▲' : '▼'} {Math.abs(c.change).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Crypto */}
            <div className="card" style={{ animationDelay: '0.35s' }}>
              <CardHeader title="Cryptocurrency" localPeriod={localCrypto} onLocalChange={setLocalCrypto} onReset={() => setLocalCrypto(null)} globalPeriod={globalPeriod} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {cryptoIndicators.length === 0 ? (
                  <div style={{ gridColumn: '1/-1', color: '#94A3B8', fontSize: 12, textAlign: 'center', padding: 20 }}>No data</div>
                ) : cryptoIndicators.slice(0, 4).map(c => {
                  const sparkData = c.series.map(d => d.value)
                  return (
                    <div key={c.indicator.id} style={{ background: '#F8FAFC', borderRadius: 10, padding: 14, border: '1px solid #E2E8F0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: `${CATEGORY_COLORS.CRYPTO}10`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: CATEGORY_COLORS.CRYPTO, border: `1px solid ${CATEGORY_COLORS.CRYPTO}20` }}>
                          {CATEGORY_ICONS.CRYPTO}
                        </div>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 600, color: '#1E293B' }}>{c.indicator.name}</div>
                          <div style={{ fontSize: 10, color: '#94A3B8' }}>{c.indicator.symbol}</div>
                        </div>
                      </div>
                      <div style={{ fontSize: 17, fontWeight: 700, fontFamily: "'DM Mono', monospace", color: '#0F172A', letterSpacing: '-0.02em' }}>
                        {c.latest ? fmtNum(c.latest.value) : '--'}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 6 }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: chgColor(c.change) }}>{chgText(c.change)}</span>
                      </div>
                      <div style={{ marginTop: 6 }}>
                        <Sparkline data={sparkData} color={chgColor(c.change)} width={140} height={22} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Fear & Greed placeholder */}
            <div className="card" style={{ animationDelay: '0.4s', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <h3 style={{ fontSize: 10, fontWeight: 600, color: '#94A3B8', marginBottom: 12, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Fear & Greed Index</h3>
              <FearGreedGauge value={28} />
              <div style={{ marginTop: 18, width: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {macroIndicators.slice(0, 2).map(m => (
                  <div key={m.indicator.id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#64748B', marginBottom: 4 }}>
                      <span style={{ fontWeight: 500 }}>{m.indicator.symbol}</span>
                      <span style={{ fontWeight: 600, fontFamily: "'DM Mono', monospace", color: chgColor(m.change) }}>{m.latest ? fmtNum(m.latest.value) : '--'}</span>
                    </div>
                    <MiniBar value={50 + m.change * 2} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom Row - All indicators table */}
          <div className="card" style={{ animationDelay: '0.45s' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 0 }}>
              <Tabs
                tabs={Object.keys(groups).map(cat => ({ id: cat, label: `${CATEGORY_ICONS[cat] || ''} ${cat}` }))}
                active={stockTab}
                onChange={setStockTab}
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
                {localStocks && <span style={{ fontSize: 9, color: '#4F46E5', background: '#EEF2FF', padding: '1px 5px', borderRadius: 3, fontWeight: 600 }}>LOCAL</span>}
                <PeriodPills active={ep.stocks} onChange={setLocalStocks} size="sm" showReset={!!localStocks} onReset={() => setLocalStocks(null)} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 80px 70px', padding: '0 0 8px', gap: 8, borderBottom: '1px solid #E2E8F0' }}>
              {['Name', 'Value', 'Change', 'Unit'].map((h, i) => (
                <span key={h} style={{ fontSize: 10, color: '#94A3B8', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', textAlign: i > 0 ? 'right' : 'left' }}>{h}</span>
              ))}
            </div>
            {(groups[stockTab] ?? []).map((item, i) => (
              <div key={item.indicator.id} className="stock-row" style={{ animation: 'fadeUp 0.3s ease both', animationDelay: `${0.5 + i * 0.03}s` }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: '#1E293B' }}>{item.indicator.name}</div>
                  <div style={{ fontSize: 10, color: '#94A3B8', fontFamily: "'DM Mono', monospace" }}>{item.indicator.symbol}</div>
                </div>
                <div style={{ textAlign: 'right', fontFamily: "'DM Mono', monospace", fontSize: 13, fontWeight: 500, color: '#0F172A' }}>
                  {item.latest ? fmtNum(item.latest.value) : '--'}
                </div>
                <div style={{ textAlign: 'right', fontSize: 12, fontWeight: 600, color: chgColor(item.change) }}>{chgText(item.change)}</div>
                <div style={{ textAlign: 'right', fontSize: 11, color: '#94A3B8' }}>{item.indicator.unit}</div>
              </div>
            ))}
            {(groups[stockTab] ?? []).length === 0 && (
              <div style={{ textAlign: 'center', color: '#94A3B8', fontSize: 13, padding: 32 }}>No data available</div>
            )}
          </div>

          {/* Economic Calendar & Countdown Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 12, marginTop: 20 }}>
            <EconomicCalendar />
            <EventCountdown />
          </div>

          </>
          )}

          {/* Footer */}
          <div style={{ marginTop: 28, padding: '14px 0', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, color: '#94A3B8' }}>Market Pulse Dashboard — Data from API</span>
            <span style={{ fontSize: 11, color: '#94A3B8', fontFamily: "'DM Mono', monospace" }}>Last refreshed: {fmt(time)}</span>
          </div>
        </main>
      </div>
    </>
  )
}
