import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AddWidgetModal } from './AddWidgetModal'
import { useDashboardStore } from '@/store/dashboardStore'
import type { Indicator } from '@/types/indicator'

const INDICATORS: Indicator[] = [
  { id: 1, name: 'VIX', symbol: 'VIX', category: 'STOCK', unit: '', source: 'CBOE', description: null, createdAt: '', updatedAt: '' },
  { id: 2, name: 'CPI', symbol: 'CPI', category: 'MACRO', unit: '%', source: 'BLS', description: null, createdAt: '', updatedAt: '' },
]

function renderModal(open = true, onClose = vi.fn()) {
  return render(
    <AddWidgetModal open={open} onClose={onClose} indicators={INDICATORS} />,
  )
}

describe('AddWidgetModal', () => {
  beforeEach(() => {
    useDashboardStore.setState({ widgets: [], selectedIndicators: [] })
  })

  it('open=false이면 아무것도 렌더링하지 않는다', () => {
    renderModal(false)
    expect(screen.queryByText('위젯 추가')).not.toBeInTheDocument()
  })

  it('open=true이면 모달을 렌더링한다', () => {
    renderModal()
    expect(screen.getByText('위젯 추가')).toBeInTheDocument()
  })

  it('지표 선택 드롭다운이 있다', () => {
    renderModal()
    expect(screen.getByText('지표 선택')).toBeInTheDocument()
    expect(screen.getByText('지표를 선택하세요')).toBeInTheDocument()
  })

  it('차트 타입 버튼들이 있다', () => {
    renderModal()
    expect(screen.getByText('Line')).toBeInTheDocument()
    expect(screen.getByText('Bar')).toBeInTheDocument()
    expect(screen.getByText('Area')).toBeInTheDocument()
    expect(screen.getByText('Number')).toBeInTheDocument()
  })

  it('색상 선택 버튼들이 있다', () => {
    renderModal()
    expect(screen.getByText('색상')).toBeInTheDocument()
    // 8개 색상 버튼
    const colorBtns = screen.getAllByRole('button').filter(
      (b) => b.style.backgroundColor && b.style.backgroundColor !== '',
    )
    expect(colorBtns.length).toBe(8)
  })

  it('지표 미선택 시 추가 버튼이 비활성화된다', () => {
    renderModal()
    const addBtn = screen.getByRole('button', { name: '추가' })
    expect(addBtn).toBeDisabled()
  })

  it('취소 버튼 클릭 시 onClose가 호출된다', () => {
    const onClose = vi.fn()
    renderModal(true, onClose)
    fireEvent.click(screen.getByRole('button', { name: '취소' }))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('지표 선택 후 추가 버튼이 활성화된다', () => {
    renderModal()
    // 드롭다운 열기
    fireEvent.click(screen.getByText('지표를 선택하세요'))
    // VIX 선택
    fireEvent.click(screen.getByText('VIX (VIX)'))
    const addBtn = screen.getByRole('button', { name: '추가' })
    expect(addBtn).not.toBeDisabled()
  })

  it('지표 선택 후 추가 시 위젯이 스토어에 추가된다', () => {
    const onClose = vi.fn()
    renderModal(true, onClose)
    fireEvent.click(screen.getByText('지표를 선택하세요'))
    fireEvent.click(screen.getByText('VIX (VIX)'))
    fireEvent.click(screen.getByRole('button', { name: '추가' }))
    expect(useDashboardStore.getState().widgets.length).toBe(1)
    expect(useDashboardStore.getState().widgets[0].indicatorId).toBe(1)
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('차트 타입을 선택할 수 있다', () => {
    renderModal()
    fireEvent.click(screen.getByText('Bar'))
    const barBtn = screen.getByText('Bar').closest('button')!
    expect(barBtn.className).toContain('blue')
  })

  it('색상을 선택할 수 있다', () => {
    renderModal()
    const colorBtns = screen.getAllByRole('button').filter(
      (b) => b.style.backgroundColor !== '',
    )
    fireEvent.click(colorBtns[1])
    // 선택된 색상은 테두리가 변경됨
    expect(colorBtns[1].className).toContain('border-white')
  })
})
