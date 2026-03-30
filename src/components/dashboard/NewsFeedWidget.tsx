import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useNewsList } from '@/hooks/useNews'
import type { NewsArticle, NewsCategory } from '@/types/news'

const CATEGORY_LABELS: Record<string, string> = {
  ALL: '전체',
  STOCK: '주식',
  FOREX: '외환',
  COMMODITY: '원자재',
  BOND: '채권',
  CRYPTO: '암호화폐',
  MACRO: '거시경제',
}

const CATEGORY_COLORS: Record<
  string,
  { bg: string; text: string; dot: string; darkBg: string; darkText: string }
> = {
  STOCK: { bg: '#E6F1FB', text: '#185FA5', dot: '#378ADD', darkBg: 'rgba(55,138,221,0.15)', darkText: '#93C5FD' },
  FOREX: { bg: '#FEE2E2', text: '#991B1B', dot: '#E24B4A', darkBg: 'rgba(226,75,74,0.15)', darkText: '#FCA5A5' },
  CRYPTO: { bg: '#FAEEDA', text: '#854F0B', dot: '#EF9F27', darkBg: 'rgba(239,159,39,0.15)', darkText: '#FCD34D' },
  MACRO: { bg: '#EEEDFE', text: '#3C3489', dot: '#7F77DD', darkBg: 'rgba(127,119,221,0.15)', darkText: '#C4B5FD' },
  BOND: { bg: '#E1F5EE', text: '#0F6E56', dot: '#1D9E75', darkBg: 'rgba(29,158,117,0.15)', darkText: '#6EE7B7' },
  COMMODITY: { bg: '#FEF3C7', text: '#92400E', dot: '#F59E0B', darkBg: 'rgba(245,158,11,0.15)', darkText: '#FDE68A' },
}

const RELATED_INDICATORS: Record<NewsCategory, string> = {
  STOCK: 'S&P 500, KOSPI, NASDAQ',
  FOREX: 'USD/KRW, EUR/USD, DXY',
  CRYPTO: 'BTC, ETH, 김치 프리미엄',
  MACRO: 'CPI, Fed Funds Rate, GDP',
  BOND: '미국 10년물, 한국 3년물, 장단기 스프레드',
  COMMODITY: 'WTI, 금, 구리',
}

const ALL_CATEGORIES: NewsCategory[] = ['STOCK', 'FOREX', 'CRYPTO', 'MACRO', 'BOND', 'COMMODITY']

const MOCK_NEWS: NewsArticle[] = [
  {
    id: 1,
    title: 'Fed, 금리 동결 결정…시장 안도 랠리',
    summary: null,
    url: '#',
    source: 'Reuters',
    author: null,
    imageUrl: null,
    category: 'MACRO',
    publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
  },
  {
    id: 2,
    title: '금 가격 2,300달러 돌파, 안전자산 수요↑',
    summary: null,
    url: '#',
    source: 'Bloomberg',
    author: null,
    imageUrl: null,
    category: 'COMMODITY',
    publishedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
  },
  {
    id: 3,
    title: '코스피 2,640 회복…외국인 3거래일 연속 순매수',
    summary: null,
    url: '#',
    source: '연합뉴스',
    author: null,
    imageUrl: null,
    category: 'STOCK',
    publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
  },
  {
    id: 4,
    title: '美 CPI 예상치 소폭 상회…달러 일시 강세',
    summary: null,
    url: '#',
    source: 'CNBC',
    author: null,
    imageUrl: null,
    category: 'FOREX',
    publishedAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
  },
  {
    id: 5,
    title: '유럽 PMI 예상 하회…유로존 경기 둔화 우려',
    summary: null,
    url: '#',
    source: 'FT',
    author: null,
    imageUrl: null,
    category: 'MACRO',
    publishedAt: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
  },
  {
    id: 6,
    title: '비트코인 7만 달러 재돌파…ETF 자금 유입 지속',
    summary: null,
    url: '#',
    source: 'CoinDesk',
    author: null,
    imageUrl: null,
    category: 'CRYPTO',
    publishedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
  },
]

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return '방금 전'
  if (diffMin < 60) return `${diffMin}분 전`
  const diffHour = Math.floor(diffMin / 60)
  if (diffHour < 24) return `${diffHour}시간 전`
  const diffDay = Math.floor(diffHour / 24)
  if (diffDay < 7) return `${diffDay}일 전`
  return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
}

