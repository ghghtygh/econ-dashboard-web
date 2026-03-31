import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import { AlertPanel } from './AlertPanel'
import { useAlertStore } from '@/store/alertStore'
import type { Indicator, IndicatorData } from '@/types/indicator'

const INDICATORS: Indicator[] = [
  { id: 1, name: 'VIX', symbol: 'VIX', category: 'STOCK', unit: '', source: 'CBOE', description: null, createdAt: '', updatedAt: '' },
  { id: 2, name: 'CPI', symbol: 'CPI', category: 'MACRO', unit: '%', source: 'BLS', description: null, createdAt: '', updatedAt: '' },
]

const DATA_MAP: Record<number, IndicatorData[]> = {
  1: [{ id: 1, indicatorId: 1, date: '2026-01-01', value: 25, open: null, high: null, low: null, close: null, volume: null, change: null }],
  2: [{ id: 2, indicatorId: 2, date: '2026-01-01', value: 3, open: null, high: null, low: null, close: null, volume: null, change: null }],
}

function renderPanel() {
  return render(<AlertPanel indicators={INDICATORS} dataMap={DATA_MAP} />)
}

describe('AlertPanel', () => {
  beforeEach(() => {
    useAlertStore.setState({ rules: [], notifications: [] })
  })

  it('제목과 추가 버튼을 렌더링한다', () => {
    renderPanel()
    expect(screen.getByText('알림 & 경보')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /규칙 추가/ })).toBeInTheDocument()
  })

  it('알림이 없으면 빈 상태 메시지를 표시한다', () => {
    renderPanel()
    expect(screen.getByText('아직 발생한 알림이 없습니다')).toBeInTheDocument()
  })

  it('추천 알림 규칙 프리셋이 표시된다', () => {
    renderPanel()
    expect(screen.getByText('추천 알림 규칙')).toBeInTheDocument()
    expect(screen.getByText(/VIX > 30/)).toBeInTheDocument()
  })

  it('규칙 추가 버튼 클릭 시 모달이 열린다', () => {
    renderPanel()
    fireEvent.click(screen.getByRole('button', { name: /규칙 추가/ }))
    expect(screen.getByText('알림 규칙 추가')).toBeInTheDocument()
  })

  it('기존 규칙이 있으면 활성 규칙 목록을 표시한다', () => {
    useAlertStore.setState({
      rules: [
        {
          id: 'rule-1',
          indicatorId: 1,
          indicatorName: 'VIX',
          condition: 'above',
          threshold: 30,
          severity: 'danger',
          message: 'VIX 위험',
          enabled: true,
          createdAt: new Date().toISOString(),
        },
      ],
    })
    renderPanel()
    expect(screen.getByText('활성 규칙')).toBeInTheDocument()
    expect(screen.getByText('VIX')).toBeInTheDocument()
  })

  it('규칙 삭제 버튼 클릭 시 규칙이 제거된다', () => {
    useAlertStore.setState({
      rules: [
        {
          id: 'rule-1',
          indicatorId: 1,
          indicatorName: 'VIX',
          condition: 'above',
          threshold: 30,
          severity: 'danger',
          message: 'VIX 위험',
          enabled: true,
          createdAt: new Date().toISOString(),
        },
      ],
    })
    renderPanel()
    // 규칙 아이템 내 삭제 버튼은 Trash2 아이콘을 가진 버튼 (hover:text-red-400 클래스)
    const allButtons = screen.getAllByRole('button')
    const deleteBtn = allButtons.find((btn) => btn.className.includes('hover:text-red'))
    expect(deleteBtn).toBeDefined()
    fireEvent.click(deleteBtn!)
    // 규칙이 삭제됨
    expect(useAlertStore.getState().rules.length).toBe(0)
  })

  it('알림이 있을 때 읽지 않은 배지가 표시된다', () => {
    useAlertStore.setState({
      notifications: [
        {
          id: 'n1',
          ruleId: 'r1',
          indicatorName: 'VIX',
          message: 'VIX 위험',
          severity: 'danger',
          value: 35,
          threshold: 30,
          triggeredAt: new Date().toISOString(),
          read: false,
        },
      ],
    })
    renderPanel()
    expect(screen.getByText('1')).toBeInTheDocument()
  })

  it('알림 클릭 시 읽음 처리된다', () => {
    useAlertStore.setState({
      notifications: [
        {
          id: 'n1',
          ruleId: 'r1',
          indicatorName: 'VIX',
          message: 'VIX 위험 수준',
          severity: 'danger',
          value: 35,
          threshold: 30,
          triggeredAt: new Date().toISOString(),
          read: false,
        },
      ],
    })
    renderPanel()
    fireEvent.click(screen.getByText('VIX 위험 수준'))
    expect(useAlertStore.getState().notifications[0].read).toBe(true)
  })

  it('전체 삭제 버튼 클릭 시 알림이 모두 제거된다', () => {
    useAlertStore.setState({
      notifications: [
        {
          id: 'n1',
          ruleId: 'r1',
          indicatorName: 'VIX',
          message: 'VIX 위험',
          severity: 'danger',
          value: 35,
          threshold: 30,
          triggeredAt: new Date().toISOString(),
          read: false,
        },
      ],
    })
    renderPanel()
    fireEvent.click(screen.getByText('전체 삭제'))
    expect(useAlertStore.getState().notifications.length).toBe(0)
  })

  it('프리셋 추가 버튼 클릭 시 규칙이 추가된다', () => {
    renderPanel()
    const addBtns = screen.getAllByText('추가')
    fireEvent.click(addBtns[0])
    expect(useAlertStore.getState().rules.length).toBe(1)
  })

  it('이미 추가된 프리셋은 "추가됨"으로 표시된다', () => {
    renderPanel()
    const addBtns = screen.getAllByText('추가')
    fireEvent.click(addBtns[0])
    expect(screen.getByText('추가됨')).toBeInTheDocument()
  })

  it('VIX가 임계값 초과 시 알림이 자동 생성된다', () => {
    useAlertStore.setState({
      rules: [
        {
          id: 'rule-vix',
          indicatorId: 1,
          indicatorName: 'VIX',
          condition: 'above',
          threshold: 20,
          severity: 'danger',
          message: 'VIX 높음',
          enabled: true,
          createdAt: new Date().toISOString(),
        },
      ],
      notifications: [],
    })
    // VIX = 25 > 20 → 알림 발생해야 함
    render(<AlertPanel indicators={INDICATORS} dataMap={DATA_MAP} />)
    expect(useAlertStore.getState().notifications.length).toBe(1)
  })
})
