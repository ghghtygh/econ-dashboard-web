import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { Tabs, TabsList, TabsTrigger, TabsContent } from './Tabs'

function TabsFixture({ onValueChange }: { onValueChange?: (v: string) => void }) {
  return (
    <Tabs defaultValue="tab1" onValueChange={onValueChange}>
      <TabsList>
        <TabsTrigger value="tab1">탭 1</TabsTrigger>
        <TabsTrigger value="tab2">탭 2</TabsTrigger>
      </TabsList>
      <TabsContent value="tab1">탭 1 내용</TabsContent>
      <TabsContent value="tab2">탭 2 내용</TabsContent>
    </Tabs>
  )
}

describe('Tabs', () => {
  it('기본값 탭의 내용을 보여준다', () => {
    render(<TabsFixture />)
    expect(screen.getByText('탭 1 내용')).toBeInTheDocument()
    expect(screen.queryByText('탭 2 내용')).not.toBeInTheDocument()
  })

  it('다른 탭 클릭 시 내용이 전환된다', () => {
    render(<TabsFixture />)
    fireEvent.click(screen.getByRole('tab', { name: '탭 2' }))
    expect(screen.queryByText('탭 1 내용')).not.toBeInTheDocument()
    expect(screen.getByText('탭 2 내용')).toBeInTheDocument()
  })

  it('활성 탭의 aria-selected가 true이다', () => {
    render(<TabsFixture />)
    expect(screen.getByRole('tab', { name: '탭 1' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tab', { name: '탭 2' })).toHaveAttribute('aria-selected', 'false')
  })

  it('탭 변경 시 onValueChange가 호출된다', () => {
    const onValueChange = vi.fn()
    render(<TabsFixture onValueChange={onValueChange} />)
    fireEvent.click(screen.getByRole('tab', { name: '탭 2' }))
    expect(onValueChange).toHaveBeenCalledWith('tab2')
  })

  it('controlled mode: value prop이 우선한다', () => {
    render(
      <Tabs defaultValue="tab1" value="tab2">
        <TabsList>
          <TabsTrigger value="tab1">탭 1</TabsTrigger>
          <TabsTrigger value="tab2">탭 2</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">탭 1 내용</TabsContent>
        <TabsContent value="tab2">탭 2 내용</TabsContent>
      </Tabs>,
    )
    expect(screen.getByText('탭 2 내용')).toBeInTheDocument()
    expect(screen.queryByText('탭 1 내용')).not.toBeInTheDocument()
  })

  it('TabsContent는 tabpanel role을 가진다', () => {
    render(<TabsFixture />)
    expect(screen.getByRole('tabpanel')).toBeInTheDocument()
  })
})
