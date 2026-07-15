import { expect, test, type Page } from '@playwright/test'

const viewports = [
  { name: 'small-mobile', width: 320, height: 568 },
  { name: 'modern-mobile', width: 390, height: 844 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'laptop', width: 1366, height: 768 },
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'wide-desktop', width: 1920, height: 1080 },
] as const

async function horizontalOverflow(page: Page) {
  return page.evaluate(() => {
    const root = document.documentElement
    const hasDocumentOverflow = root.scrollWidth > root.clientWidth + 1
    const offenders = hasDocumentOverflow
      ? Array.from(document.querySelectorAll<HTMLElement>('body *'))
          .filter((element) => {
            const rect = element.getBoundingClientRect()
            return rect.right > root.clientWidth + 1 || rect.left < -1
          })
          .slice(0, 8)
          .map((element) => ({
            element: element.tagName.toLowerCase(),
            id: element.id,
            className: typeof element.className === 'string' ? element.className.slice(0, 120) : '',
          }))
      : []

    return {
      clientWidth: root.clientWidth,
      scrollWidth: root.scrollWidth,
      offenders,
    }
  })
}

for (const viewport of viewports) {
  test(`homepage loads without horizontal overflow at ${viewport.name}`, async ({ page }, testInfo) => {
    const runtimeErrors: string[] = []
    page.on('pageerror', (error) => runtimeErrors.push(`pageerror: ${error.message}`))
    page.on('console', (message) => {
      if (message.type() === 'error') runtimeErrors.push(`console: ${message.text()}`)
    })
    await page.route('**/api/tickers/index', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ items: [] }),
      })
    )
    await page.route('**/api/analytics/event', (route) => route.fulfill({ status: 204 }))

    await page.setViewportSize(viewport)
    const response = await page.goto('/', { waitUntil: 'load' })

    expect(response?.ok()).toBeTruthy()
    await expect(page.locator('main')).toBeVisible()
    await page.evaluate(() => document.fonts.ready)
    await page.evaluate(
      () =>
        new Promise<void>((resolve) => {
          requestAnimationFrame(() => {
            requestAnimationFrame(() => resolve())
          })
        })
    )

    const overflow = await horizontalOverflow(page)
    expect(overflow, JSON.stringify(overflow, null, 2)).toMatchObject({
      clientWidth: viewport.width,
      scrollWidth: viewport.width,
      offenders: [],
    })
    expect(runtimeErrors, runtimeErrors.join('\n')).toEqual([])

    if (process.env.PLAYWRIGHT_CAPTURE === '1') {
      await page.screenshot({
        path: testInfo.outputPath(`homepage-${viewport.name}.png`),
        fullPage: false,
      })
    }
  })
}
