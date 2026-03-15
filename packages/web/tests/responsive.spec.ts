import { test, expect } from '@playwright/test'

const viewports = [
  { name: 'mobile', width: 375, height: 812 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1440, height: 900 },
]

for (const viewport of viewports) {
  test(`landing page renders on ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize({
      width: viewport.width,
      height: viewport.height,
    })
    await page.goto('/')
    await expect(page).toHaveTitle(/AutoTrade/)
    await page.screenshot({
      path: `.sisyphus/evidence/task-9-responsive-${viewport.name}.png`,
    })
  })
}
