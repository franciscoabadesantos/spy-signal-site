import { test, expect } from '@playwright/test'

test.describe('Product marketing page', () => {
  test('explains the current product and exposes the reduced marketing navigation', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/product', { waitUntil: 'load' })

    await expect(page.getByRole('heading', { name: 'Research the market with more context.' })).toBeVisible()
    await expect(page.locator('.site-header__bar nav a')).toHaveText(['Product', 'Pricing', 'FAQ'])
    await expect(page.locator('#flow')).toBeVisible()
    await expect(page.locator('#ticker-pages')).toBeVisible()
    await expect(page.locator('#compare')).toBeVisible()
    await expect(page.locator('#watchlists')).toBeVisible()
    await expect(page.locator('#methodology')).toBeVisible()
    await expect(page.locator('#limits')).toBeVisible()

    const bodyText = await page.locator('body').innerText()
    expect(bodyText).not.toContain('Signal before the open.')
    expect(bodyText).not.toContain('One trade.')
    expect(bodyText).not.toContain('S&P 500')
    expect(bodyText).not.toContain('How it works')
  })

  test('legacy marketing routes redirect to the relevant Product section', async ({ page }) => {
    const redirects = [
      ['/how-it-works', '/product#flow'],
      ['/performance', '/product#limits'],
      ['/method', '/product#methodology'],
      ['/methodology', '/product#methodology'],
    ] as const

    for (const [legacyRoute, productRoute] of redirects) {
      await page.goto(legacyRoute, { waitUntil: 'load' })
      await expect(page).toHaveURL(new RegExp(`${productRoute.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`))
    }
  })
})

for (const viewport of [
  { name: 'small-mobile', width: 320, height: 568 },
  { name: 'laptop', width: 1366, height: 768 },
  { name: 'wide-desktop', width: 1920, height: 1080 },
]) {
  test(`Product has no horizontal overflow at ${viewport.name}`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height })
    await page.goto('/product', { waitUntil: 'load' })
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)

    if (process.env.PLAYWRIGHT_CAPTURE === '1') {
      await page.screenshot({
        path: testInfo.outputPath(`product-${viewport.name}.png`),
        fullPage: false,
      })
    }
  })
}
