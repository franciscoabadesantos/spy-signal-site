import { expect, test, type Page, type TestInfo } from '@playwright/test'

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

function watchForReactRuntimeWarnings(page: Page): string[] {
  const warnings: string[] = []
  page.on('console', (message) => {
    const text = message.text()
    if (text.includes('hydrated but some attributes') || text.includes('Each child in a list should have a unique')) {
      warnings.push(text)
    }
  })
  return warnings
}

async function expectPerspectiveHydrated(page: Page) {
  await expect(page.locator('[data-perspective-dial]')).toHaveAttribute('data-hydrated', 'true')
}

test.describe('ticker research views Phase 2 slice', () => {
  test.skip(!runLiveTickerQa, 'Set RUN_TICKER_LIVE_QA=1 to exercise finance-backend coverage states.')
  test.describe.configure({ mode: 'serial', timeout: 240_000 })

  test('equity profile and horizontal Research navigation preserve Lens', async ({ page }, testInfo) => {
    const runtimeWarnings = watchForReactRuntimeWarnings(page)
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/stocks/AAPL/profile?lens=long')
    await expectPerspectiveHydrated(page)
    await expect(page.getByRole('heading', { name: 'Company Profile', exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: /Perspective\s+Long term/ })).toBeVisible()
    await expect(page.getByText('Final grade', { exact: true })).toHaveCount(0)
    await expectNoHorizontalOverflow(page)
    await capture(page, testInfo, 'phase2-aapl-profile-long-desktop')

    const researchNav = page.getByRole('navigation', { name: 'Ticker research' })
    await expect(researchNav).toBeVisible()
    await expect(researchNav.getByRole('link', { name: 'Profile', exact: true })).toHaveAttribute('aria-current', 'page')
    await expect(researchNav.locator('[data-active="true"]')).toHaveCount(1)
    await expect(researchNav.getByRole('link', { name: 'Fundamentals', exact: true })).toHaveAttribute('href', /lens=long/)
    await expect(researchNav.getByText(/Perspective|Company & fund|Market evidence/)).toHaveCount(0)
    await capture(page, testInfo, 'phase2-research-nav-horizontal-desktop')

    const financialsTrigger = researchNav.getByRole('button', { name: 'Financials', exact: true })
    await financialsTrigger.focus()
    await page.keyboard.press('ArrowDown')
    const financialsMenu = page.getByRole('menu', { name: 'Financials' })
    await expect(financialsTrigger).toHaveAttribute('aria-expanded', 'true')
    await expect(financialsMenu.getByRole('menuitem', { name: /Income Statement/ })).toBeFocused()
    await expect(financialsMenu.getByRole('menuitem', { name: /Balance Sheet/ })).toHaveAttribute('href', /lens=long/)
    const triggerBox = await financialsTrigger.boundingBox()
    const menuBox = await financialsMenu.boundingBox()
    if (!triggerBox || !menuBox) throw new Error('Financials trigger or menu has no bounding box')
    expect(Math.abs(menuBox.x - triggerBox.x)).toBeLessThanOrEqual(2)
    expect(menuBox.y - (triggerBox.y + triggerBox.height)).toBeGreaterThanOrEqual(0)
    expect(menuBox.y - (triggerBox.y + triggerBox.height)).toBeLessThanOrEqual(8)
    expect(menuBox.width).toBeLessThanOrEqual(200)
    expect(menuBox.height).toBeLessThanOrEqual(130)
    await captureViewport(page, testInfo, 'phase2-research-financials-menu-desktop')
    await page.keyboard.press('Escape')
    await expect(financialsTrigger).toBeFocused()
    await expect(financialsTrigger).toHaveAttribute('aria-expanded', 'false')

    await page.setViewportSize({ width: 390, height: 844 })
    const moreTrigger = researchNav.getByRole('button', { name: 'More', exact: true })
    await moreTrigger.scrollIntoViewIfNeeded()
    await expect(moreTrigger).toBeInViewport()
    await expectNoHorizontalOverflow(page)
    await capture(page, testInfo, 'phase2-research-nav-horizontal-mobile')
    await moreTrigger.click()
    const moreMenu = page.getByRole('menu', { name: 'More research destinations' })
    await expect(moreMenu.getByRole('menuitem', { name: /Ownership & Capital/ })).toHaveAttribute('href', /lens=long/)
    await expect(moreMenu.getByRole('menuitem', { name: /AI Research/ })).toBeVisible()
    await expectNoHorizontalOverflow(page)
    await captureViewport(page, testInfo, 'phase2-research-nav-more-mobile')

    await page.keyboard.press('Escape')
    await page.setViewportSize({ width: 320, height: 568 })
    await expect(researchNav.getByRole('link', { name: 'Profile', exact: true })).toBeInViewport()
    await expectNoHorizontalOverflow(page)
    expect(runtimeWarnings).toEqual([])
  })

  test('Fundamentals keeps all themes while Trade and Long-term change priority', async ({ page }, testInfo) => {
    const runtimeWarnings = watchForReactRuntimeWarnings(page)
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/stocks/AAPL/fundamentals?lens=trade')
    await expectPerspectiveHydrated(page)
    await expect(page.getByRole('heading', { name: 'Fundamentals', exact: true })).toBeVisible()
    const tradeThemes = await page.locator('[class*="theme"][id]').evaluateAll((nodes) => nodes.map((node) => node.id))
    expect(tradeThemes).toContain('valuation')
    expect(tradeThemes).toContain('growth')
    expect(tradeThemes).toContain('financial-health')
    await expectNoHorizontalOverflow(page)
    await capture(page, testInfo, 'phase2-aapl-fundamentals-trade-desktop')

    await page.goto('/stocks/AAPL/fundamentals?lens=long')
    await expectPerspectiveHydrated(page)
    const longThemes = await page.locator('[class*="theme"][id]').evaluateAll((nodes) => nodes.map((node) => node.id))
    expect(longThemes.slice().sort()).toEqual(tradeThemes.slice().sort())
    expect(longThemes[0]).not.toBe(tradeThemes[0])
    await capture(page, testInfo, 'phase2-aapl-fundamentals-long-desktop')

    await page.setViewportSize({ width: 390, height: 844 })
    await expectNoHorizontalOverflow(page)
    await capture(page, testInfo, 'phase2-aapl-fundamentals-long-mobile')
    expect(runtimeWarnings).toEqual([])
  })

  test('Financial Statements exposes shareable Annual and Quarterly placeholders', async ({ page }, testInfo) => {
    const runtimeWarnings = watchForReactRuntimeWarnings(page)
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/stocks/AAPL/financials?lens=long&statement=balance-sheet&period=annual')
    await expectPerspectiveHydrated(page)
    await expect(page.getByRole('heading', { name: 'Financial Statements', exact: true })).toBeVisible()
    const researchNav = page.getByRole('navigation', { name: 'Ticker research' })
    const financialsTrigger = researchNav.getByRole('button', { name: 'Financials', exact: true })
    await expect(financialsTrigger.locator('..')).toHaveAttribute('data-active', 'true')
    await expect(researchNav.locator('[data-active="true"]')).toHaveCount(1)
    await expect(page.getByRole('link', { name: 'Balance Sheet', exact: true })).toHaveAttribute('aria-current', 'page')
    await expect(page.getByRole('link', { name: 'Annual', exact: true })).toHaveAttribute('aria-current', 'page')
    await expect(page.getByText('Pending integration', { exact: true }).first()).toBeVisible()
    await expectNoHorizontalOverflow(page)
    await capture(page, testInfo, 'phase2-aapl-statements-annual-placeholder')

    await page.getByRole('link', { name: 'Quarterly', exact: true }).click()
    await expect(page).toHaveURL(/period=quarterly/)
    await expect(page.getByRole('link', { name: 'Quarterly', exact: true })).toHaveAttribute('aria-current', 'page')
    await capture(page, testInfo, 'phase2-aapl-statements-quarterly-placeholder')

    await page.setViewportSize({ width: 390, height: 844 })
    await expectNoHorizontalOverflow(page)
    await capture(page, testInfo, 'phase2-aapl-statements-quarterly-mobile')

    await page.setViewportSize({ width: 1440, height: 900 })
    await page.evaluate(() => {
      document.documentElement.style.zoom = '2'
    })
    await expect.poll(() => page.evaluate(() => getComputedStyle(document.documentElement).zoom)).toBe('2')
    await expectNoHorizontalOverflow(page)
    await capture(page, testInfo, 'phase2-aapl-statements-200-zoom')
    expect(runtimeWarnings).toEqual([])
  })

  test('ETF and partial equity use intentional asset-aware research states', async ({ page }, testInfo) => {
    const runtimeWarnings = watchForReactRuntimeWarnings(page)
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/stocks/QQQ/profile?lens=long')
    await expectPerspectiveHydrated(page)
    await expect(page.getByRole('heading', { name: 'Fund Profile', exact: true })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Portfolio structure', exact: true })).toBeVisible()
    await expectNoHorizontalOverflow(page)
    await capture(page, testInfo, 'phase2-qqq-fund-profile-mobile')

    await page.setViewportSize({ width: 1366, height: 768 })
    await page.goto('/stocks/0005.HK/profile?lens=medium')
    await expectPerspectiveHydrated(page)
    await expect(page.getByRole('heading', { name: /Company Profile|Fund Profile/ })).toBeVisible()
    await expect(page.getByText(/Partial coverage|Data pending/).first()).toBeVisible()
    await expectNoHorizontalOverflow(page)
    await capture(page, testInfo, 'phase2-0005-partial-profile-desktop')
    expect(runtimeWarnings).toEqual([])
  })
})
