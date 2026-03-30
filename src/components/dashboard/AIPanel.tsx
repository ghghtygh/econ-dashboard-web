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

function generateInsight(indicator?: Indicator, series?: IndicatorData[]): string {
  if (!indicator || !series || series.length < 2) {
    return '좌측 마켓 카드에서 지표를 클릭하면 해당 지표에 대한 AI 해설이 여기에 표시됩니다.'
  }

  const latest = series[series.length - 1]
  const prev = series[series.length - 2]
  const change = ((latest.value - prev.value) / prev.value) * 100
  const direction = change >= 0 ? '상승' : '하락'
  const absChange = Math.abs(change).toFixed(1)

  const insights: Record<string, string> = {
    STOCK: `**${indicator.name}**이(가) 전일 대비 ${absChange}% ${direction}했습니다. ${
      change >= 0
        ? '투자 심리가 개선되고 있으며, 거래량 동반 상승 시 추세 지속 가능성이 높습니다.'
        : '차익 실현 매물이 출회되고 있으며, 지지선 확인이 필요한 구간입니다.'
    }`,
    FOREX: `**${indicator.name}** 환율이 ${absChange}% ${direction}했습니다. ${
      change >= 0
        ? '달러 강세 구간에서는 수입 물가 상승 압력이 커지고, 원자재 가격에도 영향을 줍니다.'
        : '달러 약세 구간에서는 금·원자재 가격이 함께 오르는 경향이 있습니다. 수출주에는 부담이 될 수 있습니다.'
    }`,
    COMMODITY: `**${indicator.name}** 가격이 ${absChange}% ${direction}했습니다. ${
      change >= 0
        ? '안전자산 수요 증가 또는 인플레이션 헤지 수요가 반영된 것으로 보입니다.'
        : '리스크 선호 심리가 회복되면서 안전자산에서 자금이 이탈하고 있습니다.'
    }`,
    BOND: `**${indicator.name}** 금리가 ${absChange}% ${direction}했습니다. ${
      change >= 0
        ? '금리 상승은 채권 가격 하락을 의미하며, 성장주에 부담이 됩니다.'
        : '금리 하락은 유동성 완화 기대를 반영하며, 주식 시장에 호재로 작용할 수 있습니다.'
    }`,
    CRYPTO: `**${indicator.name}**이(가) ${absChange}% ${direction}했습니다. ${
      change >= 0
        ? '위험자산 선호 심리가 강해지고 있으며, 기관 자금 유입 여부를 주시해야 합니다.'
        : '변동성 확대 구간에서 레버리지 청산이 동반되었을 가능성이 있습니다.'
    }`,
    MACRO: `**${indicator.name}** 지표가 ${absChange}% ${direction}했습니다. ${
      change >= 0
        ? '경기 개선 신호로 해석될 수 있으며, 향후 통화정책 방향에 영향을 줄 수 있습니다.'
        : '경기 둔화 우려가 커지고 있으며, 방어적 포지션 전환을 고려할 시점입니다.'
    }`,
  }

  return insights[indicator.category] ?? `**${indicator.name}**이(가) ${absChange}% ${direction}했습니다.`
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

    // Simulate AI response (replace with actual API call)
    setTimeout(() => {
      setChatHistory((prev) => [
        ...prev,
        { role: 'ai', text: `"${prompt}"에 대한 답변을 준비하고 있습니다. 실제 Claude API가 연동되면 여기에 분석 결과가 표시됩니다.` },
      ])
      setIsLoading(false)
    }, 1000)
  }

  return (
    <div className="rounded-lg border border-border-dim bg-surface p-5 h-full flex flex-col">
      {/* Header */}
      <div className="mb-3">
        <span className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
          AI 해설
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

