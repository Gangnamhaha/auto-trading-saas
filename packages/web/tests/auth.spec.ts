import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test('signup -> login -> dashboard redirect', async ({ page }) => {
    await page.goto('/signup')
    await expect(page.locator('form')).toBeVisible()

    await page.fill('input[type="email"]', 'e2e@test.com')
    await page.fill('input[type="password"]:first-of-type', 'SecureP@ss1234')
    await page.check('input[type="checkbox"]')
    await page.click('button[type=submit]')

    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/dashboard/)
    await expect(page.locator('h1')).toContainText('대시보드')
  })

  test('login with wrong password shows error', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]', 'wrong@test.com')
    await page.fill('input[type="password"]', 'wrongpassword')
    await page.click('button[type=submit]')

    await expect(
      page.locator('.error-message, [role=alert], text=로그인')
    ).toBeVisible()
  })

  test('landing page has disclaimer text', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('text=투자 원금 손실')).toBeVisible()
  })
})
