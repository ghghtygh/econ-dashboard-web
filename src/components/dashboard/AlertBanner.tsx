import { useState } from 'react'
import { AlertTriangle, AlertOctagon, Info, X, Bell } from 'lucide-react'
import { useAlertStore } from '@/store/alertStore'
import type { AlertSeverity } from '@/types/alert'

const SEVERITY_CONFIG: Record<AlertSeverity, {
  label: string; color: string; bg: string; borderColor: string;
  icon: typeof AlertTriangle
}> = {
  info: { label: '정보', color: '#2563EB', bg: '#EFF6FF', borderColor: '#BFDBFE', icon: Info },
  warning: { label: '주의', color: '#D97706', bg: '#FFFBEB', borderColor: '#FDE68A', icon: AlertTriangle },
  danger: { label: '위험', color: '#DC2626', bg: '#FEF2F2', borderColor: '#FECACA', icon: AlertOctagon },
}

export function AlertBanner() {
  const notifications = useAlertStore((s) => s.notifications)
  const markAsRead = useAlertStore((s) => s.markAsRead)
  const markAllAsRead = useAlertStore((s) => s.markAllAsRead)
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())

  const unread = notifications.filter((n) => !n.read && !dismissed.has(n.id))

  if (unread.length === 0) return null

  const latest = unread.slice(0, 3)

  return (
    <div style={{ marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
      {/* Banner header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '6px 12px', background: '#FEF2F2', borderRadius: 8,
        border: '1px solid #FECACA',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Bell size={14} style={{ color: '#DC2626' }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: '#991B1B' }}>
            {unread.length}건의 알림
          </span>
        </div>
        {unread.length > 0 && (
          <button
            onClick={markAllAsRead}
            style={{
              fontSize: 11, color: '#94A3B8', background: 'none', border: 'none',
              cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'underline',
            }}
          >
            모두 읽음
          </button>
        )}
      </div>

      {/* Alert cards */}
      {latest.map((notif) => {
        const config = SEVERITY_CONFIG[notif.severity]
        const Icon = config.icon
        return (
          <div
            key={notif.id}
            style={{
              display: 'flex', alignItems: 'flex-start', gap: 10,
              padding: '10px 12px', borderRadius: 8,
              background: config.bg, border: `1px solid ${config.borderColor}`,
              animation: 'fadeUp 0.3s ease both',
            }}
          >
            <Icon size={16} style={{ color: config.color, flexShrink: 0, marginTop: 1 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: config.color }}>
                  {notif.indicatorName}
                </span>
                <span style={{
                  fontSize: 9, fontWeight: 600, padding: '1px 5px', borderRadius: 3,
                  background: config.color + '15', color: config.color,
                  textTransform: 'uppercase',
                }}>
                  {config.label}
                </span>
              </div>
              <p style={{ fontSize: 11, color: '#475569', lineHeight: 1.5, margin: 0 }}>
                {notif.message}
              </p>
              <span style={{ fontSize: 10, color: '#94A3B8', marginTop: 2, display: 'block' }}>
                현재값: {notif.value.toLocaleString()} | 기준: {notif.threshold.toLocaleString()}
              </span>
            </div>
            <button
              onClick={() => {
                markAsRead(notif.id)
                setDismissed((s) => new Set(s).add(notif.id))
              }}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#94A3B8', flexShrink: 0, padding: 2,
              }}
            >
              <X size={14} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