export function NewsFeedWidget() {
  const [selectedCategory, setSelectedCategory] = useState<NewsCategory | undefined>()
  const { data, isLoading, isError } = useNewsList(selectedCategory, 0, 10)
  const isDark =
    typeof document !== 'undefined' && document.documentElement.classList.contains('dark')

  // API에서 데이터를 가져왔지만 비어있는 경우와, 아예 실패한 경우를 구분
  const hasApiData = !isError && !isLoading && data?.content && data.content.length > 0
  const articles: NewsArticle[] = useMemo(() => {
    if (hasApiData) {
      return data!.content.slice(0, 10)
    }
    // 로딩 중이면 빈 배열 (skeleton 대신 잠시 비움)
    if (isLoading) return []
    // API 에러 또는 빈 응답 → mock fallback
    if (selectedCategory) {
      return MOCK_NEWS.filter((n) => n.category === selectedCategory)
    }
    return MOCK_NEWS
  }, [hasApiData, data, isLoading, selectedCategory])

  return (
    <div className="rounded-lg border border-border-dim bg-surface p-5 h-full flex flex-col">
      {/* Header */}
      <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">
        경제 뉴스
      </h3>

      {/* Category tabs */}
      <div className="flex items-center gap-1 flex-wrap mb-3">
        <button
          onClick={() => setSelectedCategory(undefined)}
          className={tabClass(!selectedCategory)}
        >
          전체
        </button>
        {ALL_CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={tabClass(selectedCategory === cat)}
          >
            {CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>

      {/* API fallback notice */}
      {!hasApiData && !isLoading && (
        <p className="text-[10px] text-faint mb-2">API 연결 대기 중 — 샘플 데이터 표시</p>
      )}

      {/* News list */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {articles.length === 0 ? (
          <p className="text-xs text-muted py-6 text-center">뉴스가 없습니다</p>
        ) : (
          articles.map((article, index) => {
            const colors = CATEGORY_COLORS[article.category]
            const tagBg = isDark && colors ? colors.darkBg : colors?.bg ?? '#f1f5f9'
            const tagText = isDark && colors ? colors.darkText : colors?.text ?? '#334155'
            const dotColor = colors?.dot ?? '#94a3b8'
            const relatedHint = RELATED_INDICATORS[article.category]

            return (
              <div
                key={article.id}
                className={cn(
                  'flex gap-2.5 py-3 items-start',
                  index < articles.length - 1 && 'border-b border-border-dim',
                )}
              >
                {/* Dot */}
                <div
                  className="w-2 h-2 rounded-full mt-1 shrink-0"
                  style={{ background: dotColor }}
                />

                {/* Content */}
                <div className="flex-1 min-w-0">
                  {/* Title */}
                  <a
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[12px] text-heading leading-relaxed mb-0.5 line-clamp-2 hover:text-blue-400 transition-colors flex items-start gap-1 group"
                  >
                    <span className="flex-1">{article.title}</span>
                    <ExternalLink
                      size={10}
                      className="shrink-0 mt-0.5 text-faint opacity-0 group-hover:opacity-100 transition-opacity"
                    />
                  </a>

                  {/* Meta row */}
                  <div className="flex items-center gap-1.5 text-[10px] text-faint mt-0.5">
                    <span
                      className="px-1.5 py-px rounded font-medium"
                      style={{ background: tagBg, color: tagText }}
                    >
                      {CATEGORY_LABELS[article.category] ?? article.category}
                    </span>
                    {article.source && <span>{article.source}</span>}
                    <span>{formatTimeAgo(article.publishedAt)}</span>
                  </div>

                  {/* Related indicators hint */}
                  {relatedHint && (
                    <p className="text-[10px] text-faint mt-1">
                      관련 지표: {relatedHint}
                    </p>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Footer link */}
      <div className="pt-3 border-t border-border-dim mt-2">
        <Link
          to="/news"
          className="text-[11px] text-muted hover:text-heading transition-colors"
        >
          더보기 &rarr;
        </Link>
      </div>
    </div>
  )
}

function tabClass(active: boolean): string {
  return cn(
    'text-[10px] px-2 py-1 rounded-full border transition-colors cursor-pointer',
    active
      ? 'bg-elevated text-heading border-border-mid'
      : 'border-border-dim text-muted hover:text-heading hover:border-border-mid',
  )
}
