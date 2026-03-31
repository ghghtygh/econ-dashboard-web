import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { Modal, ModalHeader, ModalBody, ModalFooter } from './Modal'

describe('Modal', () => {
  it('open=false이면 아무것도 렌더링하지 않는다', () => {
    render(
      <Modal open={false} onClose={vi.fn()}>
        <div>모달 내용</div>
      </Modal>,
    )
    expect(screen.queryByText('모달 내용')).not.toBeInTheDocument()
  })

  it('open=true이면 자식을 렌더링한다', () => {
    render(
      <Modal open={true} onClose={vi.fn()}>
        <div>모달 내용</div>
      </Modal>,
    )
    expect(screen.getByText('모달 내용')).toBeInTheDocument()
  })

  it('Escape 키를 누르면 onClose가 호출된다', () => {
    const onClose = vi.fn()
    render(
      <Modal open={true} onClose={onClose}>
        <div>모달 내용</div>
      </Modal>,
    )
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('오버레이 클릭 시 onClose가 호출된다', () => {
    const onClose = vi.fn()
    const { container } = render(
      <Modal open={true} onClose={onClose}>
        <div>모달 내용</div>
      </Modal>,
    )
    // 오버레이(fixed inset-0 z-50) 클릭
    const overlay = container.querySelector('.fixed.inset-0.z-50')!
    fireEvent.click(overlay, { target: overlay })
    expect(onClose).toHaveBeenCalled()
  })
})

describe('ModalHeader', () => {
  it('제목을 렌더링한다', () => {
    render(<ModalHeader>제목</ModalHeader>)
    expect(screen.getByText('제목')).toBeInTheDocument()
  })

  it('onClose가 있으면 닫기 버튼을 렌더링하고 클릭 가능하다', () => {
    const onClose = vi.fn()
    render(<ModalHeader onClose={onClose}>제목</ModalHeader>)
    const closeBtn = screen.getByRole('button')
    fireEvent.click(closeBtn)
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('onClose가 없으면 닫기 버튼을 렌더링하지 않는다', () => {
    render(<ModalHeader>제목</ModalHeader>)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})

describe('ModalBody', () => {
  it('자식을 렌더링한다', () => {
    render(<ModalBody>본문 내용</ModalBody>)
    expect(screen.getByText('본문 내용')).toBeInTheDocument()
  })
})

describe('ModalFooter', () => {
  it('자식을 렌더링한다', () => {
    render(<ModalFooter><button>확인</button></ModalFooter>)
    expect(screen.getByRole('button', { name: '확인' })).toBeInTheDocument()
  })
})
