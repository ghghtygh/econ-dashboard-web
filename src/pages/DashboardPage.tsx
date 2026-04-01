import { useState, useEffect, useCallback, lazy, Suspense } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useIndicators, useIndicatorSeries } from '@/hooks/useIndicators'
import { PeriodPills, Sparkline } from '@/components/dashboard/primitives'
import { groupIndicators, fmtNum, chgColor, chgText, CATEGORY_COLORS, CATEGORY_ICONS } from '@/components/dashboard/primitives.helpers'
import type { PeriodId } from '@/components/dashboard/primitives.helpers'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import { Skeleton, TableRowSkeleton, NewsCardSkeleton } from '@/components/ui/Skeleton'
import { useNewsList } from '@/hooks/useNews'
import { useThemeStore } from '@/store/themeStore'
import { WidgetGrid } from '@/components/dashboard/WidgetGrid'
import { AddWidgetModal } from '@/components/dashboard/AddWidgetModal'
import { useDashboardStore } from '@/store/dashboardStore'
import { LiveClock } from '@/components/dashboard/LiveClock'

const GlobalIndicesSection = lazy(() =>
  import('@/components/dashboard/GlobalIndicesSection').then((m) => ({ default: m.GlobalIndicesSection })),
)
const CommoditiesSection = lazy(() =>
  import('@/components/dashboard/CommoditiesSection').then((m) => ({ default: m.CommoditiesSection })),
)
const CryptoSection = lazy(() =>
  import('@/components/dashboard/CryptoSection').then((m) => ({ default: m.CryptoSection })),
)
const FearGreedSection = lazy(() =>
  import('@/components/dashboard/FearGreedSection').then((m) => ({ default: m.FearGreedSection })),
)
const IndicatorTableSection = lazy(() =>
  import('@/components/dashboard/IndicatorTableSection').then((m) => ({ default: m.IndicatorTableSection })),
)
const EconomicCalendar = lazy(() =>
  import('@/components/dashboard/EconomicCalendar').then((m) => ({ default: m.EconomicCalendar })),
)
const AlertPanel = lazy(() =>
  import('@/components/dashboard/AlertPanel').then((m) => ({ default: m.AlertPanel })),
)

const NAV_ITEMS = [
  { id: 'overview', path: '/', label: 'Overview', icon: '◫' },
  { id: 'indices', path: '/indices', label: 'Indices', icon: '◩' },
  { id: 'stocks', path: '/stocks', label: 'Stocks', icon: '◧' },
  { id: 'crypto', path: '/crypto', label: 'Crypto', icon: '◈' },
  { id: 'commodities', path: '/commodities', label: 'Commodities', icon: '◆' },
  { id: 'news', path: '/news', label: 'News Feed', icon: '◪' },
  { id: 'explore', path: '/explore', label: 'Explore', icon: '◎' },
  { id: 'calendar', path: '/calendar', label: 'Calendar', icon: '◰' },
  { id: 'alerts', path: '/alerts', label: 'Alerts', icon: '◲' },
]

const PATH_TO_NAV: Record<string, string> = {
  '/': 'overview',
  '/indices': 'indices',
  '/stocks': 'stocks',
  '/crypto': 'crypto',
  '/commodities': 'commodities',
  '/news': 'news',
  '/explore': 'explore',
  '/calendar': 'calendar',
  '/alerts': 'alerts',
}

const PAGE_TITLES: Record<string, string> = {
  overview: 'Market Overview',
  indices: 'Global Indices',
  stocks: 'Stocks',
  crypto: 'Cryptocurrency',
  commodities: 'Commodities',
  news: 'News Feed',
  explore: 'Explore',
  calendar: 'Economic Calendar',
  alerts: 'Alerts',
}

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 60) return `${diffMin}분 전`
  const diffHour = Math.floor(diffMin / 60)
  if (diffHour < 24) return `${diffHour}시간 전`
  const diffDay = Math.floor(diffHour / 24)
  if (diffDay < 7) return `${diffDay}일 전`
  return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
}

