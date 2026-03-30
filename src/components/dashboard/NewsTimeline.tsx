import { useMemo } from 'react'

interface NewsItem {
  id: string
  headline: string
  time: string
  tag: string
  tagColor: string
  tagBg: string
  dotColor: string
}

const MOCK_NEWS: NewsItem[] = [
  {
    id: '1',
    headline: 'Fed, 금리 동결 결정…시장 안도 랠리',
    time: '2시간 전',
    tag: '금리',
    tagColor: '#185FA5',
    tagBg: '#E6F1FB',
    dotColor: '#378ADD',
  },
  {
    id: '2',
    headline: '금 가격 2,300달러 돌파, 안전자산 수요↑',
    time: '4시간 전',
    tag: '원자재',
    tagColor: '#854F0B',
    tagBg: '#FAEEDA',
    dotColor: '#EF9F27',
  },
  {
    id: '3',
    headline: '코스피 2,640 회복…외국인 3거래일 연속 순매수',
    time: '6시간 전',
    tag: '증시',
    tagColor: '#0F6E56',
    tagBg: '#E1F5EE',
    dotColor: '#1D9E75',
  },
  {
    id: '4',
    headline: '美 CPI 예상치 소폭 상회…달러 일시 강세',
    time: '8시간 전',
    tag: '인플레',
    tagColor: '#723556',
    tagBg: '#FBEAF0',
    dotColor: '#D4537E',
  },
  {
    id: '5',
    headline: '유럽 PMI 예상 하회…유로존 경기 둔화 우려',
    time: '10시간 전',
    tag: '거시',
    tagColor: '#3C3489',
    tagBg: '#EEEDFE',
    dotColor: '#7F77DD',
  },
  {
    id: '6',
    headline: '중국 부양책 기대감에 구리 가격 강세',
    time: '12시간 전',
    tag: '원자재',
    tagColor: '#854F0B',
    tagBg: '#FAEEDA',
    dotColor: '#EF9F27',
  },
]

// Dark mode aware colors
const DARK_TAG_COLORS: Record<string, { tagColor: string; tagBg: string }> = {
  '금리': { tagColor: '#93C5FD', tagBg: 'rgba(55,138,221,0.15)' },
  '원자재': { tagColor: '#FCD34D', tagBg: 'rgba(239,159,39,0.15)' },
  '증시': { tagColor: '#6EE7B7', tagBg: 'rgba(29,158,117,0.15)' },
  '인플레': { tagColor: '#FCA5A5', tagBg: 'rgba(212,83,126,0.15)' },
  '거시': { tagColor: '#C4B5FD', tagBg: 'rgba(127,119,221,0.15)' },
}

interface NewsTimelineProps {
  filterTag?: string
}

export function NewsTimeline({ filterTag }: NewsTimelineProps) {
  const isDark = document.documentElement.classList.contains('dark')

  const news = useMemo(() => {
    const filtered = filterTag
      ? MOCK_NEWS.filter((n) => n.tag === filterTag)
      : MOCK_NEWS
    return filtered
  }, [filterTag])

  return (
    <div className="rounded-lg border border-border-dim bg-surface p-5 h-full flex flex-col">
      <h3 className="text-[11px] font-medium text-muted uppercase tracking-wider mb-3">
        뉴스 타임라인
      </h3>

      <div className="flex-1 min-h-0 overflow-y-auto">
        {news.map((item, index) => {
          const darkColors = DARK_TAG_COLORS[item.tag]
          const tagBg = isDark && darkColors ? darkColors.tagBg : item.tagBg
          const tagColor = isDark && darkColors ? darkColors.tagColor : item.tagColor

          return (
            <div
              key={item.id}
              className={`flex gap-2.5 py-3 items-start ${
                index < news.length - 1 ? 'border-b border-border-dim' : ''
              }`}
            >
              <div
                className="w-2 h-2 rounded-full mt-1 shrink-0"
                style={{ background: item.dotColor }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-[12px] text-heading leading-relaxed mb-0.5 line-clamp-2">
                  {item.headline}
                </p>
                <div className="flex items-center gap-1.5 text-[10px] text-faint">
                  <span
                    className="px-1.5 py-px rounded"
                    style={{ background: tagBg, color: tagColor }}
                  >
                    {item.tag}
                  </span>
                  {item.time}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
