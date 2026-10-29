import { expect, test } from '@playwright/test'

/** Seeded logins (src/seed/index.ts). */
const ADMIN = { email: 'admin@payload-playground.local', password: 'admin-playground' }
const VIEWER = { email: 'viewer@payload-playground.local', password: 'viewer-playground' }

test.describe('site', () => {
  test('English home page is left-to-right with the Latin theme fonts', async ({ page }) => {
    await page.goto('/en')
    await expect(page.locator('html')).toHaveAttribute('dir', 'ltr')
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')
    await expect(page.getByRole('heading', { level: 1 })).toContainText('multilingual')
    const font = await page.locator('body').evaluate((el) => getComputedStyle(el).fontFamily)
    expect(font).toContain('Inter')
    // Tunisia-only promo is hidden in the international region.
    await expect(page.getByText('Tunisia launch offer')).toHaveCount(0)
  })

  test('Arabic home page is right-to-left with the Arabic theme fonts', async ({ page }) => {
    await page.goto('/ar')
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
    await expect(page.getByRole('heading', { level: 1 })).toContainText('مواقع متعددة اللغات')
    const font = await page.locator('body').evaluate((el) => getComputedStyle(el).fontFamily)
    expect(font).toContain('Tajawal')
  })

  test('ar-TN shows its overrides and the Tunisia promo', async ({ page }) => {
    await page.goto('/ar-TN')
    await expect(page.getByRole('heading', { level: 1 })).toContainText('مواقع بالعربي والفرنسي')
    await expect(page.getByText('عرض إطلاق تونس')).toBeVisible()
  })

  test('unknown pages show the 404 content from Site settings', async ({ page }) => {
    const response = await page.goto('/en/this-page-does-not-exist')
    expect(response?.status()).toBe(404)
    await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible()
  })

  test('URLs without a locale are redirected', async ({ page }) => {
    await page.goto('/about')
    await expect(page).toHaveURL(/\/(en|ar|ar-TN|en-TN)\/about$/)
  })
})

test.describe('admin', () => {
  test('admin can log in and sees the translation dashboard', async ({ page }) => {
    await page.goto('/admin/login')
    await page.fill('#field-email', ADMIN.email)
    await page.fill('#field-password', ADMIN.password)
    await page.click('button[type="submit"]')
    await page.waitForURL('**/admin')
    await expect(page.getByRole('heading', { name: 'Translation progress' })).toBeVisible({ timeout: 60_000 })
    await expect(page.getByText('ar-TN').first()).toBeVisible()
  })

  test('viewer cannot open the admin panel', async ({ page }) => {
    await page.goto('/admin/login')
    await page.fill('#field-email', VIEWER.email)
    await page.fill('#field-password', VIEWER.password)
    await page.click('button[type="submit"]')
    await expect(page.getByText(/not allowed|unauthorized/i).first()).toBeVisible({ timeout: 60_000 })
  })
})