export function DashboardPage() {
  const location = useLocation()
  const navSel = PATH_TO_NAV[location.pathname] ?? 'overview'

  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [globalPeriod, setGlobalPeriod] = useState<PeriodId>('1M')
  const [localIndices, setLocalIndices] = useState<PeriodId | null>(null)
  const [localCrypto, setLocalCrypto] = useState<PeriodId | null>(null)
  const [localCommod, setLocalCommod] = useState<PeriodId | null>(null)
  const [localStocks, setLocalStocks] = useState<PeriodId | null>(null)
  const [stockTab, setStockTab] = useState('STOCK')

  const { theme, toggleTheme } = useThemeStore()
  const [addWidgetOpen, setAddWidgetOpen] = useState(false)
  const fetchWidgetsFromServer = useDashboardStore((s) => s.fetchWidgetsFromServer)
  const ensureDefaults = useDashboardStore((s) => s.ensureDefaults)
  const resetToDefaults = useDashboardStore((s) => s.resetToDefaults)

  useEffect(() => {
    ensureDefaults()
    fetchWidgetsFromServer()
  }, [ensureDefaults, fetchWidgetsFromServer])

  const effectivePeriod = useCallback((local: PeriodId | null) => local || globalPeriod, [globalPeriod])

  const { data: indicators } = useIndicators()
  const indicatorIds = indicators?.map(i => i.id) ?? []
  const { data: seriesResult } = useIndicatorSeries(indicatorIds, globalPeriod as '1D' | '1W' | '1M' | '3M' | '1Y')
  const allData = seriesResult?.data

  const groups = groupIndicators(indicators ?? [], allData ?? {})

  const stockIndicators = groups['STOCK'] ?? []
  const cryptoIndicators = groups['CRYPTO'] ?? []
  const commodityIndicators = groups['COMMODITY'] ?? []
  const bondIndicators = groups['BOND'] ?? []
  const macroIndicators = groups['MACRO'] ?? []
  const forexIndicators = groups['FOREX'] ?? []
  const topIndices = [...stockIndicators, ...macroIndicators, ...forexIndicators, ...bondIndicators].slice(0, 6)

  const hasLocalOverrides = !!(localIndices || localCrypto || localCommod || localStocks)

  const [newsPage, setNewsPage] = useState(0)
  const { data: newsData, isLoading: newsLoading } = useNewsList(undefined, newsPage)
  const newsArticles = newsData?.content ?? []
  const newsTotalPages = newsData?.totalPages ?? 0


  const handleMobileClose = () => {
    setMobileOpen(false)
  }

  const [lastRefresh, setLastRefresh] = useState<string>('')
  useEffect(() => {
    if (indicators && indicators.length > 0) {
      setLastRefresh(new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }))
    }
  }, [indicators])


  const renderContent = () => {
    switch (navSel) {
      case 'indices':
        return (
          <>
            <ErrorBoundary>
              <GlobalIndicesSection
                topIndices={topIndices}
                localPeriod={localIndices}
                effectivePeriod={effectivePeriod(localIndices)}
                onLocalChange={setLocalIndices}
                onReset={() => setLocalIndices(null)}
              />
            </ErrorBoundary>
            <ErrorBoundary>
              <div className="card" style={{ marginTop: 12, padding: 20 }}>
                <h2 className="db-table-header">All Index Indicators</h2>
                <div className="db-table-head">
                  {['Name', 'Value', 'Change', 'Trend', 'Unit'].map((h, i) => (
                    <span key={h} className="db-table-th" style={{ textAlign: i > 0 ? 'right' : 'left' }}>
                      {h}
                    </span>
                  ))}
                </div>
                {[...stockIndicators, ...macroIndicators, ...forexIndicators, ...bondIndicators].map((item, i) => {
                  const sparkData = item.series.map(d => d.value)
                  return (
                    <div key={item.indicator.id} className="stock-row" style={{ animation: 'fadeUp 0.3s ease both', animationDelay: `${0.1 + i * 0.03}s` }}>
                      <div>
                        <div className="db-name">{item.indicator.name}</div>
                        <div className="db-symbol">{item.indicator.symbol}</div>
                      </div>
                      <div className="db-value">
                        {item.latest ? fmtNum(item.latest.value) : '--'}
                      </div>
                      <div className="db-change" style={{ color: chgColor(item.change) }}>{chgText(item.change)}</div>
                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <Sparkline data={sparkData} color={chgColor(item.change)} width={60} height={18} />
                      </div>
                      <div className="db-unit">{item.indicator.unit}</div>
                    </div>
                  )
                })}
                {[...stockIndicators, ...macroIndicators, ...forexIndicators, ...bondIndicators].length === 0 && (
                  <TableRowSkeleton count={6} />
                )}
              </div>
            </ErrorBoundary>
          </>
        )

      case 'stocks':
        return (
          <ErrorBoundary>
            <IndicatorTableSection
              groups={{ STOCK: stockIndicators }}
              activeTab="STOCK"
              onTabChange={() => {}}
              localPeriod={localStocks}
              effectivePeriod={effectivePeriod(localStocks)}
              onLocalChange={setLocalStocks}
              onReset={() => setLocalStocks(null)}
            />
            {stockIndicators.length > 0 && (
              <div className="db-card-grid" style={{ marginTop: 16 }}>
                {stockIndicators.map((item, i) => {
                  const sparkData = item.series.map(d => d.value)
                  return (
                    <div key={item.indicator.id} className="card" style={{ padding: 16, animationDelay: `${i * 0.05}s` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <div>
                          <div className="db-name">{item.indicator.name}</div>
                          <div className="db-symbol">{item.indicator.symbol}</div>
                        </div>
                        <span className="badge" style={{ background: item.change >= 0 ? 'var(--th-positive-bg)' : 'var(--th-negative-bg)', color: chgColor(item.change) }}>
                          {chgText(item.change)}
                        </span>
                      </div>
                      <div className="db-big-value">
                        {item.latest ? fmtNum(item.latest.value) : '--'}
                      </div>
                      <Sparkline data={sparkData} color={chgColor(item.change)} width={240} height={32} />
                    </div>
                  )
                })}
              </div>
            )}
          </ErrorBoundary>
        )

      case 'crypto':
        return (
          <ErrorBoundary>
            <div className="db-card-grid">
              {cryptoIndicators.length === 0 ? (
                <div className="card db-empty" style={{ gridColumn: '1/-1' }}>No crypto data available</div>
              ) : cryptoIndicators.map((c, i) => {
                const sparkData = c.series.map(d => d.value)
                return (
                  <div key={c.indicator.id} className="card" style={{ padding: 18, animationDelay: `${i * 0.05}s` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: '50%',
                        background: `${CATEGORY_COLORS.CRYPTO}10`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 16, fontWeight: 700, color: CATEGORY_COLORS.CRYPTO,
                        border: `1px solid ${CATEGORY_COLORS.CRYPTO}20`,
                      }}>
                        {CATEGORY_ICONS.CRYPTO}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div className="db-name">{c.indicator.name}</div>
                        <div className="db-symbol">{c.indicator.symbol}</div>
                      </div>
                      <span className="badge" style={{ background: c.change >= 0 ? 'var(--th-positive-bg)' : 'var(--th-negative-bg)', color: chgColor(c.change) }}>
                        {chgText(c.change)}
                      </span>
                    </div>
                    <div className="db-big-value">
                      {c.latest ? fmtNum(c.latest.value) : '--'}
                    </div>
                    <Sparkline data={sparkData} color={chgColor(c.change)} width={240} height={36} />
                    <div className="db-meta">
                      <span>{c.indicator.unit}</span>
                      <span>데이터 {c.series.length}개</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </ErrorBoundary>
        )

      case 'commodities':
        return (
          <ErrorBoundary>
            <div className="db-card-grid db-card-grid--wide">
              {commodityIndicators.length === 0 ? (
                <div className="card db-empty" style={{ gridColumn: '1/-1' }}>No commodity data available</div>
              ) : commodityIndicators.map((c, i) => {
                const sparkData = c.series.map(d => d.value)
                return (
                  <div key={c.indicator.id} className="card" style={{ padding: 18, animationDelay: `${i * 0.05}s` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: 8,
                        background: `${CATEGORY_COLORS.COMMODITY}0D`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 15, fontWeight: 700, color: CATEGORY_COLORS.COMMODITY,
                        border: `1px solid ${CATEGORY_COLORS.COMMODITY}20`,
                      }}>
                        {CATEGORY_ICONS.COMMODITY}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div className="db-name">{c.indicator.name}</div>
                        <div className="db-symbol">{c.indicator.unit}</div>
                      </div>
                      <span className="badge" style={{ background: c.change >= 0 ? 'var(--th-positive-bg)' : 'var(--th-negative-bg)', color: chgColor(c.change) }}>
                        {chgText(c.change)}
                      </span>
                    </div>
                    <div className="db-big-value">
                      {c.latest ? fmtNum(c.latest.value) : '--'}
                    </div>
                    <Sparkline data={sparkData} color={chgColor(c.change)} width={260} height={36} />
                    <div className="db-meta">
                      <span>{c.indicator.symbol}</span>
                      <span>데이터 {c.series.length}개</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </ErrorBoundary>
        )

      case 'news':
        return (
          <ErrorBoundary>
            {newsLoading ? (
              <NewsCardSkeleton />
            ) : newsArticles.length === 0 ? (
              <div className="card db-empty">뉴스가 없습니다</div>
            ) : (
              <>
                <div className="db-card-grid db-card-grid--wide">
                  {newsArticles.map((article, i) => (
                    <a
                      key={article.id}
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="card"
                      style={{ padding: 18, textDecoration: 'none', animationDelay: `${i * 0.03}s`, display: 'flex', flexDirection: 'column' }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <span className="badge" style={{
                          background: `${CATEGORY_COLORS[article.category] ?? '#64748B'}15`,
                          color: CATEGORY_COLORS[article.category] ?? '#64748B',
                        }}>
                          {article.category}
                        </span>
                        <span className="db-symbol">{formatTimeAgo(article.publishedAt)}</span>
                      </div>
                      <div className="db-name" style={{ marginBottom: 6, lineHeight: 1.4, fontSize: 14 }}>{article.title}</div>
                      {article.summary && (
                        <div className="db-article-summary">
                          {article.summary}
                        </div>
                      )}
                      {article.source && (
                        <div className="db-article-source">
                          {article.source}
                        </div>
                      )}
                    </a>
                  ))}
                </div>
                {newsTotalPages > 1 && (
                  <div className="db-pagination">
                    <button
                      onClick={() => setNewsPage(p => Math.max(0, p - 1))}
                      disabled={newsPage === 0}
                      className="db-page-btn"
                    >이전</button>
                    <span className="db-page-info">{newsPage + 1} / {newsTotalPages}</span>
                    <button
                      onClick={() => setNewsPage(p => Math.min(newsTotalPages - 1, p + 1))}
                      disabled={newsPage >= newsTotalPages - 1}
                      className="db-page-btn"
                    >다음</button>
                  </div>
                )}
              </>
            )}
          </ErrorBoundary>
        )

      case 'explore':
        return (
          <ErrorBoundary>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-heading">My Widgets</h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={resetToDefaults}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border-dim px-3 py-1.5 text-xs font-medium text-muted hover:bg-elevated transition-colors"
                  >
                    기본 레이아웃으로 초기화
                  </button>
                  <button
                    onClick={() => setAddWidgetOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 transition-colors"
                  >
                    + 위젯 추가
                  </button>
                </div>
              </div>
              <WidgetGrid indicators={indicators ?? []} />
              <AddWidgetModal
                open={addWidgetOpen}
                onClose={() => setAddWidgetOpen(false)}
                indicators={indicators ?? []}
              />
            </div>
          </ErrorBoundary>
        )

      case 'calendar':
        return (
          <ErrorBoundary>
            <EconomicCalendar />
          </ErrorBoundary>
        )

      case 'alerts':
        return (
          <ErrorBoundary>
            <AlertPanel indicators={indicators ?? []} dataMap={allData ?? {}} />
          </ErrorBoundary>
        )

      default: // overview
        return (
          <>
            <ErrorBoundary>
              <GlobalIndicesSection
                topIndices={topIndices}
                localPeriod={localIndices}
                effectivePeriod={effectivePeriod(localIndices)}
                onLocalChange={setLocalIndices}
                onReset={() => setLocalIndices(null)}
              />
            </ErrorBoundary>

            <div className="db-overview-mid">
              <ErrorBoundary>
                <CommoditiesSection
                  commodityIndicators={commodityIndicators}
                  localPeriod={localCommod}
                  onLocalChange={setLocalCommod}
                  onReset={() => setLocalCommod(null)}
                  globalPeriod={globalPeriod}
                />
              </ErrorBoundary>
              <ErrorBoundary>
                <CryptoSection
                  cryptoIndicators={cryptoIndicators}
                  localPeriod={localCrypto}
                  onLocalChange={setLocalCrypto}
                  onReset={() => setLocalCrypto(null)}
                  globalPeriod={globalPeriod}
                />
              </ErrorBoundary>
              <ErrorBoundary>
                <FearGreedSection macroIndicators={macroIndicators} />
              </ErrorBoundary>
            </div>

            <ErrorBoundary>
              <IndicatorTableSection
                groups={groups}
                activeTab={stockTab}
                onTabChange={setStockTab}
                localPeriod={localStocks}
                effectivePeriod={effectivePeriod(localStocks)}
                onLocalChange={setLocalStocks}
                onReset={() => setLocalStocks(null)}
              />
            </ErrorBoundary>

            <ErrorBoundary>
              <div className="space-y-4" style={{ marginTop: 24 }}>
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-heading">My Widgets</h2>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={resetToDefaults}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-border-dim px-3 py-1.5 text-xs font-medium text-muted hover:bg-elevated transition-colors"
                    >
                      기본 레이아웃으로 초기화
                    </button>
                    <button
                      onClick={() => setAddWidgetOpen(true)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 transition-colors"
                    >
                      + 위젯 추가
                    </button>
                  </div>
                </div>
                <WidgetGrid indicators={indicators ?? []} />
                <AddWidgetModal
                  open={addWidgetOpen}
                  onClose={() => setAddWidgetOpen(false)}
                  indicators={indicators ?? []}
                />
              </div>
            </ErrorBoundary>
          </>
        )
    }
  }

  return (
    <div className="db-layout">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-[200] focus:p-3 focus:bg-elevated focus:text-heading focus:font-semibold focus:rounded-md focus:shadow-lg focus:top-2 focus:left-2 focus:ring-2 focus:ring-blue-500"
      >
        본문으로 건너뛰기
      </a>
      <a
        href="#sidebar-nav"
        className="sr-only focus:not-sr-only focus:absolute focus:z-[200] focus:p-3 focus:bg-elevated focus:text-heading focus:font-semibold focus:rounded-md focus:shadow-lg focus:top-2 focus:left-48"
      >
        네비게이션으로 건너뛰기
      </a>
      {/* Mobile header */}
      <header className="db-mobile-header">
        <button className="db-hamburger" onClick={() => setMobileOpen(true)} aria-label="메뉴 열기">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        </button>
        <div className="db-mobile-logo">
          <div className="db-logo-icon">M</div>
          <span className="db-logo-text">Market Pulse</span>
        </div>
        <button className="db-theme-toggle" onClick={toggleTheme} aria-label="테마 전환">
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </header>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="db-overlay" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`db-sidebar ${collapsed ? 'db-sidebar--collapsed' : ''} ${mobileOpen ? 'db-sidebar--open' : ''}`}>
        <div className="db-sidebar-logo">
          <div className="db-logo-icon">M</div>
          <span className="db-logo-text">Market Pulse</span>
        </div>
        <nav className="db-sidebar-nav" id="sidebar-nav" aria-label="메인 네비게이션">
          {NAV_ITEMS.map(item => (
            <Link
              key={item.id}
              to={item.path}
              className={`nav-item ${navSel === item.id ? 'on' : ''}`}
              onClick={handleMobileClose}
              aria-current={navSel === item.id ? 'page' : undefined}
              style={{ textDecoration: 'none' }}
            >
              <span className="db-nav-icon" aria-hidden="true">{item.icon}</span>
              <span className="db-nav-label">{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="db-sidebar-footer">
          <button className="db-theme-toggle-sidebar" onClick={toggleTheme} aria-label={theme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환'}>
            <span aria-hidden="true">{theme === 'dark' ? '☀️' : '🌙'}</span>
            <span className="db-nav-label">{theme === 'dark' ? '라이트 모드' : '다크 모드'}</span>
          </button>
          <button
            className="db-collapse-btn"
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? '사이드바 펼치기' : '사이드바 접기'}
          >{collapsed ? '→' : '← Collapse'}</button>
        </div>
      </aside>

      {/* Main */}
      <main className="db-main" id="main-content">
        <header className="db-header">
          <div>
            <h1 className="db-title">{PAGE_TITLES[navSel] ?? 'Market Overview'}</h1>
            <LiveClock />
          </div>
        </header>
        <div className="sr-only" aria-live="polite" aria-atomic="true" role="status">
          {lastRefresh && `데이터가 ${lastRefresh}에 갱신되었습니다`}
        </div>

        {navSel !== 'news' && (
          <div className="db-period-bar">
            <div className="db-period-label">
              <span style={{ fontSize: 12, fontWeight: 600 }}>Period</span>
              <span className="db-period-sub">— applies to all sections</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <PeriodPills active={globalPeriod} onChange={setGlobalPeriod} size="md" />
              {hasLocalOverrides && (
                <button
                  className="db-reset-btn"
                  onClick={() => { setLocalIndices(null); setLocalCrypto(null); setLocalCommod(null); setLocalStocks(null) }}
                >
                  Reset all overrides
                </button>
              )}
            </div>
          </div>
        )}

        <Suspense fallback={<div className="space-y-4"><Skeleton className="h-[200px] w-full" /><Skeleton className="h-[200px] w-full" /></div>}>
          {renderContent()}
        </Suspense>

        <footer className="db-footer" role="contentinfo">
          <span>Market Pulse Dashboard — Data from API</span>
          <span className="db-clock" aria-label={`최종 갱신: ${lastRefresh || '--:--:--'}`}>Last refreshed: {lastRefresh || '--:--:--'}</span>
        </footer>
      </main>
    </div>
  )
}
