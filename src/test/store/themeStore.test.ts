import { describe, it, expect, beforeEach } from 'vitest'
import { useThemeStore } from '@/store/themeStore'

beforeEach(() => {
  useThemeStore.setState({ theme: 'light' })
})

describe('themeStore', () => {
  it('초기 테마는 light이다', () => {
    expect(useThemeStore.getState().theme).toBe('light')
  })

  it('toggleTheme으로 dark로 전환된다', () => {
    useThemeStore.getState().toggleTheme()
    expect(useThemeStore.getState().theme).toBe('dark')
  })

  it('두 번 토글하면 light로 돌아온다', () => {
    useThemeStore.getState().toggleTheme()
    useThemeStore.getState().toggleTheme()
    expect(useThemeStore.getState().theme).toBe('light')
  })
})
