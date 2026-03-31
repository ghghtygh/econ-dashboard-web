import { useState, useMemo } from 'react'
import { Send, Loader2, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Indicator, IndicatorData } from '@/types/indicator'

interface AIPanelProps {
  selectedIndicator?: Indicator
  series?: IndicatorData[]
  allIndicators?: Indicator[]
}

interface ChipSuggestion {
  label: string
  prompt: string
}

function mean(values: number[]): number {
  return values.reduce((s, v) => s + v, 0) / values.length
}

function stddev(values: number[]): number {
  const m = mean(values)
  return Math.sqrt(values.reduce((s, v) => s + (v - m) ** 2, 0) / values.length)
}

function detectTrend(values: number[]): 'strong_up' | 'up' | 'flat' | 'down' | 'strong_down' {
  if (values.length < 5) return 'flat'
  const recent = values.slice(-5)
  let rises = 0
  for (let i = 1; i < recent.length; i++) {
    if (recent[i] > recent[i - 1]) rises++
  }
  const totalChange = ((recent[recent.length - 1] - recent[0]) / recent[0]) * 100
  if (rises >= 4 && totalChange > 2) return 'strong_up'
  if (rises >= 3) return 'up'
  if (rises <= 1 && totalChange < -2) return 'strong_down'
  if (rises <= 1) return 'down'
  return 'flat'
}

const TREND_LABEL: Record<string, string> = {
  strong_up: '강한 상승 추세',
  up: '완만한 상승 추세',
  flat: '횡보',
  down: '완만한 하락 추세',
  strong_down: '강한 하락 추세',
}

const UNIT_LABEL: Record<string, string> = {
  STOCK: '지수',
  FOREX: '환율',
  COMMODITY: '가격',
  BOND: '금리',
  CRYPTO: '가격',
  MACRO: '지표',
}

function generateInsight(indicator?: Indicator, series?: IndicatorData[]): string {
  if (!indicator || !series || series.length < 2) {
    return '지표를 선택하면 실제 데이터 기반 분석을 제공합니다.'
  }

  const values = series.map((d) => d.value)
  const latest = series[series.length - 1]
  const prev = series[series.length - 2]
  const dayChange = ((latest.value - prev.value) / prev.value) * 100
  const direction = dayChange >= 0 ? '상승' : '하락'
  const absChange = Math.abs(dayChange).toFixed(2)
  const unitLabel = UNIT_LABEL[indicator.category] ?? '값'

  const parts: string[] = []

  parts.push(`**${indicator.name}** ${unitLabel}이 전일 대비 **${absChange}%** ${direction}하여 **${latest.value.toLocaleString()}${indicator.unit ? ` ${indicator.unit}` : ''}**입니다.`)

  if (values.length >= 5) {
    const trend = detectTrend(values)
    parts.push(`최근 5일 추세: **${TREND_LABEL[trend]}**.`)
  }

  if (values.length >= 20) {
    const ma20 = mean(values.slice(-20))
    const maRatio = ((latest.value - ma20) / ma20) * 100
    const maDir = maRatio >= 0 ? '위' : '아래'
    parts.push(`20일 이동평균(${ma20.toLocaleString(undefined, { maximumFractionDigits: 2 })}) 대비 **${Math.abs(maRatio).toFixed(1)}%** ${maDir}에 위치합니다.`)
  }

  if (values.length >= 10) {
    const recentValues = values.slice(-10)
    const vol = stddev(recentValues) / mean(recentValues) * 100
    if (vol > 3) {
      parts.push(`최근 10일 변동성(CV)이 ${vol.toFixed(1)}%로 **높은 편**입니다.`)
    } else if (vol > 1.5) {
      parts.push(`최근 10일 변동성(CV)이 ${vol.toFixed(1)}%로 보통 수준입니다.`)
    }

    const maxVal = Math.max(...recentValues)
    const minVal = Math.min(...recentValues)
    if (latest.value === maxVal) {
      parts.push('현재 가격은 **10일 최고치**입니다.')
    } else if (latest.value === minVal) {
      parts.push('현재 가격은 **10일 최저치**입니다.')
    }
  }

  if (values.length >= 7) {
    const weekChange = ((latest.value - values[values.length - 6]) / values[values.length - 6]) * 100
    const weekDir = weekChange >= 0 ? '상승' : '하락'
    parts.push(`주간 변동: **${Math.abs(weekChange).toFixed(2)}%** ${weekDir}.`)
  }

  return parts.join(' ')
}

