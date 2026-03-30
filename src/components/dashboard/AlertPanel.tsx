import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Bell,
  Plus,
  Trash2,
  AlertTriangle,
  Info,
  AlertOctagon,
  CheckCircle2,
  Lightbulb,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAlertStore } from '@/store/alertStore'
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Dropdown } from '@/components/ui/Dropdown'
import type { Indicator, IndicatorData } from '@/types/indicator'
import type { AlertCondition, AlertRule, AlertSeverity } from '@/types/alert'

/* ── Props ── */

interface AlertPanelProps {
  indicators: Indicator[]
  dataMap: Record<number, IndicatorData[]>
}

/* ── Constants ── */

const SEVERITY_CONFIG: Record<AlertSeverity, { label: string; color: string; bg: string; icon: typeof Info }> = {
  info: {
    label: '정보',
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    icon: Info,
  },
  warning: {
    label: '주의',
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    icon: AlertTriangle,
  },
  danger: {
    label: '위험',
    color: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-100 dark:bg-red-900/30',
    icon: AlertOctagon,
  },
}

const CONDITION_OPTIONS = [
  { value: 'above', label: '이상 (≥)' },
  { value: 'below', label: '이하 (≤)' },
]

const SEVERITY_OPTIONS: { value: AlertSeverity; label: string }[] = [
  { value: 'info', label: '정보 (Info)' },
  { value: 'warning', label: '주의 (Warning)' },
  { value: 'danger', label: '위험 (Danger)' },
]

interface PresetRule {
  indicatorName: string
  condition: AlertCondition
  threshold: number
  severity: AlertSeverity
  message: string
  description: string
}

