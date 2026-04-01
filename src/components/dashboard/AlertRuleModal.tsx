import { useState } from 'react'
import { Info, AlertTriangle, AlertOctagon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Dropdown } from '@/components/ui/Dropdown'
import type { Indicator } from '@/types/indicator'
import type { AlertCondition, AlertRule, AlertSeverity } from '@/types/alert'

export const SEVERITY_CONFIG: Record<AlertSeverity, { label: string; color: string; bg: string; icon: typeof Info }> = {
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

interface AlertRuleModalProps {
  open: boolean
  onClose: () => void
  indicators: Indicator[]
  onSave: (rule: AlertRule) => void
}

export function AlertRuleModal({ open, onClose, indicators, onSave }: AlertRuleModalProps) {
  const [indicatorId, setIndicatorId] = useState('')
  const [condition, setCondition] = useState<AlertCondition>('above')
  const [threshold, setThreshold] = useState('')
  const [severity, setSeverity] = useState<AlertSeverity>('warning')
  const [message, setMessage] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const reset = () => {
    setIndicatorId('')
    setCondition('above')
    setThreshold('')
    setSeverity('warning')
    setMessage('')
    setErrors({})
  }

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}
    if (!indicatorId) newErrors.indicatorId = '지표를 선택해주세요.'
    if (!threshold) {
      newErrors.threshold = '임계값을 입력해주세요.'
    } else if (isNaN(Number(threshold))) {
      newErrors.threshold = '유효한 숫자를 입력해주세요.'
    }
    if (message.length > 200) newErrors.message = '메시지는 200자 이내로 입력해주세요.'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = () => {
    if (!validate()) return
    const indicator = indicators.find((i) => String(i.id) === indicatorId)
    if (!indicator) return

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
            onChange={(v) => { setIndicatorId(v); setErrors((e) => ({ ...e, indicatorId: '' })) }}
            placeholder="지표를 선택하세요"
          />
          {errors.indicatorId && <p className="text-[11px] text-red-400 mt-1">{errors.indicatorId}</p>}
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
            onChange={(e) => { setThreshold(e.target.value); setErrors((prev) => ({ ...prev, threshold: '' })) }}
            placeholder="예: 30, 1400, 5.0"
            className={cn(
              'w-full rounded-lg border bg-elevated px-3 py-2 text-sm text-body placeholder:text-faint focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors',
              errors.threshold ? 'border-red-400' : 'border-border-mid',
            )}
          />
          {errors.threshold && <p className="text-[11px] text-red-400 mt-1">{errors.threshold}</p>}
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
            onChange={(e) => { setMessage(e.target.value); setErrors((prev) => ({ ...prev, message: '' })) }}
            placeholder="예: VIX가 급등했습니다. 시장 변동성에 주의하세요."
            maxLength={200}
            className="w-full rounded-lg border border-border-mid bg-elevated px-3 py-2 text-sm text-body placeholder:text-faint focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          />
          <div className="flex justify-between mt-1">
            {errors.message ? <p className="text-[11px] text-red-400">{errors.message}</p> : <span />}
            <span className="text-[10px] text-faint">{message.length}/200</span>
          </div>
        </div>
      </ModalBody>
      <ModalFooter>
        <Button variant="secondary" size="sm" onClick={handleClose}>
          취소
        </Button>
        <Button size="sm" onClick={handleSave}>
          저장
        </Button>
      </ModalFooter>
    </Modal>
  )
}
