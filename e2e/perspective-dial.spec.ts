import { expect, test, type Page, type TestInfo } from '@playwright/test'

async function capture(page: Page, testInfo: TestInfo, name: string) {
  await page.screenshot({ path: testInfo.outputPath(`${name}.png`) })
}

async function expectNoHorizontalOverflow(page: Page) {
  const dimensions = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }))
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth + 1)
}

async function expectLensCentered(page: Page, lens: 'trade' | 'short' | 'medium' | 'long') {
  await expect.poll(async () => page.evaluate((lensKey) => {
    const center = document.querySelector<HTMLElement>('[data-perspective-center]')?.getBoundingClientRect()
    const option = document.querySelector<HTMLElement>(`[data-lens-option="${lensKey}"]`)?.getBoundingClientRect()
    if (!center || !option) return Number.POSITIVE_INFINITY
    return Math.abs((center.left + center.right) / 2 - (option.left + option.right) / 2)
  }, lens)).toBeLessThan(2)
  await page.evaluate(() => new Promise<void>((resolve) => {
    window.requestAnimationFrame(() => window.requestAnimationFrame(() => resolve()))
  }))
}

test.describe('isolated Perspective dial', () => {
  test('compact, expanded, drag preview, and discrete committed states', async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/labs/perspective?lens=medium')

    const dial = page.locator('[data-perspective-dial]')
    const viewport = page.locator('[data-perspective-viewport]')
    const trigger = page.getByRole('button', { name: /Perspective\s+Medium term/ })

    await expect(dial).toHaveAttribute('data-hydrated', 'true')
    await expect(dial).toHaveAttribute('data-expanded', 'false')
    await expect(dial).toHaveAttribute('data-value', 'medium')
    await expect(viewport.locator('..')).toHaveAttribute('inert', '')
    await expect(page.locator('[data-committed-lens]')).toHaveText('Medium term')
    await expect(page.locator('[data-perspective-announcement]')).toHaveText('Perspective selected: Medium term')
    await capture(page, testInfo, 'perspective-compact-desktop')

    await trigger.click()
    await expect(dial).toHaveAttribute('data-expanded', 'true')
    await expect(page.getByRole('radiogroup', { name: 'Investment perspective' })).toBeVisible()
    await expect(page.getByRole('radio', { name: 'Medium term', exact: true })).toBeChecked()
    await expect(dial).toHaveAttribute('data-preview', 'medium')
    await page.waitForTimeout(320)
    await expectLensCentered(page, 'medium')
    await capture(page, testInfo, 'perspective-expanded-medium')

    await trigger.click()
    await expect(dial).toHaveAttribute('data-expanded', 'false')
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')
    await trigger.click()
    await expect(dial).toHaveAttribute('data-expanded', 'true')
    await expectLensCentered(page, 'medium')

    const box = await viewport.boundingBox()
    if (!box) throw new Error('Perspective viewport has no bounding box')
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    await page.mouse.down()
    await page.mouse.move(box.x + box.width / 2 - 70, box.y + box.height / 2, { steps: 5 })
    await expect(dial).toHaveAttribute('data-dragging', 'true')
    await expect(dial).toHaveAttribute('data-value', 'medium')
    await expect(page.locator('[data-perspective-announcement]')).toHaveText('Perspective selected: Medium term')
    await expect(page).toHaveURL(/lens=medium/)
    await capture(page, testInfo, 'perspective-drag-midpoint')
    await page.mouse.up()

    await page.getByRole('radio', { name: 'Medium term', exact: true }).focus()
    await page.keyboard.press('Home')
    await expect(page).toHaveURL(/lens=trade/)
    await expect(page.getByRole('radio', { name: 'Trade', exact: true })).toBeChecked()
    await expect(page.locator('[data-committed-lens]')).toHaveText('Trade')
    await expectLensCentered(page, 'trade')
    await capture(page, testInfo, 'perspective-trade-selected')

    await page.getByRole('radio', { name: 'Trade', exact: true }).focus()
    await page.keyboard.press('ArrowRight')
    await expect(page).toHaveURL(/lens=short/)
    await expectLensCentered(page, 'short')
    await page.getByRole('radio', { name: 'Short term', exact: true }).focus()
    await page.keyboard.press('ArrowRight')
    await expect(page).toHaveURL(/lens=medium/)
    await expect(page.getByRole('radio', { name: 'Medium term', exact: true })).toBeChecked()
    await expectLensCentered(page, 'medium')
    await capture(page, testInfo, 'perspective-medium-selected')

    await page.getByRole('radio', { name: 'Medium term', exact: true }).focus()
    await page.keyboard.press('End')
    await expect(page).toHaveURL(/lens=long/)
    await expect(page.getByRole('radio', { name: 'Long term', exact: true })).toBeChecked()
    await expect(page.locator('[data-perspective-announcement]')).toHaveText('Perspective selected: Long term')
    await expectLensCentered(page, 'long')
    await capture(page, testInfo, 'perspective-long-selected')

    await page.keyboard.press('Escape')
    await expect(dial).toHaveAttribute('data-expanded', 'false')
    await expect(page.getByRole('button', { name: /Perspective\s+Long term/ })).toBeFocused()
    await expectNoHorizontalOverflow(page)
  })

  test('mobile carousel remains list-free, touch-sized, and clipped', async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/labs/perspective?lens=medium')

    const dial = page.locator('[data-perspective-dial]')
    await expect(dial).toHaveAttribute('data-hydrated', 'true')
    await page.getByRole('button', { name: /Perspective\s+Medium term/ }).click()
    await expect(dial).toHaveAttribute('data-expanded', 'true')
    await expect(page.getByRole('radio')).toHaveCount(4)
    await expect(dial).toHaveAttribute('data-preview', 'medium')
    await page.waitForTimeout(320)
    await expect(dial).toHaveAttribute('data-preview', 'medium')
    await expectLensCentered(page, 'medium')

    const touchTargets = await page.locator('label').filter({ has: page.getByRole('radio') }).evaluateAll((labels) =>
      labels.map((label) => label.getBoundingClientRect().height),
    )
    expect(touchTargets.every((height) => height >= 44)).toBe(true)
    await expectNoHorizontalOverflow(page)
    await capture(page, testInfo, 'perspective-mobile-expanded')

    const longOption = page.locator('[data-lens-option="long"]')
    const [optionBox, viewportBox] = await Promise.all([longOption.boundingBox(), page.locator('[data-perspective-viewport]').boundingBox()])
    if (!optionBox || !viewportBox) throw new Error('The adjacent option is not measurable')
    const visibleLeft = Math.max(optionBox.x, viewportBox.x)
    const visibleRight = Math.min(optionBox.x + optionBox.width, viewportBox.x + viewportBox.width)
    expect(visibleRight - visibleLeft).toBeGreaterThan(20)
    await longOption.evaluate((option: HTMLElement) => option.click())
    await expect(page).toHaveURL(/lens=long/)
    await expectLensCentered(page, 'long')
    await capture(page, testInfo, 'perspective-mobile-long')
  })

  test('horizontal wheel input settles on a discrete lens', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/labs/perspective?lens=medium')

    await page.getByRole('button', { name: /Perspective\s+Medium term/ }).click()
    const viewport = page.locator('[data-perspective-viewport]')
    await expectLensCentered(page, 'medium')
    await viewport.hover()
    await page.mouse.wheel(260, 0)

    await expect(page).toHaveURL(/lens=long/)
    await expect(page.getByRole('radio', { name: 'Long term', exact: true })).toBeChecked()
    await expectLensCentered(page, 'long')
  })

  test('reduced motion keeps the same semantics without smooth travel', async ({ page }, testInfo) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.setViewportSize({ width: 1024, height: 720 })
    await page.goto('/labs/perspective?lens=medium')

    await page.getByRole('button', { name: /Perspective\s+Medium term/ }).click()
    await page.getByRole('radio', { name: 'Medium term', exact: true }).focus()
    await page.keyboard.press('End')
    await expect(page).toHaveURL(/lens=long/)
    await expect(page.getByRole('radio', { name: 'Long term', exact: true })).toBeChecked()
    await expectLensCentered(page, 'long')
    await capture(page, testInfo, 'perspective-reduced-motion')
  })

  test('effective 200 percent zoom preserves the instrument and page flow', async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 720, height: 450 })
    await page.goto('/labs/perspective?lens=trade')
    await page.getByRole('button', { name: /Perspective\s+Trade/ }).click()

    await expect(page.locator('[data-perspective-dial]')).toHaveAttribute('data-expanded', 'true')
    await expectLensCentered(page, 'trade')
    await expectNoHorizontalOverflow(page)
    await capture(page, testInfo, 'perspective-200-percent-zoom')
  })
})
