import { test, expect } from '@playwright/test'

test.describe('News Page', () => {
  test('should load and display economic news', async ({ page }) => {
    await page.goto('/news')
    await expect(page.getByText('경제 뉴스')).toBeVisible()
  })

  test('should have category tabs', async ({ page }) => {
    await page.goto('/news')
    await expect(page.getByRole('button', { name: 'ALL' })).toBeVisible()
  })
})
