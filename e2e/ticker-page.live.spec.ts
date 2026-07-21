import { expect, test, type Locator, type Page, type TestInfo } from '@playwright/test'

const runLiveTickerQa = process.env.RUN_TICKER_LIVE_QA === '1'

async function expectNoHorizontalOverflow(page: Page) {
  const dimensions = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }))
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth + 1)
}

async function capture(page: Page, testInfo: TestInfo, name: string) {
  await page.screenshot({ path: testInfo.outputPath(`${name}.png`), fullPage: true })
}

async function captureViewport(page: Page, testInfo: TestInfo, name: string) {
  await page.screenshot({ path: testInfo.outputPath(`${name}.png`) })
}

async function captureElement(locator: Locator, testInfo: TestInfo, name: string) {
  await locator.screenshot({ path: testInfo.outputPath(`${name}.png`) })
}

async function expectLensCentered(page: Page, lens: 'trade' | 'short' | 'medium' | 'long') {
  await expect.poll(async () => page.evaluate((lensKey) => {
    const center = document.querySelector<HTMLElement>('[data-perspective-center]')?.getBoundingClientRect()
    const option = document.querySelector<HTMLElement>(`[data-lens-option="${lensKey}"]`)?.getBoundingClientRect()
    if (!center || !option) return Number.POSITIVE_INFINITY
    return Math.abs((center.left + center.right) / 2 - (option.left + option.right) / 2)
  }, lens)).toBeLessThan(2)
}

function watchForReactRuntimeWarnings(page: Page): string[] {
  const warnings: string[] = []
  page.on('console', (message) => {
    const text = message.text()
    if (
      text.includes('hydrated but some attributes') ||
      text.includes('Each child in a list should have a unique')
    ) {
      warnings.push(text)
    }
  })
  return warnings
}

