import { useDashboardStore, type SyncStatus } from '@/store/dashboardStore'
import { cn } from '@/lib/utils'

const STATUS_CONFIG: Record<SyncStatus, { label: string; color: string; icon: string } | null> = {
  idle: null,
  saving: { label: '저장 중...', color: 'text-yellow-500', icon: '⟳' },
  saved: { label: '저장 완료', color: 'text-green-500', icon: '✓' },
  error: { label: '저장 실패', color: 'text-red-500', icon: '✗' },
}

export function SyncStatusIndicator() {
  const syncStatus = useDashboardStore((s) => s.syncStatus)
  const config = STATUS_CONFIG[syncStatus]

  if (!config) return null

  return (
    <div
      className={cn('flex items-center gap-1.5 text-xs transition-opacity', config.color)}
      role="status"
      aria-live="polite"
    >
      <span className={syncStatus === 'saving' ? 'animate-spin' : ''} aria-hidden="true">
        {config.icon}
      </span>
      <span>{config.label}</span>
    </div>
  )
}
