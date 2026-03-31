import { useState, useCallback, lazy, Suspense } from 'react'
import { useDashboardData } from '@/hooks/useDashboardData'
import { useIndicators } from '@/hooks/useIndicators'
import { EconomicCalendar } from '@/components/dashboard/EconomicCalendar'
import { EventCountdown } from '@/components/dashboard/EventCountdown'
import { DashboardHeader, DashboardFooter } from '@/components/dashboard/DashboardHeader'
import { GlobalIndicesSection } from '@/components/dashboard/GlobalIndicesSection'
import { CommoditySection } from '@/components/dashboard/CommoditySection'
import { CryptoSection } from '@/components/dashboard/CryptoSection'
import { FearGreedSection } from '@/components/dashboard/FearGreedSection'
import { IndicatorTable } from '@/components/dashboard/IndicatorTable'
import { WidgetGrid } from '@/components/dashboard/WidgetGrid'
import { AddWidgetModal } from '@/components/dashboard/AddWidgetModal'
import { PeriodPills } from '@/components/dashboard/PeriodPills'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import type { PeriodId } from '@/components/dashboard/constants'

const NewsPage = lazy(() =>
  import('@/pages/NewsPage').then((m) => ({ default: m.NewsPage }))
)

const NAV_ITEMS = [
  { id: 'overview', label: 'Overview', icon: '◫' },
  { id: 'my-dashboard', label: 'My Dashboard', icon: '▦' },
  { id: 'indices', label: 'Indices', icon: '◩' },
  { id: 'stocks', label: 'Stocks', icon: '◧' },
  { id: 'crypto', label: 'Crypto', icon: '◈' },
  { id: 'commodities', label: 'Commodities', icon: '◆' },
  { id: 'news', label: 'News Feed', icon: '◪' },
]