test.describe('live ticker architecture', () => {
  test.skip(!runLiveTickerQa, 'Set RUN_TICKER_LIVE_QA=1 to exercise finance-backend coverage states.')
  test.describe.configure({ mode: 'serial', timeout: 240_000 })

  test('the same equity becomes a Trade and Long-term research view', async ({ page }, testInfo) => {
    const runtimeWarnings = watchForReactRuntimeWarnings(page)
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/stocks/AAPL?lens=trade')

    await expect(page.getByText('AAPL', { exact: true }).first()).toBeVisible()
    await expect(page.getByText('Equity', { exact: true }).first()).toBeVisible()
    await expect(page.getByRole('link', { name: 'Overview', exact: true })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Relationships', exact: true })).toBeVisible()
    const perspectiveTrigger = page.getByRole('button', { name: /Perspective\s+Trade/ })
    const perspectiveControl = page.getByRole('button', { name: /Perspective/ })
    await expect(perspectiveTrigger).toBeVisible()
    await expect(page.getByRole('radiogroup', { name: 'Investment perspective' })).not.toBeVisible()
    const finalGrade = page.getByRole('complementary', { name: 'Final grade' })
    await expect(finalGrade).toBeVisible()
    await expect(finalGrade.getByRole('img', { name: /^Grade / })).toBeVisible()
    await expect(finalGrade.locator('details')).toHaveCount(0)
    await expect(finalGrade.locator('[class*="snapshotAxis"]')).toHaveCount(0)
    await expect(page.getByRole('heading', { name: 'Technicals', exact: true })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Fundamentals', exact: true })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Relationships', exact: true })).toBeVisible()
    const technicals = page.locator('#signals')
    await expect(technicals.getByText('Summary', { exact: true })).toBeVisible()
    await expect(technicals.getByText('Oscillators', { exact: true })).toBeVisible()
    await expect(technicals.getByText('Moving averages', { exact: true })).toBeVisible()
    await expect(page.getByText(/Is now a good moment|Is the business attractive|What is moving with it|What shapes this asset/)).toHaveCount(0)
    await expect(page.getByText('Lens score', { exact: true })).toHaveCount(0)
    await expect(page.getByText('Continue researching', { exact: true })).toHaveCount(0)
    await expect(page.getByText('Go deeper', { exact: true })).toHaveCount(0)
    await expect(page.getByText('View fundamental details', { exact: true })).toHaveCount(0)
    await expect(page.getByText('Signal flow', { exact: true })).toHaveCount(0)
    await expect(page.getByText('Research Copilot', { exact: true })).toHaveCount(0)
    const topOrder = await page.locator('[data-ticker-identity], [data-ticker-price], [data-ticker-navigation]').evaluateAll((nodes) =>
      Object.fromEntries(nodes.map((node) => [node.getAttribute('data-ticker-identity') !== null ? 'identity' : node.getAttribute('data-ticker-price') !== null ? 'price' : 'navigation', node.getBoundingClientRect().top + window.scrollY])),
    )
    expect(topOrder.identity).toBeLessThan(topOrder.price)
    expect(topOrder.price).toBeLessThan(topOrder.navigation)
    await expect(page.getByRole('button', { name: 'Research', exact: true })).toBeVisible()
    await page.getByRole('button', { name: 'Research', exact: true }).click()
    await expect(page.getByRole('link', { name: 'Lens', exact: true })).toBeVisible()
    await capture(page, testInfo, 'aapl-research-menu-open')
    await page.keyboard.press('Escape')
    await expect(page.getByRole('link', { name: 'Lens', exact: true })).toHaveCount(0)

    await expect(page.getByRole('tablist', { name: 'Chart timeframe' }).getByRole('tab', { name: '1M', exact: true })).toHaveAttribute('aria-selected', 'true')
    const tradeLayout = await page.locator('#signals, #fundamentals, #relationships').evaluateAll((nodes) => nodes.map((node) => ({ id: node.id, top: node.getBoundingClientRect().top + window.scrollY, width: node.getBoundingClientRect().width })))
    const tradeFundamentalGroupCount = await page.locator('#fundamentals > div > section').count()
    await expect(page.locator('[data-relationship-orbit-preview]')).toBeVisible()
    expect(tradeLayout.find((item) => item.id === 'signals')?.width).toBeGreaterThan(tradeLayout.find((item) => item.id === 'fundamentals')?.width ?? Number.POSITIVE_INFINITY)
    expect(tradeLayout.find((item) => item.id === 'fundamentals')?.top).toBeLessThan(tradeLayout.find((item) => item.id === 'relationships')?.top ?? 0)
    await page.waitForTimeout(900)
    await capture(page, testInfo, 'aapl-overview-trade-desktop')

    await perspectiveControl.click()
    const lensGroup = page.getByRole('radiogroup', { name: 'Investment perspective' })
    await expect(lensGroup).toBeVisible()
    await expect(page.getByRole('radio', { name: 'Trade', exact: true })).toBeChecked()
    await expectLensCentered(page, 'trade')
    await captureViewport(page, testInfo, 'aapl-lens-expanded-trade')
    const lensInstrument = page.locator('[data-perspective-dial]')
    const lensBox = await lensGroup.boundingBox()
    if (!lensBox) throw new Error('Investment Lens control has no bounding box')
    await page.mouse.move(lensBox.x + lensBox.width / 2, lensBox.y + lensBox.height / 2)
    await page.mouse.down()
    await page.mouse.move(lensBox.x + lensBox.width / 2 - 70, lensBox.y + lensBox.height / 2, { steps: 5 })
    await expect(lensInstrument).toHaveAttribute('data-dragging', 'true')
    await expect(lensInstrument).toHaveAttribute('data-value', 'trade')
    await expect(page).toHaveURL(/lens=trade/)
    await captureElement(lensInstrument, testInfo, 'aapl-lens-drag-preview')
    await page.mouse.up()
    await expect(lensInstrument).toHaveAttribute('data-dragging', 'false')

    await page.getByRole('radio', { name: 'Trade', exact: true }).focus()
    await page.keyboard.press('Home')
    await expect(page).toHaveURL(/lens=trade/)
    await expect(page.getByRole('radio', { name: 'Trade', exact: true })).toBeChecked()
    await expectLensCentered(page, 'trade')
    await page.keyboard.press('Escape')
    await expect(lensInstrument).toHaveAttribute('data-expanded', 'false')

    await perspectiveControl.click()
    await page.getByRole('radio', { name: 'Trade', exact: true }).focus()
    await page.keyboard.press('ArrowRight')
    await expect(page).toHaveURL(/lens=short/)
    await expect(page.getByRole('radio', { name: 'Short term', exact: true })).toBeChecked()
    await expectLensCentered(page, 'short')
    await expect(page.getByRole('tablist', { name: 'Chart timeframe' }).getByRole('tab', { name: '3M', exact: true })).toHaveAttribute('aria-selected', 'true')
    await page.keyboard.press('Escape')
    await page.waitForTimeout(450)
    await capture(page, testInfo, 'aapl-overview-short-term-desktop')

    await perspectiveControl.click()
    await page.getByRole('radio', { name: 'Short term', exact: true }).focus()
    await page.keyboard.press('ArrowRight')
    await expect(page).toHaveURL(/lens=medium/)
    await expect(page.getByRole('radio', { name: 'Medium term', exact: true })).toBeChecked()
    await expectLensCentered(page, 'medium')
    await expect(page.getByRole('tablist', { name: 'Chart timeframe' }).getByRole('tab', { name: '1Y', exact: true })).toHaveAttribute('aria-selected', 'true')
    const mediumLayout = await page.locator('#fundamentals, #signals').evaluateAll((nodes) => nodes.map((node) => ({ id: node.id, top: node.getBoundingClientRect().top + window.scrollY, width: node.getBoundingClientRect().width })))
    await expect(page.getByRole('heading', { name: 'Technicals', exact: true })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Fundamentals', exact: true })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Relationships', exact: true })).toBeVisible()
    expect(await page.locator('#fundamentals > div > section').count()).toBe(tradeFundamentalGroupCount)
    await expect(page.locator('[data-relationship-orbit-preview]')).toBeVisible()
    expect(mediumLayout.find((item) => item.id === 'fundamentals')?.width).toBeGreaterThan(mediumLayout.find((item) => item.id === 'signals')?.width ?? Number.POSITIVE_INFINITY)
    await page.keyboard.press('Escape')
    await page.waitForTimeout(450)
    await capture(page, testInfo, 'aapl-overview-medium-term-desktop')

    await perspectiveControl.click()
    await page.getByRole('radio', { name: 'Medium term', exact: true }).focus()
    await page.keyboard.press('End')
    await expect(page).toHaveURL(/lens=long/)
    await expect(page.getByRole('radio', { name: 'Long term', exact: true })).toBeChecked()
    await expectLensCentered(page, 'long')
    await expect(page.getByRole('tablist', { name: 'Chart timeframe' }).getByRole('tab', { name: '5Y', exact: true })).toHaveAttribute('aria-selected', 'true')
    await expect(page.getByRole('tablist', { name: 'Technical signals timeframe' }).getByRole('tab', { name: '1M', exact: true })).toHaveAttribute('aria-selected', 'true')
    await expect(page.getByRole('heading', { name: 'Relationships', exact: true })).toBeVisible()
    const longLayout = await page.locator('#fundamentals, #relationships, #signals').evaluateAll((nodes) => nodes.map((node) => ({ id: node.id, top: node.getBoundingClientRect().top + window.scrollY, width: node.getBoundingClientRect().width })))
    await expect(page.getByRole('heading', { name: 'Technicals', exact: true })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Fundamentals', exact: true })).toBeVisible()
    expect(await page.locator('#fundamentals > div > section').count()).toBe(tradeFundamentalGroupCount)
    await expect(page.locator('[data-relationship-orbit-preview]')).toBeVisible()
    expect(longLayout.find((item) => item.id === 'fundamentals')?.top).toBeLessThan(longLayout.find((item) => item.id === 'relationships')?.top ?? 0)
    expect(longLayout.find((item) => item.id === 'relationships')?.width).toBeGreaterThan(longLayout.find((item) => item.id === 'signals')?.width ?? Number.POSITIVE_INFINITY)
    await page.keyboard.press('Escape')
    await expect(page.getByRole('button', { name: /Perspective\s+Long term/ })).toBeVisible()
    await expect(lensGroup).not.toBeVisible()
    await page.waitForTimeout(600)
    await capture(page, testInfo, 'aapl-overview-long-term-desktop')

    await expect(page.getByText('Why this grade?', { exact: true })).toHaveCount(0)

    await expectNoHorizontalOverflow(page)
    expect(runtimeWarnings).toEqual([])
    await capture(page, testInfo, 'aapl-overview-desktop')
    await page.setViewportSize({ width: 390, height: 844 })
    await expectNoHorizontalOverflow(page)
    await capture(page, testInfo, 'aapl-overview-long-term-mobile')
    await page.getByRole('button', { name: /Perspective\s+Long term/ }).click()
    await expectLensCentered(page, 'long')
    await page.waitForTimeout(320)
    await expect(page.locator('[data-lens-option="long"]')).toBeVisible()
    await captureViewport(page, testInfo, 'aapl-lens-expanded-mobile')
    await page.keyboard.press('Escape')
    // A 1440 × 900 browser at 200% exposes an effective CSS viewport of 720 × 450.
    await page.setViewportSize({ width: 720, height: 450 })
    await expectNoHorizontalOverflow(page)
    await capture(page, testInfo, 'aapl-overview-200-zoom')
  })

  test('ETF with no relationship coverage stays a complete mobile page', async ({ page }, testInfo) => {
    const runtimeWarnings = watchForReactRuntimeWarnings(page)
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/stocks/QQQ')

    await expect(page.getByText('QQQ', { exact: true }).first()).toBeVisible()
    await expect(page.getByText('ETF', { exact: true }).first()).toBeVisible()
    await expect(page.getByRole('link', { name: 'Overview', exact: true })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Relationships', exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: /Perspective/ })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Fundamentals', exact: true })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Relationships', exact: true })).toBeVisible()
    await page.waitForTimeout(900)
    await expectNoHorizontalOverflow(page)
    expect(runtimeWarnings).toEqual([])
    await capture(page, testInfo, 'qqq-overview-mobile')
  })

  test('partial equity keeps an intentional research composition without a current signal', async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 1366, height: 768 })
    await page.goto('/stocks/0005.HK')

    await expect(page.getByText('0005.HK', { exact: true }).first()).toBeVisible()
    await expect(page.getByRole('link', { name: 'Relationships', exact: true })).toBeVisible()
    await expect(page.getByText('Neutral regime', { exact: true })).toHaveCount(0)
    await expect(page.getByText('Model signal', { exact: true })).toBeVisible()
    await expect(page.getByText('Unavailable', { exact: true }).first()).toBeVisible()
    await expect(page.getByText(/Data pending|Partial coverage/).first()).toBeVisible()
    await page.waitForTimeout(900)
    await expectNoHorizontalOverflow(page)
    await capture(page, testInfo, '0005-partial-equity-desktop')
  })

  test('Relationships is graph-first on desktop and list-first on mobile', async ({ page }, testInfo) => {
    const runtimeWarnings = watchForReactRuntimeWarnings(page)
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/stocks/AAPL/relationships')

    await expect(page.getByRole('heading', { name: 'Relationships', exact: true })).toBeVisible()
    await expect(page.locator('canvas')).toBeVisible()
    await expect(page.getByText(/total · \d+ shown/).first()).toBeVisible()
    await expect(page.locator('details').filter({ hasText: /Weak relationships \(\d+\)/ })).not.toHaveAttribute('open', '')
    await expectNoHorizontalOverflow(page)
    await page.waitForTimeout(800)
    await capture(page, testInfo, 'aapl-relationships-desktop')

    await page.setViewportSize({ width: 390, height: 844 })
    await page.reload()
    await expect(page.locator('canvas')).toHaveCount(0)
    await expect(page.getByRole('list').first()).toBeVisible()
    await expectNoHorizontalOverflow(page)
    expect(runtimeWarnings).toEqual([])
    await capture(page, testInfo, 'aapl-relationships-mobile')
  })

  test('stable research destinations and insufficient relationships remain intentional', async ({ page }) => {
    await page.goto('/stocks/AAPL/lens')
    await expect(page.getByRole('heading', { name: 'Investment Lens', exact: true })).toBeVisible()
    await page.getByRole('button', { name: /Perspective/ }).click()
    await page.getByRole('radio', { name: 'Long term', exact: true }).click()
    await expect(page).toHaveURL(/lens=long/)
    await expect(page.getByText('Pending integration', { exact: true })).toBeVisible()
    await page.goto('/stocks/QQQ/relationships')
    await expect(page.getByRole('heading', { name: 'Relationships', exact: true })).toBeVisible()
  })

  test('legacy ticker routes redirect to their stable research destinations', async ({ page }) => {
    const redirects = [
      { legacy: '/stocks/AAPL/signal-history', destination: /\/stocks\/AAPL\/signals$/ },
      { legacy: '/stocks/AAPL/performance', destination: /\/stocks\/AAPL\/signals$/ },
      { legacy: '/stocks/AAPL/holdings-dividends', destination: /\/stocks\/AAPL\/fundamentals$/ },
      { legacy: '/stocks/AAPL/financials/fund-profile', destination: /\/stocks\/AAPL\/financials$/ },
    ]

    for (const route of redirects) {
      await page.goto(route.legacy)
      await expect(page).toHaveURL(route.destination)
      await expect(page.getByRole('link', { name: 'Overview', exact: true })).toBeVisible()
    }
  })
})
