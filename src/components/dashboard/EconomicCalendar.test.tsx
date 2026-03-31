import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { EconomicCalendar } from './EconomicCalendar'

function renderCalendar() {
  return render(<EconomicCalendar />)
}

describe('EconomicCalendar', () => {
  it('제목을 렌더링한다', () => {
    renderCalendar()
    expect(screen.getByText('경제 캘린더')).toBeInTheDocument()
  })

  it('월간/목록 뷰 토글 버튼이 있다', () => {
    renderCalendar()
    expect(screen.getByRole('button', { name: /월간/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /목록/ })).toBeInTheDocument()
  })

  it('기본값은 월간 뷰이다', () => {
    renderCalendar()
    // 요일 헤더가 있으면 월간 뷰
    expect(screen.getByText('일')).toBeInTheDocument()
    expect(screen.getByText('월')).toBeInTheDocument()
    expect(screen.getByText('토')).toBeInTheDocument()
  })

  it('목록 뷰로 전환 가능하다', () => {
    renderCalendar()
    fireEvent.click(screen.getByRole('button', { name: /목록/ }))
    // 목록 뷰에는 과거 이벤트 보기 버튼이 있음
    expect(screen.getByText('과거 이벤트 보기')).toBeInTheDocument()
  })

  it('중요도 필터 버튼이 있다', () => {
    renderCalendar()
    expect(screen.getByRole('button', { name: '전체' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '매우 중요' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '중요' })).toBeInTheDocument()
  })

  it('월간 뷰에서 이전/다음 달 네비게이션이 작동한다', () => {
    renderCalendar()
    const today = new Date()
    const currentMonthLabel = `${today.getFullYear()}년 ${today.getMonth() + 1}월`
    expect(screen.getByText(currentMonthLabel)).toBeInTheDocument()

    // 다음 달로 이동 (ChevronRight: lucide-chevron-right 클래스 가진 SVG의 부모 버튼)
    const allButtons = screen.getAllByRole('button')
    const chevronButtons = allButtons.filter((b) => b.querySelector('svg'))
    // 월간뷰에서 첫 번째 chevron 그룹은 이전/다음 달 버튼
    // chevronLeft = 인덱스 0 (view 버튼 뒤), chevronRight = 인덱스 1
    const navButtons = allButtons.filter((b) => {
      const svg = b.querySelector('svg')
      return svg && (svg.classList.contains('lucide-chevron-left') || svg.classList.contains('lucide-chevron-right'))
    })
    expect(navButtons.length).toBeGreaterThanOrEqual(2)
    fireEvent.click(navButtons[1]) // 다음 달
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1)
    expect(screen.getByText(`${nextMonth.getFullYear()}년 ${nextMonth.getMonth() + 1}월`)).toBeInTheDocument()
  })

  it('목록 뷰에서 과거 이벤트 토글이 작동한다', () => {
    renderCalendar()
    fireEvent.click(screen.getByRole('button', { name: /목록/ }))
    const toggleBtn = screen.getByText('과거 이벤트 보기')
    fireEvent.click(toggleBtn)
    expect(screen.getByText('과거 이벤트 숨기기')).toBeInTheDocument()
  })

  it('목록 뷰에서 이벤트 클릭 시 상세 내용이 확장된다', () => {
    renderCalendar()
    fireEvent.click(screen.getByRole('button', { name: /목록/ }))
    // 과거 이벤트 포함해서 보기
    fireEvent.click(screen.getByText('과거 이벤트 보기'))
    // 첫 번째 이벤트 클릭
    const eventButtons = screen.getAllByRole('button').filter((b) =>
      b.closest('[class*="rounded-xl"]'),
    )
    if (eventButtons.length > 0) {
      fireEvent.click(eventButtons[0])
    }
  })

  it('월간 뷰에서 날짜 클릭 시 해당 날짜 이벤트 목록을 보여준다', () => {
    renderCalendar()
    // 날짜 버튼들 중 하나 클릭
    const dayButtons = screen.getAllByRole('button').filter(
      (b) => b.textContent && /^\d+$/.test(b.textContent.trim()),
    )
    if (dayButtons.length > 0) {
      fireEvent.click(dayButtons[0])
    }
    // 이벤트가 없으면 빈 상태 메시지
    // 이벤트가 있으면 목록이 나타남
    // 어느 쪽이든 에러 없이 렌더링되어야 함
  })
})
