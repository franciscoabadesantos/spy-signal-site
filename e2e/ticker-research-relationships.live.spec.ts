import { expect, test, type Page, type TestInfo } from '@playwright/test'

const runLiveTickerQa = process.env.RUN_TICKER_LIVE_QA === '1'

async function capture(page: Page, testInfo: TestInfo, name: string) {
  await page.screenshot({ path: testInfo.outputPath(name + '.png'), fullPage: true })
}

async function expectNoHorizontalOverflow(page: Page) {
  const dimensions = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }))
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth + 1)
}

test.describe('Phase 3 relationship evidence', () => {
  test.skip(!runLiveTickerQa, 'Set RUN_TICKER_LIVE_QA=1 to exercise finance-backend relationship coverage states.')
  test.describe.configure({ mode: 'serial', timeout: 240_000 })

  test('AAPL keeps layer and window state shareable', async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/stocks/AAPL/relationships?lens=medium&layer=market&window=252')

    await expect(page.getByRole('heading', { name: 'Relationships', exact: true })).toBeVisible()
    await expect(page.locator('[data-relationship-evidence]')).toBeVisible()
    await expect(page.getByText('Confidence', { exact: true })).toHaveCount(0)
    await expect(page.locator('canvas')).toBeVisible()
    await expectNoHorizontalOverflow(page)
    await capture(page, testInfo, 'aapl-relationships-market-desktop')

    const residual = page.getByRole('button', { name: 'Residual co-movement', exact: true })
    await expect(residual).toBeVisible()
    await residual.click()
    await expect(page).toHaveURL(/lens=medium&layer=residual&window=252|lens=medium&window=252&layer=residual/)
    await capture(page, testInfo, 'aapl-relationships-residual-desktop')

    for (const layer of ['Directional relationship', 'Market co-movement', 'Theme relationship']) {
      const button = page.getByRole('button', { name: layer, exact: true })
      if (await button.count()) {
        await button.click()
        await expect(button).toHaveAttribute('aria-pressed', 'true')
        await capture(page, testInfo, `aapl-relationships-${layer.toLowerCase().replaceAll(' ', '-')}`)
      }
    }
  })

  test('AAPL is list-first on mobile and remains usable at 320px', async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/stocks/AAPL/relationships?lens=long&window=252')
    await expect(page.locator('canvas')).toHaveCount(0)
    await expect(page.locator('[data-relationship-evidence] ol:visible').first()).toBeVisible()
    await expectNoHorizontalOverflow(page)
    await capture(page, testInfo, 'aapl-relationships-mobile')

    await page.setViewportSize({ width: 320, height: 568 })
    await page.reload()
    await expect(page.locator('[data-relationship-evidence] ol:visible').first()).toBeVisible()
    await expectNoHorizontalOverflow(page)
    await capture(page, testInfo, 'aapl-relationships-320')
  })

  test('fund and partial equity states stay compact and asset-aware', async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/stocks/QQQ/relationships?lens=long')
    await expect(page.getByRole('heading', { name: 'Relationships', exact: true })).toBeVisible()
    await expect(page.getByText('Partial coverage', { exact: true }).last()).toBeVisible()
    await expectNoHorizontalOverflow(page)
    await capture(page, testInfo, 'qqq-relationships-partial')

    await page.goto('/stocks/0005.HK/relationships?lens=medium')
    await expect(page.getByRole('heading', { name: 'Relationships', exact: true })).toBeVisible()
    await expect(page.getByText(/Partial coverage|Dataset as of/).first()).toBeVisible()
    await expectNoHorizontalOverflow(page)
    await capture(page, testInfo, '0005-relationships-partial')
  })

  test('reduced motion and keyboard focus preserve the relationship controls', async ({ page }, testInfo) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/stocks/AAPL/relationships?lens=trade&layer=market&window=252')
    const typeGroup = page.getByRole('group', { name: 'Relationship type' })
    await typeGroup.getByRole('button', { name: 'Market co-movement', exact: true }).focus()
    await expect(typeGroup.getByRole('button', { name: 'Market co-movement', exact: true })).toBeFocused()
    await expectNoHorizontalOverflow(page)
    await capture(page, testInfo, 'aapl-relationships-reduced-motion')
  })
})
