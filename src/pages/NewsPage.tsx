import { useState } from 'react'
import { ExternalLink, Clock, User, ChevronLeft, ChevronRight, AlertCircle, Newspaper } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useNewsList } from '@/hooks/useNews'
import type { NewsCategory } from '@/types/news'

const CATEGORY_LABELS: Record<string, string> = {
  ALL: '전체',
  STOCK: '주식',
  FOREX: '외환',
  COMMODITY: '원자재',
  BOND: '채권',
  CRYPTO: '암호화폐',
  MACRO: '거시경제',
}

const CATEGORY_COLORS: Record<string, { bg: string; text: string; darkBg: string; darkText: string }> = {
  STOCK: { bg: '#E6F1FB', text: '#185FA5', darkBg: 'rgba(55,138,221,0.15)', darkText: '#93C5FD' },
  FOREX: { bg: '#FEE2E2', text: '#991B1B', darkBg: 'rgba(226,75,74,0.15)', darkText: '#FCA5A5' },
  CRYPTO: { bg: '#FAEEDA', text: '#854F0B', darkBg: 'rgba(239,159,39,0.15)', darkText: '#FCD34D' },
  MACRO: { bg: '#EEEDFE', text: '#3C3489', darkBg: 'rgba(127,119,221,0.15)', darkText: '#C4B5FD' },
  BOND: { bg: '#E1F5EE', text: '#0F6E56', darkBg: 'rgba(29,158,117,0.15)', darkText: '#6EE7B7' },
  COMMODITY: { bg: '#FEF3C7', text: '#92400E', darkBg: 'rgba(245,158,11,0.15)', darkText: '#FDE68A' },
}

const ALL_CATEGORIES: NewsCategory[] = ['STOCK', 'FOREX', 'CRYPTO', 'MACRO', 'BOND', 'COMMODITY']

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

export function NewsPage() {
  const [category, setCategory] = useState<NewsCategory | undefined>()
  const [page, setPage] = useState(0)
  const { data, isLoading, isError } = useNewsList(category, page)
  const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark')

  const articles = data?.content ?? []
  const totalPages = data?.totalPages ?? 0

  return (
    <main className="dash-container">
      {/* Header */}
      <div className="pb-6 mb-6 border-b border-border-dim">
        <h1 className="text-lg font-semibold text-heading mb-1">경제 뉴스</h1>
        <p className="text-sm text-muted">카테고리별 경제 뉴스를 확인하세요</p>
      </div>

      {/* Category Filter */}
      <div className="flex items-center gap-1.5 flex-wrap mb-6">
        <button
          onClick={() => { setCategory(undefined); setPage(0) }}
          className={tabClass(!category)}
        >
          {CATEGORY_LABELS.ALL}
        </button>
        {ALL_CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => { setCategory(cat); setPage(0) }}
            className={tabClass(category === cat)}
          >
            {CATEGORY_LABELS[cat] ?? cat}
          </button>
        ))}
      </div>

      {/* News Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-52 rounded-lg border border-border-dim bg-surface animate-pulse" />
          ))}
        </div>
      ) : isError ? (
        <div className="text-center py-16">
          <div className="flex justify-center mb-3"><AlertCircle size={40} className="text-faint" /></div>
          <p className="text-muted text-sm">뉴스를 불러올 수 없습니다</p>
          <p className="text-faint text-xs mt-1">API 연결을 확인해주세요</p>
        </div>
      ) : articles.length === 0 ? (
        <div className="text-center py-16">
          <div className="flex justify-center mb-3"><Newspaper size={40} className="text-faint" /></div>
          <p className="text-muted text-sm">뉴스가 없습니다</p>
          <p className="text-faint text-xs mt-1">다른 카테고리를 선택해보세요</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {articles.map((article) => {
              const colors = CATEGORY_COLORS[article.category]
              const tagBg = isDark && colors ? colors.darkBg : colors?.bg ?? '#f1f5f9'
              const tagText = isDark && colors ? colors.darkText : colors?.text ?? '#334155'

              return (
                <a
                  key={article.id}
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group rounded-lg border border-border-dim bg-surface p-5 hover:border-border-mid transition-colors flex flex-col"
                >
                  {/* Category badge */}
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className="text-[10px] font-medium px-2 py-0.5 rounded"
                      style={{ background: tagBg, color: tagText }}
                    >
                      {CATEGORY_LABELS[article.category] ?? article.category}
                    </span>
                    <ExternalLink size={12} className="text-faint group-hover:text-muted transition-colors" />
                  </div>

                  {/* Title */}
                  <h3 className="text-sm font-medium text-heading mb-2 line-clamp-2 group-hover:text-blue-400 transition-colors">
                    {article.title}
                  </h3>

                  {/* Summary */}
                  {article.summary && (
                    <p className="text-xs text-muted line-clamp-2 mb-3 flex-1">
                      {article.summary}
                    </p>
                  )}

                  {/* Meta */}
                  <div className="flex items-center gap-3 mt-auto pt-3 border-t border-border-dim text-[10px] text-faint">
                    <span className="flex items-center gap-1">
                      <Clock size={10} />
                      {formatTimeAgo(article.publishedAt)}
                    </span>
                    {article.source && (
                      <span className="flex items-center gap-1">
                        <User size={10} />
                        {article.source}
                      </span>
                    )}
                  </div>
                </a>
              )
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className={cn(
                  'flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border transition-colors',
                  page === 0
                    ? 'border-border-dim text-faint cursor-not-allowed'
                    : 'border-border-dim text-muted hover:text-heading hover:border-border-mid',
                )}
              >
                <ChevronLeft size={14} />
                이전
              </button>
              <span className="text-xs text-muted">
                {page + 1} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className={cn(
                  'flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border transition-colors',
                  page >= totalPages - 1
                    ? 'border-border-dim text-faint cursor-not-allowed'
                    : 'border-border-dim text-muted hover:text-heading hover:border-border-mid',
                )}
              >
                다음
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </>
      )}
    </main>
  )
}

function tabClass(active: boolean) {
  return `text-xs px-3 py-1.5 rounded-full border transition-colors cursor-pointer ${
    active
      ? 'bg-elevated text-heading border-border-mid'
      : 'border-border-dim text-muted hover:text-heading hover:border-border-mid'
  }`
}

export default NewsPage
