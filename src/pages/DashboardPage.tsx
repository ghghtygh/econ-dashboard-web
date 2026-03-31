import { useState, useEffect, useCallback } from 'react'
import { useIndicators, useIndicatorSeries } from '@/hooks/useIndicators'
import { PeriodPills, Sparkline } from '@/components/dashboard/primitives'
import { groupIndicators, fmtNum, chgColor, chgText, CATEGORY_COLORS, CATEGORY_ICONS } from '@/components/dashboard/primitives.helpers'
import type { PeriodId } from '@/components/dashboard/primitives.helpers'
import { GlobalIndicesSection } from '@/components/dashboard/GlobalIndicesSection'
import { CommoditiesSection } from '@/components/dashboard/CommoditiesSection'
import { CryptoSection } from '@/components/dashboard/CryptoSection'
import { FearGreedSection } from '@/components/dashboard/FearGreedSection'
import { IndicatorTableSection } from '@/components/dashboard/IndicatorTableSection'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import { useNewsList } from '@/hooks/useNews'

const NAV_ITEMS = [
  { id: 'overview', label: 'Overview', icon: '◫' },
  { id: 'indices', label: 'Indices', icon: '◩' },
  { id: 'stocks', label: 'Stocks', icon: '◧' },
  { id: 'crypto', label: 'Crypto', icon: '◈' },
  { id: 'commodities', label: 'Commodities', icon: '◆' },
  { id: 'news', label: 'News Feed', icon: '◪' },
]

