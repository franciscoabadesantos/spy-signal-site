import { expect, test } from '@playwright/test'

test.describe('progressive market universe', () => {
  test('loads communities first and opens one bounded company constellation', async ({ page }) => {
    const consoleErrors: string[] = []
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text())
    })
    await page.setViewportSize({ width: 1440, height: 920 })
    await page.goto('/markets/network')

    await expect(page.getByRole('heading', { name: 'Move through the market.' })).toBeVisible()
    await expect(page.getByLabel('Market communities')).toBeVisible()
    const community = page.getByLabel('Market communities').getByRole('button').first()
    await expect(community).toBeVisible()
    await community.click()

    await expect(page.getByRole('button', { name: 'Universe' })).toBeVisible()
    await expect(page.getByText(/companies$/).first()).toBeVisible()
    await expect.poll(async () => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1)
    expect(consoleErrors).toEqual([])
  })

  test('keeps the static reading and touch controls on mobile with reduced motion', async ({ page }) => {
    const consoleErrors: string[] = []
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text())
    })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/markets/network?window=126&view=residual')

    await expect(page.getByRole('heading', { name: 'Move through the market.' })).toBeVisible()
    await expect(page.getByRole('button', { name: /View/ })).toBeVisible()
    await expect(page.getByLabel('Evidence window')).toBeVisible()
    await expect(page.getByLabel('How to read the market universe')).toBeVisible()
    await expect.poll(async () => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1)
    expect(consoleErrors).toEqual([])
  })
})
