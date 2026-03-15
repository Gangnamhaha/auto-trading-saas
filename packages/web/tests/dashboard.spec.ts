import { test, expect } from '@playwright/test'

test.describe('Dashboard', () => {
  test('dashboard page renders portfolio summary', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page.locator('h1')).toContainText('대시보드')
    await expect(page.locator('text=총 자산')).toBeVisible()
  })

  test('strategies page shows strategy cards', async ({ page }) => {
    await page.goto('/strategies')
    await expect(page.locator('h1')).toContainText('전략 설정')
    await expect(page.locator('text=MA 크로스오버')).toBeVisible()
    await expect(page.locator('text=RSI 과매수/과매도')).toBeVisible()
  })

  test('backtest page has form elements', async ({ page }) => {
    await page.goto('/backtest')
    await expect(
      page.locator('form, .backtest-form, select, [data-testid=backtest-form]')
    ).toBeVisible()
  })

  test('broker settings page has API key inputs', async ({ page }) => {
    await page.goto('/settings/broker')
    await expect(
      page.locator('input[type=text], input[type=password]')
    ).toBeVisible()
  })
})
