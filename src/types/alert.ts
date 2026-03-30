export type AlertCondition = 'above' | 'below' | 'cross_above' | 'cross_below'
export type AlertSeverity = 'info' | 'warning' | 'danger'

export interface AlertRule {
  id: string
  indicatorId: number
  indicatorName: string
  condition: AlertCondition
  threshold: number
  severity: AlertSeverity
  message: string
  enabled: boolean
  createdAt: string
}

export interface AlertNotification {
  id: string
  ruleId: string
  indicatorName: string
  message: string
  severity: AlertSeverity
  value: number
  threshold: number
  triggeredAt: string
  read: boolean
}
