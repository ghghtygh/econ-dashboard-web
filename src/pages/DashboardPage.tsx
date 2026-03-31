import { useState, useEffect, useCallback } from 'react'
import { useIndicators, useIndicatorSeries } from '@/hooks/useIndicators'
import { PeriodPills, groupIndicators } from '@/components/dashboard/primitives'
import type { PeriodId } from '@/components/dashboard/primitives'
import { GlobalIndicesSection } from '@/components/dashboard/GlobalIndicesSection'
import { CommoditiesSection } from '@/components/dashboard/CommoditiesSection'
import { CryptoSection } from '@/components/dashboard/CryptoSection'
import { FearGreedSection } from '@/components/dashboard/FearGreedSection'
import { IndicatorTableSection } from '@/components/dashboard/IndicatorTableSection'

const NAV_ITEMS = [
  { id: 'overview', label: 'Overview', icon: '◫' },
  { id: 'indices', label: 'Indices', icon: '◩' },
  { id: 'stocks', label: 'Stocks', icon: '◧' },
  { id: 'crypto', label: 'Crypto', icon: '◈' },
  { id: 'commodities', label: 'Commodities', icon: '◆' },
  { id: 'news', label: 'News Feed', icon: '◪' },
]

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

  const { data: indicators } = useIndicators()
  const indicatorIds = indicators?.map(i => i.id) ?? []
  const { data: allData } = useIndicatorSeries(indicatorIds, globalPeriod as '1D' | '1W' | '1M' | '3M' | '1Y')

  const groups = groupIndicators(indicators ?? [], allData ?? {})

  const stockIndicators = groups['STOCK'] ?? []
  const cryptoIndicators = groups['CRYPTO'] ?? []
  const commodityIndicators = groups['COMMODITY'] ?? []
  const bondIndicators = groups['BOND'] ?? []
  const macroIndicators = groups['MACRO'] ?? []
  const forexIndicators = groups['FOREX'] ?? []
  const topIndices = [...stockIndicators, ...macroIndicators, ...forexIndicators, ...bondIndicators].slice(0, 6)

  const hasLocalOverrides = !!(localIndices || localCrypto || localCommod || localStocks)

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const fmt = (d: Date) => d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
  const fmtDate = (d: Date) => d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })

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
              width: 30, height: 30, borderRadius: 8,
              background: 'linear-gradient(135deg, #4F46E5, #818CF8)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, fontWeight: 700, color: '#fff', flexShrink: 0,
              boxShadow: '0 2px 8px rgba(79,70,229,0.25)',
            }}>M</div>
            {!collapsed && <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.03em', whiteSpace: 'nowrap', color: '#0F172A' }}>Market Pulse</span>}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
            {NAV_ITEMS.map(item => (
              <div
                key={item.id}
                className={`nav-item ${navSel === item.id ? 'on' : ''}`}
                onClick={() => setNavSel(item.id)}
                style={{ justifyContent: collapsed ? 'center' : 'flex-start' }}
              >
                <span style={{ fontSize: 14, flexShrink: 0, width: 20, textAlign: 'center', opacity: 0.7 }}>{item.icon}</span>
                {!collapsed && <span style={{ whiteSpace: 'nowrap' }}>{item.label}</span>}
              </div>
            ))}
          </div>
          <button
            onClick={() => setCollapsed(!collapsed)}
            style={{
              background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: '7px',
              color: '#94A3B8', cursor: 'pointer', fontSize: 12, marginTop: 8, fontFamily: 'inherit',
            }}
          >{collapsed ? '→' : '← Collapse'}</button>
        </aside>

        {/* Main */}
        <main style={{ flex: 1, overflow: 'auto', padding: '28px 32px', maxWidth: 1440 }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.03em', color: '#0F172A', marginBottom: 5 }}>Market Overview</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#94A3B8', fontSize: 13 }}>
                <span className="dot-live" />
                <span style={{ fontFamily: "'DM Mono', monospace", fontWeight: 500, color: '#64748B' }}>{fmt(time)}</span>
                <span style={{ color: '#CBD5E1' }}>·</span>
                <span>{fmtDate(time)}</span>
              </div>
            </div>
          </div>

          {/* Global Period Bar */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20,
            padding: '10px 16px', background: '#FFFFFF', border: '1px solid #E2E8F0',
            borderRadius: 10, boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>Period</span>
              <span style={{ fontSize: 10, color: '#94A3B8' }}>— applies to all sections</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <PeriodPills active={globalPeriod} onChange={setGlobalPeriod} size="md" />
              {hasLocalOverrides && (
                <button
                  onClick={() => { setLocalIndices(null); setLocalCrypto(null); setLocalCommod(null); setLocalStocks(null) }}
                  style={{ fontSize: 11, color: '#4F46E5', background: '#EEF2FF', border: '1px solid #C7D2FE', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit' }}
                >
                  Reset all overrides
                </button>
              )}
            </div>
          </div>

          {/* Global Indices */}
          <GlobalIndicesSection
            topIndices={topIndices}
            localPeriod={localIndices}
            effectivePeriod={effectivePeriod(localIndices)}
            onLocalChange={setLocalIndices}
            onReset={() => setLocalIndices(null)}
          />

          {/* Middle Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr 200px', gap: 12, marginBottom: 20 }}>
            <CommoditiesSection
              commodityIndicators={commodityIndicators}
              localPeriod={localCommod}
              onLocalChange={setLocalCommod}
              onReset={() => setLocalCommod(null)}
              globalPeriod={globalPeriod}
            />
            <CryptoSection
              cryptoIndicators={cryptoIndicators}
              localPeriod={localCrypto}
              onLocalChange={setLocalCrypto}
              onReset={() => setLocalCrypto(null)}
              globalPeriod={globalPeriod}
            />
            <FearGreedSection macroIndicators={macroIndicators} />
          </div>

          {/* Indicator Table */}
          <IndicatorTableSection
            groups={groups}
            activeTab={stockTab}
            onTabChange={setStockTab}
            localPeriod={localStocks}
            effectivePeriod={effectivePeriod(localStocks)}
            onLocalChange={setLocalStocks}
            onReset={() => setLocalStocks(null)}
          />

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