export function DashboardPage() {
  const [collapsed, setCollapsed] = useState(false)
  const [navSel, setNavSel] = useState('overview')
  const [globalPeriod, setGlobalPeriod] = useState<PeriodId>('1M')
  const [localIndices, setLocalIndices] = useState<PeriodId | null>(null)
  const [localCrypto, setLocalCrypto] = useState<PeriodId | null>(null)
  const [localCommod, setLocalCommod] = useState<PeriodId | null>(null)
  const [localStocks, setLocalStocks] = useState<PeriodId | null>(null)
  const [stockTab, setStockTab] = useState('kr')
  const [addWidgetOpen, setAddWidgetOpen] = useState(false)

  const effectivePeriod = useCallback((local: PeriodId | null) => local || globalPeriod, [globalPeriod])

  const { groups, stockIndicators, cryptoIndicators, commodityIndicators, macroIndicators, forexIndicators, bondIndicators } =
    useDashboardData(globalPeriod)
  const { data: allIndicators = [] } = useIndicators()

  const topIndices = [...stockIndicators, ...macroIndicators, ...forexIndicators, ...bondIndicators].slice(0, 6)

  const title = navSel === 'news'
    ? 'News Feed'
    : navSel === 'overview'
      ? 'Market Overview'
      : NAV_ITEMS.find((n) => n.id === navSel)?.label ?? 'Market Overview'

  return (
    <>
      <style>{`
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

      <div className="flex min-h-screen bg-slate-50">
        {/* Sidebar */}
        <aside
          className="shrink-0 bg-white border-r border-slate-200 flex flex-col overflow-hidden transition-[width] duration-300 ease-out"
          style={{ width: collapsed ? 56 : 224, padding: collapsed ? '20px 8px' : '20px 14px' }}
        >
          <div className="flex items-center gap-2.5 mb-8 min-h-8 pl-0.5">
            <div className="w-[30px] h-[30px] rounded-lg bg-gradient-to-br from-indigo-600 to-indigo-400 flex items-center justify-center text-sm font-bold text-white shrink-0 shadow-[0_2px_8px_rgba(79,70,229,0.25)]">
              M
            </div>
            {!collapsed && (
              <span className="text-[15px] font-bold tracking-tight whitespace-nowrap text-slate-900">
                Market Pulse
              </span>
            )}
          </div>
          <div className="flex flex-col gap-0.5 flex-1">
            {NAV_ITEMS.map((item) => (
              <div
                key={item.id}
                className={`nav-item ${navSel === item.id ? 'on' : ''}`}
                onClick={() => setNavSel(item.id)}
                style={{ justifyContent: collapsed ? 'center' : 'flex-start' }}
              >
                <span className="text-sm shrink-0 w-5 text-center opacity-70">{item.icon}</span>
                {!collapsed && <span className="whitespace-nowrap">{item.label}</span>}
              </div>
            ))}
          </div>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="bg-slate-50 border border-slate-200 rounded-lg py-[7px] text-slate-400 cursor-pointer text-xs mt-2 font-inherit"
          >
            {collapsed ? '→' : '← Collapse'}
          </button>
        </aside>

        {/* Main */}
        <main className="flex-1 overflow-auto px-8 py-7 max-w-[1440px]">
          <DashboardHeader title={title} />

          {navSel === 'news' ? (
            <Suspense fallback={<div className="py-10 text-center text-slate-400">Loading…</div>}>
              <NewsPage />
            </Suspense>
          ) : navSel === 'my-dashboard' ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-slate-500">위젯을 추가하여 나만의 대시보드를 구성하세요</p>
                <button
                  onClick={() => setAddWidgetOpen(true)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-500 transition-colors"
                >
                  + 위젯 추가
                </button>
              </div>
              <ErrorBoundary label="위젯 그리드">
                <WidgetGrid indicators={allIndicators} />
              </ErrorBoundary>
              <AddWidgetModal
                open={addWidgetOpen}
                onClose={() => setAddWidgetOpen(false)}
                indicators={allIndicators}
              />
            </>
          ) : (
            <>
              {/* Global Period Bar */}
              <div className="flex justify-between items-center mb-5 px-4 py-2.5 bg-white border border-slate-200 rounded-[10px] shadow-sm">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-600">Period</span>
                  <span className="text-[10px] text-slate-400">— applies to all sections</span>
                </div>
                <div className="flex items-center gap-3">
                  <PeriodPills active={globalPeriod} onChange={setGlobalPeriod} size="md" />
                  {(localIndices || localCrypto || localCommod || localStocks) && (
                    <button
                      onClick={() => { setLocalIndices(null); setLocalCrypto(null); setLocalCommod(null); setLocalStocks(null) }}
                      className="text-[11px] text-indigo-600 bg-indigo-50 border border-indigo-300 rounded-md px-2.5 py-1 cursor-pointer font-semibold font-inherit"
                    >
                      Reset all overrides
                    </button>
                  )}
                </div>
              </div>

              {/* Global Indices */}
              <ErrorBoundary label="글로벌 지수">
                <GlobalIndicesSection
                  items={topIndices}
                  localPeriod={localIndices}
                  effectivePeriod={effectivePeriod(localIndices)}
                  onLocalChange={setLocalIndices}
                  onReset={() => setLocalIndices(null)}
                />
              </ErrorBoundary>

              {/* Middle Row: Commodities / Crypto / Fear & Greed */}
              <div className="grid grid-cols-[280px_1fr_200px] gap-3 mb-5">
                <ErrorBoundary label="원자재">
                  <CommoditySection
                    items={commodityIndicators}
                    localPeriod={localCommod}
                    globalPeriod={globalPeriod}
                    onLocalChange={setLocalCommod}
                    onReset={() => setLocalCommod(null)}
                  />
                </ErrorBoundary>
                <ErrorBoundary label="암호화폐">
                  <CryptoSection
                    items={cryptoIndicators}
                    localPeriod={localCrypto}
                    globalPeriod={globalPeriod}
                    onLocalChange={setLocalCrypto}
                    onReset={() => setLocalCrypto(null)}
                  />
                </ErrorBoundary>
                <ErrorBoundary label="공포/탐욕 지수">
                  <FearGreedSection macroIndicators={macroIndicators} />
                </ErrorBoundary>
              </div>

              {/* All Indicators Table */}
              <ErrorBoundary label="지표 테이블">
                <IndicatorTable
                  groups={groups}
                  stockTab={stockTab}
                  onTabChange={setStockTab}
                  localPeriod={localStocks}
                  effectivePeriod={effectivePeriod(localStocks)}
                  onLocalChange={setLocalStocks}
                  onReset={() => setLocalStocks(null)}
                />
              </ErrorBoundary>

              {/* Economic Calendar & Countdown */}
              <div className="grid grid-cols-[1fr_320px] gap-3 mt-5">
                <ErrorBoundary label="경제 캘린더">
                  <EconomicCalendar />
                </ErrorBoundary>
                <ErrorBoundary label="이벤트 카운트다운">
                  <EventCountdown />
                </ErrorBoundary>
              </div>
            </>
          )}

          <DashboardFooter />
        </main>
      </div>
    </>
  )
}
