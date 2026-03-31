import { test, expect } from '@playwright/test'

test.describe('Navigation', () => {
  test('should navigate between pages', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('Market Overview')).toBeVisible()

    await page.goto('/explore')
    await expect(page.getByRole('heading', { name: '지표 탐색' })).toBeVisible()

    await page.goto('/news')
    await expect(page.getByRole('heading', { name: '경제 뉴스' })).toBeVisible()
  })

  test('should handle unknown routes gracefully', async ({ page }) => {
    await page.goto('/nonexistent-page')
    // Catch-all route redirects to dashboard
    await expect(page.getByText('Market Overview')).toBeVisible()
  })
})
