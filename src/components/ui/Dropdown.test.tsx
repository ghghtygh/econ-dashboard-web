import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { Dropdown, DropdownMenu, DropdownMenuItem } from './Dropdown'

const OPTIONS = [
  { value: 'a', label: '옵션 A' },
  { value: 'b', label: '옵션 B' },
  { value: 'c', label: '옵션 C' },
]

describe('Dropdown', () => {
  it('placeholder를 기본으로 표시한다', () => {
    render(<Dropdown options={OPTIONS} placeholder="선택하세요" />)
    expect(screen.getByText('선택하세요')).toBeInTheDocument()
  })

  it('value에 해당하는 레이블을 표시한다', () => {
    render(<Dropdown options={OPTIONS} value="b" />)
    expect(screen.getByText('옵션 B')).toBeInTheDocument()
  })

  it('버튼 클릭 시 옵션 목록이 열린다', () => {
    render(<Dropdown options={OPTIONS} />)
    const trigger = screen.getByRole('button')
    fireEvent.click(trigger)
    expect(screen.getByText('옵션 A')).toBeInTheDocument()
    expect(screen.getByText('옵션 B')).toBeInTheDocument()
    expect(screen.getByText('옵션 C')).toBeInTheDocument()
  })

  it('옵션 선택 시 onChange가 호출되고 목록이 닫힌다', () => {
    const onChange = vi.fn()
    render(<Dropdown options={OPTIONS} onChange={onChange} />)
    fireEvent.click(screen.getByRole('button'))
    fireEvent.click(screen.getByText('옵션 A'))
    expect(onChange).toHaveBeenCalledWith('a')
  })

  it('외부 클릭 시 목록이 닫힌다', () => {
    render(
      <div>
        <Dropdown options={OPTIONS} />
        <div data-testid="outside">외부</div>
      </div>,
    )
    fireEvent.click(screen.getByRole('button'))
    expect(screen.getByText('옵션 A')).toBeInTheDocument()
    fireEvent.mouseDown(screen.getByTestId('outside'))
    expect(screen.queryByText('옵션 A')).not.toBeInTheDocument()
  })
})

describe('DropdownMenu', () => {
  it('트리거를 렌더링하고 클릭 시 자식을 보여준다', () => {
    render(
      <DropdownMenu trigger={<button>메뉴 열기</button>}>
        <DropdownMenuItem>항목 1</DropdownMenuItem>
      </DropdownMenu>,
    )
    expect(screen.queryByText('항목 1')).not.toBeInTheDocument()
    fireEvent.click(screen.getByText('메뉴 열기'))
    expect(screen.getByText('항목 1')).toBeInTheDocument()
  })

  it('항목 클릭 시 메뉴가 닫힌다', () => {
    const onClick = vi.fn()
    render(
      <DropdownMenu trigger={<button>열기</button>}>
        <DropdownMenuItem onClick={onClick}>항목 1</DropdownMenuItem>
      </DropdownMenu>,
    )
    fireEvent.click(screen.getByText('열기'))
    fireEvent.click(screen.getByText('항목 1'))
    expect(onClick).toHaveBeenCalledOnce()
    expect(screen.queryByText('항목 1')).not.toBeInTheDocument()
  })

  it('danger 항목에 위험 스타일이 적용된다', () => {
    render(
      <DropdownMenu trigger={<button>열기</button>}>
        <DropdownMenuItem danger>삭제</DropdownMenuItem>
      </DropdownMenu>,
    )
    fireEvent.click(screen.getByText('열기'))
    const item = screen.getByText('삭제')
    expect(item).toHaveClass('text-red-400')
  })
})