const PRESET_RULES: PresetRule[] = [
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

/* ── Helpers ── */

function getLatestValue(data: IndicatorData[] | undefined): number | null {
  if (!data || data.length === 0) return null
  return data[data.length - 1].value
}

function formatTime(isoString: string): string {
  const date = new Date(isoString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)

  if (diffMin < 1) return '방금 전'
  if (diffMin < 60) return `${diffMin}분 전`
  const diffHour = Math.floor(diffMin / 60)
  if (diffHour < 24) return `${diffHour}시간 전`
  return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
}

/* ── Component ── */

export function AlertPanel({ indicators, dataMap }: AlertPanelProps) {
  const {
    rules,
    notifications,
    addRule,
    removeRule,
    toggleRule,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearNotifications,
  } = useAlertStore()

  const [modalOpen, setModalOpen] = useState(false)
  const triggeredRef = useRef<Set<string>>(new Set())

  /* ── Alert checking logic ── */

  const checkAlerts = useCallback(() => {
    for (const rule of rules) {
      if (!rule.enabled) continue

      const data = dataMap[rule.indicatorId]
      const currentValue = getLatestValue(data)
      if (currentValue === null) continue

      let conditionMet = false
      if (rule.condition === 'above' || rule.condition === 'cross_above') {
        conditionMet = currentValue >= rule.threshold
      } else if (rule.condition === 'below' || rule.condition === 'cross_below') {
        conditionMet = currentValue <= rule.threshold
      }

      if (conditionMet && !triggeredRef.current.has(rule.id)) {
        triggeredRef.current.add(rule.id)
        addNotification({
          id: `notif-${Date.now()}-${rule.id}`,
          ruleId: rule.id,
          indicatorName: rule.indicatorName,
          message: rule.message,
          severity: rule.severity,
          value: currentValue,
          threshold: rule.threshold,
          triggeredAt: new Date().toISOString(),
          read: false,
        })
      }

      // 조건이 해제되면 다시 트리거 가능하도록 초기화
      if (!conditionMet && triggeredRef.current.has(rule.id)) {
        triggeredRef.current.delete(rule.id)
      }
    }
  }, [rules, dataMap, addNotification])

  useEffect(() => {
    checkAlerts()
  }, [checkAlerts])

  /* ── Preset 추가 ── */

  const handleAddPreset = (preset: PresetRule) => {
    const matchedIndicator = indicators.find(
      (i) =>
        i.name.includes(preset.indicatorName) ||
        i.symbol.includes(preset.indicatorName) ||
        preset.indicatorName.includes(i.name),
    )

    addRule({
      id: crypto.randomUUID(),
      indicatorId: matchedIndicator?.id ?? 0,
      indicatorName: matchedIndicator?.name ?? preset.indicatorName,
      condition: preset.condition,
      threshold: preset.threshold,
      severity: preset.severity,
      message: preset.message,
      enabled: true,
      createdAt: new Date().toISOString(),
    })
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <div className="rounded-lg border border-border-dim bg-surface p-5">
      {/* 헤더 */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <Bell size={16} className="text-amber-500" />
            <h3 className="text-base font-semibold text-heading">알림 &amp; 경보</h3>
            {unreadCount > 0 && (
              <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold rounded-full bg-red-500 text-white">
                {unreadCount}
              </span>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={() => setModalOpen(true)}>
            <Plus size={14} />
            규칙 추가
          </Button>
        </div>
      </div>

      {/* 활성 규칙 목록 */}
      {rules.length > 0 && (
        <div className="mb-4">
          <span className="section-label">활성 규칙</span>
          <div className="space-y-2">
            {rules.map((rule) => {
              const sev = SEVERITY_CONFIG[rule.severity]
              const SevIcon = sev.icon
              const condLabel = rule.condition === 'above' || rule.condition === 'cross_above' ? '≥' : '≤'

              return (
                <div
                  key={rule.id}
                  className={cn(
                    'flex items-center gap-3 rounded-lg border border-border-dim bg-elevated px-3 py-2.5 transition-opacity',
                    !rule.enabled && 'opacity-50',
                  )}
                >
                  <span className={cn('flex-shrink-0 rounded-md p-1.5', sev.bg)}>
                    <SevIcon size={14} className={sev.color} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-heading truncate">
                      {rule.indicatorName}
                    </p>
                    <p className="text-[11px] text-muted">
                      {condLabel} {rule.threshold.toLocaleString()}
                    </p>
                  </div>
                  <span
                    className={cn(
                      'flex-shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-full',
                      sev.bg,
                      sev.color,
                    )}
                  >
                    {sev.label}
                  </span>
                  {/* 토글 */}
                  <button
                    onClick={() => toggleRule(rule.id)}
                    className={cn(
                      'relative flex-shrink-0 w-8 h-[18px] rounded-full transition-colors',
                      rule.enabled ? 'bg-blue-600' : 'bg-hover',
                    )}
                  >
                    <span
                      className={cn(
                        'absolute top-[2px] left-[2px] w-[14px] h-[14px] rounded-full bg-white transition-transform',
                        rule.enabled && 'translate-x-[14px]',
                      )}
                    />
                  </button>
                  <button
                    onClick={() => removeRule(rule.id)}
                    className="flex-shrink-0 text-muted hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* 최근 알림 */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="section-label mb-0">최근 알림</span>
          {notifications.length > 0 && (
            <div className="flex gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-[10px] text-muted hover:text-heading transition-colors"
                >
                  모두 읽음
                </button>
              )}
              <button
                onClick={clearNotifications}
                className="text-[10px] text-muted hover:text-red-400 transition-colors"
              >
                전체 삭제
              </button>
            </div>
          )}
        </div>

        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <CheckCircle2 size={24} className="text-faint mb-2" />
            <p className="text-xs text-muted">아직 발생한 알림이 없습니다</p>
          </div>
        ) : (
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {notifications.slice(0, 10).map((notif) => {
              const sev = SEVERITY_CONFIG[notif.severity]
              const SevIcon = sev.icon

              return (
                <button
                  key={notif.id}
                  onClick={() => markAsRead(notif.id)}
                  className={cn(
                    'w-full flex items-start gap-2.5 rounded-lg px-3 py-2 text-left transition-colors',
                    notif.read
                      ? 'bg-transparent hover:bg-elevated'
                      : 'bg-elevated hover:bg-hover',
                  )}
                >
                  <SevIcon size={14} className={cn('flex-shrink-0 mt-0.5', sev.color)} />
                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        'text-[12px] leading-relaxed truncate',
                        notif.read ? 'text-muted' : 'text-heading font-medium',
                      )}
                    >
                      {notif.message}
                    </p>
                    <p className="text-[10px] text-faint mt-0.5">
                      {notif.indicatorName} · 현재 {notif.value.toLocaleString()} · {formatTime(notif.triggeredAt)}
                    </p>
                  </div>
                  {!notif.read && (
                    <span className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-500 mt-1.5" />
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* 교육용 프리셋 */}
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
                  onClick={() => handleAddPreset(preset)}
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

      {/* 규칙 추가 모달 */}
      <AlertRuleModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        indicators={indicators}
        onSave={(rule) => {
          addRule(rule)
          setModalOpen(false)
        }}
      />
    </div>
  )
}

/* ── Alert Rule Creation Modal ── */

interface AlertRuleModalProps {
  open: boolean
  onClose: () => void
  indicators: Indicator[]
  onSave: (rule: AlertRule) => void
}

function AlertRuleModal({ open, onClose, indicators, onSave }: AlertRuleModalProps) {
  const [indicatorId, setIndicatorId] = useState('')
  const [condition, setCondition] = useState<AlertCondition>('above')
  const [threshold, setThreshold] = useState('')
  const [severity, setSeverity] = useState<AlertSeverity>('warning')
  const [message, setMessage] = useState('')

  const reset = () => {
    setIndicatorId('')
    setCondition('above')
    setThreshold('')
    setSeverity('warning')
    setMessage('')
  }

  const handleSave = () => {
    const indicator = indicators.find((i) => String(i.id) === indicatorId)
    if (!indicator || !threshold) return

    onSave({
      id: crypto.randomUUID(),
      indicatorId: indicator.id,
      indicatorName: indicator.name,
      condition,
      threshold: Number(threshold),
      severity,
      message:
        message.trim() ||
        `${indicator.name}이(가) ${condition === 'above' || condition === 'cross_above' ? '이상' : '이하'} ${Number(threshold).toLocaleString()} 조건을 충족했습니다.`,
      enabled: true,
      createdAt: new Date().toISOString(),
    })

    reset()
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const indicatorOptions = indicators.map((i) => ({
    value: String(i.id),
    label: `${i.name} (${i.symbol})`,
  }))

  const selectedIndicator = indicators.find((i) => String(i.id) === indicatorId)
  const sevConfig = SEVERITY_CONFIG[severity]

  return (
    <Modal open={open} onClose={handleClose}>
      <ModalHeader onClose={handleClose}>알림 규칙 추가</ModalHeader>
      <ModalBody className="space-y-4">
        {/* 지표 선택 */}
        <div>
          <label className="block text-xs text-muted mb-1.5">지표 선택</label>
          <Dropdown
            options={indicatorOptions}
            value={indicatorId}
            onChange={setIndicatorId}
            placeholder="지표를 선택하세요"
          />
        </div>

        {/* 조건 선택 */}
        <div>
          <label className="block text-xs text-muted mb-1.5">조건</label>
          <Dropdown
            options={CONDITION_OPTIONS}
            value={condition}
            onChange={(v) => setCondition(v as AlertCondition)}
            placeholder="조건 선택"
          />
        </div>

        {/* 임계값 */}
        <div>
          <label className="block text-xs text-muted mb-1.5">임계값</label>
          <input
            type="number"
            value={threshold}
            onChange={(e) => setThreshold(e.target.value)}
            placeholder="예: 30, 1400, 5.0"
            className="w-full rounded-lg border border-border-mid bg-elevated px-3 py-2 text-sm text-body placeholder:text-faint focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          />
        </div>

        {/* 심각도 */}
        <div>
          <label className="block text-xs text-muted mb-1.5">심각도</label>
          <div className="grid grid-cols-3 gap-2">
            {SEVERITY_OPTIONS.map((opt) => {
              const config = SEVERITY_CONFIG[opt.value]
              const Icon = config.icon
              return (
                <button
                  key={opt.value}
                  onClick={() => setSeverity(opt.value)}
                  className={cn(
                    'flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs transition-colors',
                    severity === opt.value
                      ? cn('border-current', config.bg, config.color)
                      : 'border-border-mid bg-elevated text-muted hover:border-border-mid',
                  )}
                >
                  <Icon size={13} />
                  {opt.label}
                </button>
              )
            })}
          </div>
          {/* 색상 미리보기 */}
          <div className={cn('flex items-center gap-1.5 mt-2 text-[11px] px-2 py-1 rounded', sevConfig.bg, sevConfig.color)}>
            {(() => { const SevIcon = sevConfig.icon; return <SevIcon size={12} /> })()}
            미리보기: {selectedIndicator?.name ?? '지표'} {condition === 'above' ? '≥' : '≤'} {threshold || '?'}
          </div>
        </div>

        {/* 메시지 */}
        <div>
          <label className="block text-xs text-muted mb-1.5">알림 메시지 (선택)</label>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="예: VIX가 급등했습니다. 시장 변동성에 주의하세요."
            className="w-full rounded-lg border border-border-mid bg-elevated px-3 py-2 text-sm text-body placeholder:text-faint focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          />
        </div>
      </ModalBody>
      <ModalFooter>
        <Button variant="secondary" size="sm" onClick={handleClose}>
          취소
        </Button>
        <Button size="sm" onClick={handleSave} disabled={!indicatorId || !threshold}>
          저장
        </Button>
      </ModalFooter>
    </Modal>
  )
}
