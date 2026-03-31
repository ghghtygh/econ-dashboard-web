import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { useAlertStore } from '@/store/alertStore'

function resetAlertStore() {
  useAlertStore.setState({ rules: [], notifications: [] })
}

function renderSidebar(path = '/') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Sidebar />
    </MemoryRouter>,
  )
}

describe('Sidebar', () => {
  beforeEach(() => {
    resetAlertStore()
  })

  it('데스크탑 사이드바에 브랜드명이 있다', () => {
    renderSidebar()
    // 브랜드명이 최소 1개 렌더링됨
    expect(screen.getAllByText('Econ Dashboard').length).toBeGreaterThan(0)
  })

  it('네비게이션 링크를 렌더링한다', () => {
    renderSidebar()
    // 대시보드, 지표 탐색, 뉴스 링크
    const dashboardLinks = screen.getAllByText('대시보드')
    expect(dashboardLinks.length).toBeGreaterThan(0)
    const exploreLinks = screen.getAllByText('지표 탐색')
    expect(exploreLinks.length).toBeGreaterThan(0)
    const newsLinks = screen.getAllByText('뉴스')
    expect(newsLinks.length).toBeGreaterThan(0)
  })

  it('테마 전환 버튼이 있다', () => {
    renderSidebar()
    // 다크/라이트 모드 버튼
    expect(screen.getByText('다크 모드')).toBeInTheDocument()
  })

  it('모바일 메뉴 버튼 클릭 시 오버레이가 열린다', () => {
    renderSidebar()
    const menuBtn = screen.getByRole('button', { name: '메뉴 열기' })
    fireEvent.click(menuBtn)
    // 닫기 버튼이 나타남
    expect(screen.getByRole('button', { name: '' })).toBeDefined()
  })

  it('읽지 않은 알림이 있을 때 배지를 표시한다', () => {
    useAlertStore.setState({
      notifications: [
        {
          id: 'n1',
          ruleId: 'r1',
          indicatorName: 'VIX',
          message: '테스트',
          severity: 'danger',
          value: 35,
          threshold: 30,
          triggeredAt: new Date().toISOString(),
          read: false,
        },
      ],
    })
    renderSidebar()
    expect(screen.getByText('1')).toBeInTheDocument()
  })

  it('현재 경로 링크가 활성 스타일을 갖는다', () => {
    renderSidebar('/')
    const links = screen.getAllByRole('link', { name: /대시보드/ })
    // 활성 링크는 활성 클래스를 포함함
    const activeLink = links.find((l) => l.className.includes('indigo'))
    expect(activeLink).toBeDefined()
  })
})
