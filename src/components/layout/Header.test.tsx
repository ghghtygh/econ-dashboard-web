import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { Header } from './Header'
import { useAlertStore } from '@/store/alertStore'

// zustand store 초기화 헬퍼
function resetAlertStore() {
  useAlertStore.setState({ rules: [], notifications: [] })
}

function renderHeader(path = '/') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Header />
    </MemoryRouter>,
  )
}

describe('Header', () => {
  beforeEach(() => {
    resetAlertStore()
  })

  it('로고와 브랜드명을 렌더링한다', () => {
    renderHeader()
    expect(screen.getByText('Econ Dashboard')).toBeInTheDocument()
  })

  it('네비게이션 링크를 렌더링한다', () => {
    renderHeader()
    expect(screen.getByRole('link', { name: /대시보드/ })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /지표 탐색/ })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /뉴스/ })).toBeInTheDocument()
  })

  it('테마 전환 버튼이 있다', () => {
    renderHeader()
    expect(screen.getByRole('button', { name: '테마 전환' })).toBeInTheDocument()
  })

  it('알림 벨 버튼이 있다', () => {
    renderHeader()
    expect(screen.getByRole('button', { name: '알림' })).toBeInTheDocument()
  })

  it('읽지 않은 알림이 없으면 배지가 없다', () => {
    renderHeader()
    // 배지 없음 (숫자 표시 없음)
    expect(screen.queryByText('1')).not.toBeInTheDocument()
  })

  it('읽지 않은 알림이 있으면 배지가 표시된다', () => {
    useAlertStore.setState({
      notifications: [
        {
          id: 'n1',
          ruleId: 'r1',
          indicatorName: 'VIX',
          message: '테스트 알림',
          severity: 'danger',
          value: 35,
          threshold: 30,
          triggeredAt: new Date().toISOString(),
          read: false,
        },
      ],
    })
    renderHeader()
    expect(screen.getByText('1')).toBeInTheDocument()
  })

  it('벨 클릭 시 알림 드롭다운이 열린다', () => {
    renderHeader()
    fireEvent.click(screen.getByRole('button', { name: '알림' }))
    expect(screen.getByText('알림')).toBeInTheDocument()
    expect(screen.getByText('알림이 없습니다')).toBeInTheDocument()
  })

  it('벨 드롭다운에 알림 항목이 표시된다', () => {
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
    renderHeader()
    fireEvent.click(screen.getByRole('button', { name: '알림' }))
    expect(screen.getByText('VIX 위험 수준')).toBeInTheDocument()
  })

  it('모두 읽음 버튼 클릭 시 markAllAsRead가 호출된다', () => {
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
    renderHeader()
    fireEvent.click(screen.getByRole('button', { name: '알림' }))
    const markAllBtn = screen.getByText('모두 읽음')
    fireEvent.click(markAllBtn)
    expect(useAlertStore.getState().notifications[0].read).toBe(true)
  })
})
