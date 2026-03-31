import { test, expect } from '@playwright/test'

/**
 * Alert (AlertPanel) E2E Scenarios
 *
 * NOTE: AlertPanel is defined in src/components/dashboard/AlertPanel.tsx
 * but is not yet rendered in any page. The tests below are marked with
 * test.fixme so they are tracked and ready to enable once the component
 * is integrated into the dashboard or a dedicated route.
 *
 * Tests cover:
 *  - Adding an alert rule via the preset "추천 알림 규칙" buttons
 *  - Adding a custom alert rule via the "규칙 추가" modal
 *  - Deleting an existing alert rule
 */

test.describe('Alert (알림) 생성/삭제', () => {
  test.fixme(
    'preset 알림 규칙을 추가할 수 있어야 한다',
    async ({ page }) => {
      // Pre-condition: AlertPanel must be rendered on this route
      await page.goto('/')

      // "추천 알림 규칙" 섹션의 첫 번째 "추가" 버튼 클릭
      const presetAddButton = page
        .locator('button', { hasText: '추가' })
        .filter({ hasNot: page.locator('[disabled]') })
        .first()
      await expect(presetAddButton).toBeVisible()
      await presetAddButton.click()

      // 버튼이 "추가됨" 으로 변경되어 비활성화 되어야 한다
      await expect(presetAddButton).toHaveText('추가됨')
      await expect(presetAddButton).toBeDisabled()

      // "활성 규칙" 목록에 새 규칙이 나타나야 한다
      await expect(page.getByText('활성 규칙')).toBeVisible()
    },
  )

  test.fixme(
    '커스텀 알림 규칙을 모달로 추가할 수 있어야 한다',
    async ({ page }) => {
      await page.goto('/')

      // "규칙 추가" 버튼 클릭 → 모달 열기
      await page.getByRole('button', { name: /규칙 추가/ }).click()
      await expect(page.getByText('알림 규칙 추가')).toBeVisible()

      // 지표 선택 드롭다운
      await page.locator('[placeholder="지표를 선택하세요"]').click()
      await page.locator('[role="option"]').first().click()

      // 임계값 입력
      await page.locator('input[type="number"]').fill('30')

      // 저장
      await page.getByRole('button', { name: '저장' }).click()

      // 모달 닫힘 확인
      await expect(page.getByText('알림 규칙 추가')).not.toBeVisible()

      // 활성 규칙 목록에 추가됐는지 확인
      await expect(page.getByText('활성 규칙')).toBeVisible()
    },
  )

  test.fixme(
    '알림 규칙을 삭제할 수 있어야 한다',
    async ({ page }) => {
      await page.goto('/')

      // 먼저 preset 규칙 하나 추가
      const presetAddButton = page
        .locator('button', { hasText: '추가' })
        .filter({ hasNot: page.locator('[disabled]') })
        .first()
      await presetAddButton.click()
      await expect(page.getByText('활성 규칙')).toBeVisible()

      // 규칙 삭제 버튼 (Trash2 아이콘) 클릭
      const deleteButton = page
        .locator('button[aria-label], button')
        .filter({ has: page.locator('svg') })
        .last()

      const ruleCountBefore = await page.locator('.space-y-2 > div').count()
      await deleteButton.click()
      const ruleCountAfter = await page.locator('.space-y-2 > div').count()

      expect(ruleCountAfter).toBeLessThan(ruleCountBefore)
    },
  )
})
