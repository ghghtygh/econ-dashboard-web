import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ErrorBoundary } from './ErrorBoundary'

// 테스트에서 에러를 throw하는 컴포넌트
function ThrowingComponent({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('테스트 에러 메시지')
  }
  return <div>정상 컨텐츠</div>
}

// console.error를 조용히 처리
beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('ErrorBoundary', () => {
  it('자식 컴포넌트를 정상 렌더링한다', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={false} />
      </ErrorBoundary>,
    )
    expect(screen.getByText('정상 컨텐츠')).toBeInTheDocument()
  })

  it('에러 발생 시 기본 fallback UI를 렌더링한다', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>,
    )
    expect(screen.getByText('오류가 발생했습니다')).toBeInTheDocument()
    expect(screen.getByText('테스트 에러 메시지')).toBeInTheDocument()
  })

  it('에러 발생 시 커스텀 fallback을 렌더링한다', () => {
    render(
      <ErrorBoundary fallback={<div>커스텀 에러 화면</div>}>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>,
    )
    expect(screen.getByText('커스텀 에러 화면')).toBeInTheDocument()
    expect(screen.queryByText('오류가 발생했습니다')).not.toBeInTheDocument()
  })
})
