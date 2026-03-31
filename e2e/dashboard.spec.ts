import { test, expect } from '@playwright/test'

test.describe('Dashboard Page', () => {
  test('should load and display Market Overview', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('Market Overview')).toBeVisible()
  })

  test('should have period selector buttons', async ({ page }) => {
    await page.goto('/')
    for (const period of ['1D', '1W', '1M', '3M', '1Y']) {
      await expect(page.getByRole('button', { name: period })).toBeVisible()
    }
  })

  test('should have collapsible sidebar navigation', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('Overview')).toBeVisible()
  })
})
