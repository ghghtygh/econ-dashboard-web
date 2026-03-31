import { useState, useEffect, useRef, useCallback } from 'react'
import { Bell, Plus, Trash2, CheckCircle2, Loader2, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAlertStore } from '@/store/alertStore'
import { useToast } from '@/components/ui/useToast'
import { Button } from '@/components/ui/Button'
import type { Indicator, IndicatorData } from '@/types/indicator'
import { AlertRuleModal, SEVERITY_CONFIG } from './AlertRuleModal'
import { AlertPresetList, PRESET_RULES, type PresetRule } from './AlertPresetList'

/* ── Props ── */

interface AlertPanelProps {
  indicators: Indicator[]
  dataMap: Record<number, IndicatorData[]>
}

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
    syncStatus,
    fetchRules,
    addRule,
    removeRule,
    toggleRule,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearNotifications,
  } = useAlertStore()

  const { toast } = useToast()
  const [modalOpen, setModalOpen] = useState(false)
  const triggeredRef = useRef<Set<string>>(new Set())

  // 마운트 시 서버에서 규칙 로드
  useEffect(() => {
    fetchRules()
  }, [fetchRules])

  // 동기화 실패 시 토스트 알림
  const prevSyncStatus = useRef(syncStatus)
  useEffect(() => {
    if (syncStatus === 'error' && prevSyncStatus.current !== 'error') {
      toast('알림 규칙 동기화에 실패했습니다. 로컬 데이터를 사용합니다.', 'error')
    }
    prevSyncStatus.current = syncStatus
  }, [syncStatus, toast])

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
        const notification = {
          id: `notif-${Date.now()}-${rule.id}`,
          ruleId: rule.id,
          indicatorName: rule.indicatorName,
          message: rule.message,
          severity: rule.severity,
          value: currentValue,
          threshold: rule.threshold,
          triggeredAt: new Date().toISOString(),
          read: false,
        }
        addNotification(notification)
        // 실시간 토스트 알림
        const toastVariant = rule.severity === 'danger' ? 'error' : rule.severity === 'warning' ? 'warning' : 'info'
        toast(`${rule.indicatorName}: ${rule.message}`, toastVariant)
      }

      // 조건이 해제되면 다시 트리거 가능하도록 초기화
      if (!conditionMet && triggeredRef.current.has(rule.id)) {
        triggeredRef.current.delete(rule.id)
      }
    }
  }, [rules, dataMap, addNotification, toast])

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
          <div className="flex items-center gap-2">
            {syncStatus === 'loading' && <Loader2 size={14} className="animate-spin text-muted" />}
            {syncStatus === 'error' && (
              <button onClick={() => fetchRules()} className="flex items-center gap-1 text-[10px] text-red-400 hover:text-red-300 transition-colors">
                <RefreshCw size={10} />
                동기화 실패 · 재시도
              </button>
            )}
            <Button variant="ghost" size="sm" onClick={() => setModalOpen(true)}>
              <Plus size={14} />
              규칙 추가
            </Button>
          </div>
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
                    <p className="text-xs font-medium text-heading truncate">{rule.indicatorName}</p>
                    <p className="text-[11px] text-muted">{condLabel} {rule.threshold.toLocaleString()}</p>
                  </div>
                  <span className={cn('flex-shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-full', sev.bg, sev.color)}>
                    {sev.label}
                  </span>
                  <button
                    onClick={() => toggleRule(rule.id)}
                    className={cn('relative flex-shrink-0 w-8 h-[18px] rounded-full transition-colors', rule.enabled ? 'bg-blue-600' : 'bg-hover')}
                  >
                    <span className={cn('absolute top-[2px] left-[2px] w-[14px] h-[14px] rounded-full bg-white transition-transform', rule.enabled && 'translate-x-[14px]')} />
                  </button>
                  <button onClick={() => removeRule(rule.id)} className="flex-shrink-0 text-muted hover:text-red-400 transition-colors">
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
                <button onClick={markAllAsRead} className="text-[10px] text-muted hover:text-heading transition-colors">모두 읽음</button>
              )}
              <button onClick={clearNotifications} className="text-[10px] text-muted hover:text-red-400 transition-colors">전체 삭제</button>
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
                    notif.read ? 'bg-transparent hover:bg-elevated' : 'bg-elevated hover:bg-hover',
                  )}
                >
                  <SevIcon size={14} className={cn('flex-shrink-0 mt-0.5', sev.color)} />
                  <div className="flex-1 min-w-0">
                    <p className={cn('text-[12px] leading-relaxed truncate', notif.read ? 'text-muted' : 'text-heading font-medium')}>
                      {notif.message}
                    </p>
                    <p className="text-[10px] text-faint mt-0.5">
                      {notif.indicatorName} · 현재 {notif.value.toLocaleString()} · {formatTime(notif.triggeredAt)}
                    </p>
                  </div>
                  {!notif.read && <span className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-500 mt-1.5" />}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* 교육용 프리셋 */}
      <AlertPresetList rules={rules} indicators={indicators} onAddPreset={handleAddPreset} />

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

// Re-export PRESET_RULES for backward compatibility
export { PRESET_RULES }
