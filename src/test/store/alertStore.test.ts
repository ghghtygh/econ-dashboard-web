import { describe, it, expect, beforeEach } from 'vitest'
import { useAlertStore } from '@/store/alertStore'
import type { AlertRule, AlertNotification } from '@/types/alert'

const mockRule: AlertRule = {
  id: 'test-rule-1',
  indicatorId: 10,
  indicatorName: 'TEST',
  condition: 'above',
  threshold: 100,
  severity: 'warning',
  message: 'TEST above 100',
  enabled: true,
  createdAt: new Date().toISOString(),
}

const mockNotification: AlertNotification = {
  id: 'notif-1',
  ruleId: 'test-rule-1',
  indicatorName: 'TEST',
  value: 110,
  threshold: 100,
  severity: 'warning',
  message: 'TEST above 100',
  read: false,
  triggeredAt: new Date().toISOString(),
}

beforeEach(() => {
  useAlertStore.setState({ rules: [], notifications: [] })
})

describe('alertStore', () => {
  it('룰을 추가한다', () => {
    useAlertStore.getState().addRule(mockRule)
    expect(useAlertStore.getState().rules).toHaveLength(1)
  })

  it('룰을 삭제한다', () => {
    useAlertStore.getState().addRule(mockRule)
    useAlertStore.getState().removeRule('test-rule-1')
    expect(useAlertStore.getState().rules).toHaveLength(0)
  })

  it('룰을 토글한다', () => {
    useAlertStore.getState().addRule(mockRule)
    useAlertStore.getState().toggleRule('test-rule-1')
    expect(useAlertStore.getState().rules[0].enabled).toBe(false)

    useAlertStore.getState().toggleRule('test-rule-1')
    expect(useAlertStore.getState().rules[0].enabled).toBe(true)
  })

  it('알림을 추가하고 읽음 처리한다', () => {
    useAlertStore.getState().addNotification(mockNotification)
    expect(useAlertStore.getState().unreadCount()).toBe(1)

    useAlertStore.getState().markAsRead('notif-1')
    expect(useAlertStore.getState().unreadCount()).toBe(0)
  })

  it('전체 알림을 읽음 처리한다', () => {
    useAlertStore.getState().addNotification(mockNotification)
    useAlertStore.getState().addNotification({ ...mockNotification, id: 'notif-2' })
    useAlertStore.getState().markAllAsRead()
    expect(useAlertStore.getState().unreadCount()).toBe(0)
  })

  it('알림을 전체 삭제한다', () => {
    useAlertStore.getState().addNotification(mockNotification)
    useAlertStore.getState().clearNotifications()
    expect(useAlertStore.getState().notifications).toHaveLength(0)
  })
})
