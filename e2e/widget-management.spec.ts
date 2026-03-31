import { test, expect } from '@playwright/test'

/**
 * Widget Management E2E Scenarios
 *
 * "대시보드에 추가" 흐름은 /explore 페이지에서 현재 접근 가능합니다.
 * WidgetGrid 컴포넌트(src/components/dashboard/WidgetGrid.tsx)는 아직
 * 어떤 페이지에도 렌더링되지 않아 위젯 제거 테스트는 test.fixme 처리합니다.
 *
 * 활성 테스트:
 *  - Explore 페이지에서 "대시보드에 추가" 버튼 동작 검증
 *  - 동일 지표를 중복 추가 시 버튼 비활성화 검증
 *
 * fixme 테스트 (WidgetGrid 페이지 통합 후 활성화 필요):
 *  - 대시보드의 WidgetGrid에서 위젯 제거
 */

test.describe('위젯 추가 (Explore → Dashboard)', () => {
  test('지표 탐색 페이지에서 위젯을 대시보드에 추가할 수 있어야 한다', async ({ page }) => {
    await page.goto('/explore')

    // 지표 목록이 로드될 때까지 대기
    await page.waitForSelector('button:has-text("대시보드에 추가")', { timeout: 10_000 })

    const addButton = page.locator('button', { hasText: '대시보드에 추가' }).first()
    await expect(addButton).toBeVisible()
    await expect(addButton).toBeEnabled()

    await addButton.click()

    // 버튼이 "대시보드에 추가됨"으로 변경되고 비활성화 되어야 한다
    await expect(
      page.locator('button', { hasText: '대시보드에 추가됨' }).first(),
    ).toBeVisible()
    await expect(
      page.locator('button', { hasText: '대시보드에 추가됨' }).first(),
    ).toBeDisabled()
  })

  test('같은 지표를 두 번 추가하면 버튼이 비활성화 상태를 유지해야 한다', async ({ page }) => {
    await page.goto('/explore')
    await page.waitForSelector('button:has-text("대시보드에 추가")', { timeout: 10_000 })

    const addButton = page.locator('button', { hasText: '대시보드에 추가' }).first()
    await addButton.click()

    // 이미 추가된 버튼은 다시 클릭해도 상태가 유지되어야 한다
    const addedButton = page.locator('button', { hasText: '대시보드에 추가됨' }).first()
    await expect(addedButton).toBeDisabled()
    await addedButton.click({ force: true })
    await expect(addedButton).toBeDisabled()
    await expect(addedButton).toHaveText('대시보드에 추가됨')
  })

  test('카테고리 필터 전체 버튼이 표시되어야 한다', async ({ page }) => {
    await page.goto('/explore')
    // "ALL" category label is '전체' in the app
    await expect(page.getByRole('button', { name: '전체' })).toBeVisible()
  })
})

test.describe('위젯 제거 (WidgetGrid)', () => {
  test.fixme(
    'WidgetGrid에서 X 버튼으로 위젯을 제거할 수 있어야 한다',
    async ({ page }) => {
      // Pre-condition: WidgetGrid must be rendered on this route
      // and at least one widget must be present in dashboardStore
      await page.goto('/explore')
      await page.waitForSelector('button:has-text("대시보드에 추가")', { timeout: 10_000 })

      // 위젯 추가
      const addButton = page.locator('button', { hasText: '대시보드에 추가' }).first()
      await addButton.click()
      await expect(page.locator('button', { hasText: '대시보드에 추가됨' }).first()).toBeVisible()

      // 대시보드로 이동
      await page.goto('/')

      // WidgetGrid가 렌더링될 때까지 대기
      // (현재 WidgetGrid는 대시보드 페이지에 통합되지 않아 이 단계에서 실패)
      const widgetCount = await page.locator('[class*="WidgetItem"], .widget-item').count()
      expect(widgetCount).toBeGreaterThan(0)

      // 첫 번째 위젯의 닫기(X) 버튼 클릭
      await page.locator('button[aria-label="위젯 삭제"], button svg[data-lucide="x"]').first().click()

      // 위젯 수가 줄어야 한다
      const widgetCountAfter = await page.locator('[class*="WidgetItem"], .widget-item').count()
      expect(widgetCountAfter).toBeLessThan(widgetCount)
    },
  )

  test.fixme(
    '모든 위젯이 제거되면 빈 상태 메시지가 표시되어야 한다',
    async ({ page }) => {
      // Pre-condition: WidgetGrid must be rendered with zero widgets
      await page.goto('/')
      // WidgetGrid 빈 상태 메시지
      await expect(page.getByText('위젯을 추가하여 대시보드를 구성하세요')).toBeVisible()
    },
  )
})
