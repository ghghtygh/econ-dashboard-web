import { test, expect } from '@playwright/test'

test.describe('Explore Page', () => {
  test('should load and display indicator explorer', async ({ page }) => {
    await page.goto('/explore')
    await expect(page.getByText('지표 탐색')).toBeVisible()
  })

  test('should have category filter buttons', async ({ page }) => {
    await page.goto('/explore')
    await expect(page.getByRole('button', { name: 'ALL' })).toBeVisible()
  })

  test('should have a search input', async ({ page }) => {
    await page.goto('/explore')
    const searchInput = page.getByPlaceholder(/검색|search/i)
    await expect(searchInput).toBeVisible()
  })
})
