import { test, expect } from '@playwright/test'

/**
 * 테마 전환 (Dark / Light) E2E 시나리오
 *
 * 테마는 Zustand 스토어(useThemeStore)를 통해 관리되며
 * localStorage 키 `econ-dashboard-theme` 에 퍼시스팅됩니다.
 * App.tsx가 `document.documentElement.classList`에 'dark' 클래스를
 * 토글하므로 프로그래매틱하게 검증 가능합니다.
 *
 * Header 컴포넌트(aria-label="테마 전환")는 현재 어떤 페이지에도
 * 렌더링되지 않아 UI 버튼 클릭 테스트는 test.fixme 처리합니다.
 *
 * 활성 테스트:
 *  - localStorage 설정으로 다크 테마가 html 클래스에 반영됨을 확인
 *  - localStorage 설정으로 라이트 테마가 html 클래스에 반영됨을 확인
 *
 * fixme 테스트 (Header 페이지 통합 후 활성화 필요):
 *  - 테마 전환 버튼 클릭으로 다크/라이트 전환
 */

const THEME_STORAGE_KEY = 'econ-dashboard-theme'

function themePayload(theme: 'light' | 'dark') {
  return JSON.stringify({ state: { theme }, version: 0 })
}

test.describe('테마 전환 (Dark / Light)', () => {
  test('다크 테마를 설정하면 html 요소에 dark 클래스가 추가되어야 한다', async ({ page }) => {
    // 페이지 로드 전에 localStorage 주입
    await page.addInitScript(
      ({ key, value }) => {
        localStorage.setItem(key, value)
      },
      { key: THEME_STORAGE_KEY, value: themePayload('dark') },
    )

    await page.goto('/')
    await expect(page.locator('html')).toHaveClass(/dark/)
  })

  test('라이트 테마를 설정하면 html 요소에 dark 클래스가 없어야 한다', async ({ page }) => {
    await page.addInitScript(
      ({ key, value }) => {
        localStorage.setItem(key, value)
      },
      { key: THEME_STORAGE_KEY, value: themePayload('light') },
    )

    await page.goto('/')
    const htmlClass = await page.locator('html').getAttribute('class')
    expect(htmlClass ?? '').not.toContain('dark')
  })

  test('기본 테마(localStorage 없음)는 라이트 모드여야 한다', async ({ page }) => {
    // localStorage를 비운 상태에서 페이지 로드
    await page.addInitScript(() => {
      localStorage.clear()
    })

    await page.goto('/')
    const htmlClass = await page.locator('html').getAttribute('class')
    expect(htmlClass ?? '').not.toContain('dark')
  })

  test.fixme(
    'Header의 테마 전환 버튼을 클릭하면 다크 모드로 전환되어야 한다',
    async ({ page }) => {
      // Pre-condition: Header component must be rendered in the app
      await page.addInitScript(
        ({ key, value }) => localStorage.setItem(key, value),
        { key: THEME_STORAGE_KEY, value: themePayload('light') },
      )

      await page.goto('/')

      const toggleButton = page.getByRole('button', { name: '테마 전환' })
      await expect(toggleButton).toBeVisible()

      // 라이트 → 다크
      await toggleButton.click()
      await expect(page.locator('html')).toHaveClass(/dark/)

      // 다크 → 라이트
      await toggleButton.click()
      const htmlClass = await page.locator('html').getAttribute('class')
      expect(htmlClass ?? '').not.toContain('dark')
    },
  )
})