const PAGE_TITLES: Record<string, string> = {
  overview: 'Market Overview',
  indices: 'Global Indices',
  stocks: 'Stocks',
  crypto: 'Cryptocurrency',
  commodities: 'Commodities',
  news: 'News Feed',
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
  const [time, setTime] = useState(new Date())
  const [collapsed, setCollapsed] = useState(false)
  const [navSel, setNavSel] = useState('overview')
  const [globalPeriod, setGlobalPeriod] = useState<PeriodId>('1M')
  const [localIndices, setLocalIndices] = useState<PeriodId | null>(null)
  const [localCrypto, setLocalCrypto] = useState<PeriodId | null>(null)
  const [localCommod, setLocalCommod] = useState<PeriodId | null>(null)
  const [localStocks, setLocalStocks] = useState<PeriodId | null>(null)
  const [stockTab, setStockTab] = useState('STOCK')

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

  // News data for the news view
  const [newsPage, setNewsPage] = useState(0)
  const { data: newsData, isLoading: newsLoading } = useNewsList(undefined, newsPage)
  const newsArticles = newsData?.content ?? []
  const newsTotalPages = newsData?.totalPages ?? 0

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const fmt = (d: Date) => d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
  const fmtDate = (d: Date) => d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })

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
            {/* Detailed indices table */}
            <ErrorBoundary>
              <div className="card" style={{ marginTop: 12 }}>
                <h3 style={{ fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 14 }}>All Index Indicators</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 80px 80px 70px', padding: '0 0 8px', gap: 8, borderBottom: '1px solid #E2E8F0' }}>
                  {['Name', 'Value', 'Change', 'Trend', 'Unit'].map((h, i) => (
                    <span key={h} style={{ fontSize: 10, color: '#94A3B8', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', textAlign: i > 0 ? 'right' : 'left' }}>
                      {h}
                    </span>
                  ))}
                </div>
                {[...stockIndicators, ...macroIndicators, ...forexIndicators, ...bondIndicators].map((item, i) => {
                  const sparkData = item.series.map(d => d.value)
                  return (
                    <div key={item.indicator.id} className="stock-row" style={{ gridTemplateColumns: '1fr 100px 80px 80px 70px', animation: 'fadeUp 0.3s ease both', animationDelay: `${0.1 + i * 0.03}s` }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 500, color: '#1E293B' }}>{item.indicator.name}</div>
                        <div style={{ fontSize: 10, color: '#94A3B8', fontFamily: "'DM Mono', monospace" }}>{item.indicator.symbol}</div>
                      </div>
                      <div style={{ textAlign: 'right', fontFamily: "'DM Mono', monospace", fontSize: 13, fontWeight: 500, color: '#0F172A' }}>
                        {item.latest ? fmtNum(item.latest.value) : '--'}
                      </div>
                      <div style={{ textAlign: 'right', fontSize: 12, fontWeight: 600, color: chgColor(item.change) }}>{chgText(item.change)}</div>
                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <Sparkline data={sparkData} color={chgColor(item.change)} width={60} height={18} />
                      </div>
                      <div style={{ textAlign: 'right', fontSize: 11, color: '#94A3B8' }}>{item.indicator.unit}</div>
                    </div>
                  )
                })}
                {[...stockIndicators, ...macroIndicators, ...forexIndicators, ...bondIndicators].length === 0 && (
                  <div style={{ textAlign: 'center', color: '#94A3B8', fontSize: 13, padding: 32 }}>Loading indicators...</div>
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
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12, marginTop: 16 }}>
                {stockIndicators.map((item, i) => {
                  const sparkData = item.series.map(d => d.value)
                  return (
                    <div key={item.indicator.id} className="card" style={{ padding: 16, animationDelay: `${i * 0.05}s` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#1E293B' }}>{item.indicator.name}</div>
                          <div style={{ fontSize: 10, color: '#94A3B8', fontFamily: "'DM Mono', monospace" }}>{item.indicator.symbol}</div>
                        </div>
                        <span className="badge" style={{ background: item.change >= 0 ? '#F0FDF4' : '#FEF2F2', color: chgColor(item.change) }}>
                          {chgText(item.change)}
                        </span>
                      </div>
                      <div style={{ fontSize: 20, fontWeight: 700, fontFamily: "'DM Mono', monospace", color: '#0F172A', letterSpacing: '-0.02em', marginBottom: 8 }}>
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
              {cryptoIndicators.length === 0 ? (
                <div className="card" style={{ gridColumn: '1/-1', textAlign: 'center', color: '#94A3B8', fontSize: 13, padding: 40 }}>No crypto data available</div>
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
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#1E293B' }}>{c.indicator.name}</div>
                        <div style={{ fontSize: 11, color: '#94A3B8' }}>{c.indicator.symbol}</div>
                      </div>
                      <span className="badge" style={{ background: c.change >= 0 ? '#F0FDF4' : '#FEF2F2', color: chgColor(c.change) }}>
                        {chgText(c.change)}
                      </span>
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "'DM Mono', monospace", color: '#0F172A', letterSpacing: '-0.02em', marginBottom: 10 }}>
                      {c.latest ? fmtNum(c.latest.value) : '--'}
                    </div>
                    <Sparkline data={sparkData} color={chgColor(c.change)} width={240} height={36} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontSize: 11, color: '#94A3B8' }}>
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
              {commodityIndicators.length === 0 ? (
                <div className="card" style={{ gridColumn: '1/-1', textAlign: 'center', color: '#94A3B8', fontSize: 13, padding: 40 }}>No commodity data available</div>
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
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#1E293B' }}>{c.indicator.name}</div>
                        <div style={{ fontSize: 11, color: '#94A3B8' }}>{c.indicator.unit}</div>
                      </div>
                      <span className="badge" style={{ background: c.change >= 0 ? '#F0FDF4' : '#FEF2F2', color: chgColor(c.change) }}>
                        {chgText(c.change)}
                      </span>
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "'DM Mono', monospace", color: '#0F172A', letterSpacing: '-0.02em', marginBottom: 10 }}>
                      {c.latest ? fmtNum(c.latest.value) : '--'}
                    </div>
                    <Sparkline data={sparkData} color={chgColor(c.change)} width={260} height={36} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontSize: 11, color: '#94A3B8' }}>
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
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="card" style={{ height: 160, animation: 'pulse 1.5s ease infinite' }} />
                ))}
              </div>
            ) : newsArticles.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', color: '#94A3B8', fontSize: 13, padding: 40 }}>뉴스가 없습니다</div>
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 12 }}>
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
                        <span style={{ fontSize: 10, color: '#94A3B8' }}>{formatTimeAgo(article.publishedAt)}</span>
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#1E293B', marginBottom: 6, lineHeight: 1.4 }}>{article.title}</div>
                      {article.summary && (
                        <div style={{ fontSize: 12, color: '#64748B', lineHeight: 1.5, flex: 1, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const }}>
                          {article.summary}
                        </div>
                      )}
                      {article.source && (
                        <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 8, borderTop: '1px solid #F1F5F9', paddingTop: 8 }}>
                          {article.source}
                        </div>
                      )}
                    </a>
                  ))}
                </div>
                {newsTotalPages > 1 && (
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20 }}>
                    <button
                      onClick={() => setNewsPage(p => Math.max(0, p - 1))}
                      disabled={newsPage === 0}
                      style={{ fontSize: 12, padding: '6px 14px', borderRadius: 6, border: '1px solid #E2E8F0', background: '#fff', color: newsPage === 0 ? '#CBD5E1' : '#475569', cursor: newsPage === 0 ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}
                    >이전</button>
                    <span style={{ fontSize: 12, color: '#64748B', display: 'flex', alignItems: 'center' }}>{newsPage + 1} / {newsTotalPages}</span>
                    <button
                      onClick={() => setNewsPage(p => Math.min(newsTotalPages - 1, p + 1))}
                      disabled={newsPage >= newsTotalPages - 1}
                      style={{ fontSize: 12, padding: '6px 14px', borderRadius: 6, border: '1px solid #E2E8F0', background: '#fff', color: newsPage >= newsTotalPages - 1 ? '#CBD5E1' : '#475569', cursor: newsPage >= newsTotalPages - 1 ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}
                    >다음</button>
                  </div>
                )}
              </>
            )}
          </ErrorBoundary>
        )

      default: // overview
        return (
          <>
            {/* Global Indices */}
            <ErrorBoundary>
              <GlobalIndicesSection
                topIndices={topIndices}
                localPeriod={localIndices}
                effectivePeriod={effectivePeriod(localIndices)}
                onLocalChange={setLocalIndices}
                onReset={() => setLocalIndices(null)}
              />
            </ErrorBoundary>

            {/* Middle Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr 200px', gap: 12, marginBottom: 20 }}>
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

            {/* Indicator Table */}
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
          </>
        )
    }
  }

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
              <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.03em', color: '#0F172A', marginBottom: 5 }}>{PAGE_TITLES[navSel] ?? 'Market Overview'}</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#94A3B8', fontSize: 13 }}>
                <span className="dot-live" />
                <span style={{ fontFamily: "'DM Mono', monospace", fontWeight: 500, color: '#64748B' }}>{fmt(time)}</span>
                <span style={{ color: '#CBD5E1' }}>·</span>
                <span>{fmtDate(time)}</span>
              </div>
            </div>
          </div>

          {/* Global Period Bar (hidden on news page) */}
          {navSel !== 'news' && (
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
          )}

          {renderContent()}

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
