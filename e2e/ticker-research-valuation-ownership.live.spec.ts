import { expect, test, type Page, type TestInfo } from '@playwright/test'

const runLiveTickerQa = process.env.RUN_TICKER_LIVE_QA === '1'

async function expectNoHorizontalOverflow(page: Page) {
  const dimensions = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }))
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth + 1)
}

async function capture(page: Page, testInfo: TestInfo, name: string, fullPage = true) {
  await page.screenshot({ path: testInfo.outputPath(`${name}.png`), fullPage })
}

async function expectPerspectiveHydrated(page: Page) {
  await expect(page.locator('[data-perspective-dial]')).toHaveAttribute('data-hydrated', 'true')
}

test.describe('ticker valuation and ownership Phase 2 slice', () => {
  test.skip(!runLiveTickerQa, 'Set RUN_TICKER_LIVE_QA=1 to exercise finance-backend coverage states.')
  test.describe.configure({ mode: 'serial', timeout: 240_000 })

  test('Valuation History preserves metric, frequency and Lens state', async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/stocks/AAPL/valuation?lens=trade&metric=pe&period=annual')
    await expectPerspectiveHydrated(page)
    await expect(page.getByRole('heading', { name: 'Valuation History', exact: true })).toBeVisible()
    await expect(page.getByRole('link', { name: 'P/E', exact: true })).toHaveAttribute('aria-current', 'page')
    await expect(page.getByRole('link', { name: 'Annual', exact: true })).toHaveAttribute('aria-current', 'page')
    await expect(page.getByText('Historical multiple series', { exact: true })).toBeVisible()
    await expect(page.getByText('Pending integration', { exact: true }).first()).toBeVisible()
    await expect(page.getByRole('link', { name: 'Valuation', exact: true })).toHaveAttribute('aria-current', 'page')
    await expectNoHorizontalOverflow(page)
    await capture(page, testInfo, 'phase2-valuation-aapl-trade-desktop')

    await page.getByRole('link', { name: 'Quarterly', exact: true }).click()
    await expect(page).toHaveURL(/metric=pe.*period=quarterly/)
    await expect(page.getByRole('link', { name: 'Quarterly', exact: true })).toHaveAttribute('aria-current', 'page')
    await page.setViewportSize({ width: 390, height: 844 })
    await expectNoHorizontalOverflow(page)
    await capture(page, testInfo, 'phase2-valuation-aapl-trade-mobile')

    await page.goto('/stocks/AAPL/valuation?lens=long&metric=ps&period=annual')
    await expectPerspectiveHydrated(page)
    await expect(page.getByRole('link', { name: 'P/S', exact: true })).toHaveAttribute('aria-current', 'page')
    await expect(page.getByText('Historical multiple series', { exact: true })).toBeVisible()
    await expectNoHorizontalOverflow(page)
    await capture(page, testInfo, 'phase2-valuation-aapl-long-pending-desktop')
  })

  test('Ownership and Fund Structure preserve asset-aware semantics', async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/stocks/AAPL/ownership?lens=long')
    await expectPerspectiveHydrated(page)
    await expect(page.getByRole('heading', { name: 'Ownership & Capital', exact: true })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Ownership breakdown', exact: true })).toBeVisible()
    await expect(page.getByText('Enterprise value', { exact: true })).toBeVisible()
    await expect(page.getByText('Market cap', { exact: true }).first()).toBeVisible()
    await expect(page.getByRole('button', { name: 'More', exact: true })).toHaveAttribute('aria-expanded', 'false')
    await expect(page.getByRole('button', { name: 'More', exact: true }).locator('..')).toHaveAttribute('data-active', 'true')
    await expectNoHorizontalOverflow(page)
    await capture(page, testInfo, 'phase2-ownership-aapl-long-desktop')

    await page.setViewportSize({ width: 390, height: 844 })
    await expectNoHorizontalOverflow(page)
    await capture(page, testInfo, 'phase2-ownership-aapl-long-mobile')

    await page.goto('/stocks/QQQ/ownership?lens=trade')
    await expectPerspectiveHydrated(page)
    await expect(page.getByRole('heading', { name: 'Fund Structure', exact: true })).toBeVisible()
    await expect(page.getByText(/no corporate ownership model applied/)).toBeVisible()
    await expect(page.getByText('Insider', { exact: true })).toHaveCount(0)
    await expectNoHorizontalOverflow(page)
    await capture(page, testInfo, 'phase2-ownership-qqq-fund-structure')

    await page.setViewportSize({ width: 1440, height: 900 })
    await page.evaluate(() => { document.documentElement.style.zoom = '2' })
    await expect.poll(() => page.evaluate(() => getComputedStyle(document.documentElement).zoom)).toBe('2')
    await expectNoHorizontalOverflow(page)
    await capture(page, testInfo, 'phase2-ownership-qqq-200-zoom')
  })
})
