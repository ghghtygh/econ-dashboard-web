import { Lightbulb } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SEVERITY_CONFIG } from './AlertRuleModal'
import type { AlertCondition, AlertRule, AlertSeverity } from '@/types/alert'
import type { Indicator } from '@/types/indicator'

export interface PresetRule {
  indicatorName: string
  condition: AlertCondition
  threshold: number
  severity: AlertSeverity
  message: string
  description: string
}

export const PRESET_RULES: PresetRule[] = [
  {
    indicatorName: 'VIX',
    condition: 'above',
    threshold: 30,
    severity: 'danger',
    message: 'VIX가 30을 초과했습니다. 시장 변동성이 매우 높습니다.',
    description: 'VIX > 30 — 시장 공포 구간 진입',
  },
  {
    indicatorName: '장단기 금리차 (10Y-2Y)',
    condition: 'below',
    threshold: 0,
    severity: 'warning',
    message: '장단기 금리차가 역전되었습니다. 경기 침체 신호에 주의하세요.',
    description: '장단기 금리차 < 0 — 수익률 곡선 역전',
  },
  {
    indicatorName: 'CPI',
    condition: 'above',
    threshold: 5,
    severity: 'warning',
    message: 'CPI가 5%를 초과했습니다. 고인플레이션 구간입니다.',
    description: 'CPI > 5% — 고인플레이션 경고',
  },
  {
    indicatorName: 'USD/KRW',
    condition: 'above',
    threshold: 1400,
    severity: 'danger',
    message: '달러/원 환율이 1400원을 초과했습니다. 외환시장 경고 구간입니다.',
    description: '달러/원 > 1400 — 외환시장 경고',
  },
]

interface AlertPresetListProps {
  rules: AlertRule[]
  indicators: Indicator[]
  onAddPreset: (preset: PresetRule) => void
}

export function AlertPresetList({ rules, indicators: _indicators, onAddPreset }: AlertPresetListProps) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2">
        <Lightbulb size={13} className="text-amber-500" />
        <span className="section-label mb-0">추천 알림 규칙</span>
      </div>
      <div className="space-y-1.5">
        {PRESET_RULES.map((preset) => {
          const sev = SEVERITY_CONFIG[preset.severity]
          const alreadyExists = rules.some(
            (r) =>
              r.indicatorName === preset.indicatorName &&
              r.condition === preset.condition &&
              r.threshold === preset.threshold,
          )

          return (
            <div
              key={preset.description}
              className="flex items-center gap-3 rounded-lg border border-border-dim bg-elevated px-3 py-2"
            >
              <div className="flex-1 min-w-0">
                <p className={cn('text-xs font-medium', sev.color)}>
                  {preset.description}
                </p>
              </div>
              <button
                onClick={() => onAddPreset(preset)}
                disabled={alreadyExists}
                className={cn(
                  'flex-shrink-0 text-[11px] px-2.5 py-1 rounded-full border transition-colors',
                  alreadyExists
                    ? 'border-border-dim text-faint cursor-not-allowed'
                    : 'border-border-dim text-muted hover:text-heading hover:border-border-mid',
                )}
              >
                {alreadyExists ? '추가됨' : '추가'}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
