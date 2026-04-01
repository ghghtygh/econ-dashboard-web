import { z } from 'zod'

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

// Zod schemas for API response validation
export const alertRuleSchema = z.object({
  id: z.string(),
  indicatorId: z.number(),
  indicatorName: z.string(),
  condition: z.enum(['above', 'below', 'cross_above', 'cross_below']),
  threshold: z.number(),
  severity: z.enum(['info', 'warning', 'danger']),
  message: z.string(),
  enabled: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string().optional(),
})

export const alertRuleListSchema = z.array(alertRuleSchema)