function getSuggestions(indicator?: Indicator): ChipSuggestion[] {
  if (!indicator) {
    return [
      { label: '오늘 시장 요약', prompt: '오늘 주요 경제 지표 변동을 요약해줘' },
      { label: '초보자 가이드', prompt: '경제 지표 보는 법을 초보자에게 설명해줘' },
      { label: '금리와 주가 관계', prompt: '금리 변동이 주식 시장에 미치는 영향을 설명해줘' },
    ]
  }

  const chipMap: Record<string, ChipSuggestion[]> = {
    STOCK: [
      { label: '기술적 분석', prompt: `${indicator.name}의 기술적 분석 포인트를 알려줘` },
      { label: '섹터 영향', prompt: `${indicator.name} 변동이 관련 섹터에 미치는 영향은?` },
      { label: '과거 패턴 비교', prompt: `${indicator.name}의 현재 움직임과 유사한 과거 패턴이 있어?` },
    ],
    FOREX: [
      { label: '수출 영향', prompt: `${indicator.name} 변동이 한국 수출에 미치는 영향을 설명해줘` },
      { label: '금리 차이', prompt: `한미 금리 차이가 환율에 미치는 영향은?` },
      { label: '원자재 연관', prompt: `환율 변동과 원자재 가격의 관계를 설명해줘` },
    ],
    COMMODITY: [
      { label: '인플레 영향', prompt: `${indicator.name} 가격이 인플레이션에 미치는 영향은?` },
      { label: '달러 역상관', prompt: `금과 달러의 역상관 관계를 쉽게 설명해줘` },
      { label: '공급 요인', prompt: `${indicator.name} 가격에 영향을 주는 공급 요인은?` },
    ],
    BOND: [
      { label: '수익률 곡선', prompt: '수익률 곡선이 뒤집히면 어떤 의미인지 설명해줘' },
      { label: '주식 영향', prompt: '채권 금리 변동이 주식 시장에 미치는 영향은?' },
      { label: '인플레 기대', prompt: '채권 시장에서 읽을 수 있는 인플레이션 기대는?' },
    ],
    CRYPTO: [
      { label: '규제 이슈', prompt: '최근 암호화폐 규제 동향이 가격에 미치는 영향은?' },
      { label: '상관관계', prompt: `${indicator.name}과 나스닥의 상관관계를 설명해줘` },
      { label: '온체인 지표', prompt: `${indicator.name}의 주요 온체인 지표 상태는?` },
    ],
    MACRO: [
      { label: '정책 영향', prompt: `${indicator.name}이 통화정책에 미치는 영향은?` },
      { label: '경기 사이클', prompt: '현재 경기 사이클에서 어떤 위치에 있는지 설명해줘' },
      { label: '초보자 요약', prompt: `${indicator.name}을 초보자에게 쉽게 설명해줘` },
    ],
  }

  return chipMap[indicator.category] ?? [
    { label: '상세 분석', prompt: `${indicator.name}의 상세 분석을 해줘` },
    { label: '초보자 요약', prompt: `현재 경제 상황을 초보자에게 설명해줘` },
  ]
}

function renderBoldText(text: string) {
  const parts = text.split(/\*\*(.*?)\*\*/g)
  return parts.map((part, i) =>
    i % 2 === 1 ? <strong key={i} className="font-medium">{part}</strong> : part,
  )
}

export function AIPanel({ selectedIndicator, series }: AIPanelProps) {
  const [chatInput, setChatInput] = useState('')
  const [chatHistory, setChatHistory] = useState<Array<{ role: 'user' | 'ai'; text: string }>>([])
  const [isLoading, setIsLoading] = useState(false)

  const insight = useMemo(
    () => generateInsight(selectedIndicator, series),
    [selectedIndicator, series],
  )
  const suggestions = useMemo(() => getSuggestions(selectedIndicator), [selectedIndicator])

  const handleSend = (prompt: string) => {
    if (!prompt.trim() || isLoading) return
    setChatHistory((prev) => [...prev, { role: 'user', text: prompt }])
    setChatInput('')
    setIsLoading(true)

    setChatHistory((prev) => [
      ...prev,
      { role: 'ai', text: '채팅 분석 기능은 아직 준비 중입니다. 상단의 데이터 기반 분석과 추천 질문 칩을 활용해주세요.' },
    ])
    setIsLoading(false)
  }

  return (
    <div className="rounded-lg border border-border-dim bg-surface p-5 h-full flex flex-col">
      {/* Header */}
      <div className="mb-3">
        <span className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
          시장 분석
        </span>
      </div>

      {/* Main Insight / Empty State */}
      {!selectedIndicator && chatHistory.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-6">
          <Sparkles size={32} className="text-indigo-400/50 mb-3" />
          <p className="text-[13px] text-muted leading-relaxed max-w-[240px]">
            {renderBoldText(insight)}
          </p>
        </div>
      ) : (
        <>
          <div className="text-[13px] text-body leading-relaxed mb-3 flex-shrink-0">
            {renderBoldText(insight)}
          </div>

          {/* Chat History */}
          {chatHistory.length > 0 && (
        <div className="flex-1 min-h-0 overflow-y-auto space-y-2 mb-3 border-t border-border-dim pt-3">
          {chatHistory.map((msg, i) => (
            <div
              key={i}
              className={cn(
                'text-[12px] leading-relaxed rounded-lg px-3 py-2',
                msg.role === 'user'
                  ? 'bg-blue-50 text-blue-900 dark:bg-blue-900/20 dark:text-blue-200 ml-6'
                  : 'bg-elevated text-body mr-6',
              )}
            >
              {msg.text}
            </div>
          ))}
          {isLoading && (
            <div className="flex items-center gap-1.5 text-muted text-xs mr-6">
              <Loader2 size={12} className="animate-spin" />
              분석 중...
            </div>
          )}
        </div>
      )}
        </>
      )}

      {/* Suggestion Chips */}
      <div className="flex gap-1.5 flex-wrap mb-3">
        {suggestions.map((chip) => (
          <button
            key={chip.label}
            onClick={() => handleSend(chip.prompt)}
            className="text-[11px] px-2.5 py-1 rounded-full border border-border-dim text-muted bg-elevated hover:text-heading hover:border-border-mid transition-colors"
          >
            {chip.label} ↗
          </button>
        ))}
      </div>

      {/* Chat Input */}
      <div className="flex gap-2 mt-auto">
        <input
          type="text"
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend(chatInput)}
          placeholder="경제 지표에 대해 질문하세요..."
          className="flex-1 text-xs bg-elevated border border-border-dim rounded-lg px-3 py-2 text-body placeholder:text-faint focus:outline-none focus:border-blue-400/50 transition-colors"
        />
        <button
          onClick={() => handleSend(chatInput)}
          disabled={!chatInput.trim() || isLoading}
          className="p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <Send size={14} />
        </button>
      </div>
    </div>
  )
}

