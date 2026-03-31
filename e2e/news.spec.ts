import { test, expect } from '@playwright/test'

test.describe('News Page', () => {
  test('should load and display economic news', async ({ page }) => {
    await page.goto('/news')
    await expect(page.getByRole('heading', { name: '경제 뉴스' })).toBeVisible()
  })

  test('should have category tabs', async ({ page }) => {
    await page.goto('/news')
    // "ALL" category label is '전체' in the app
    await expect(page.getByRole('button', { name: '전체' })).toBeVisible()
  })
})
