import { test } from '@playwright/test'
import { SCREENS, settle } from './screens'

// Screenshots for review (not pixel assertions): reduced motion so nothing is mid-animation.
for (const screen of SCREENS) {
  test(`screenshot: ${screen.name}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto(screen.path)
    await screen.ready?.(page)
    await settle(page)
    await page.screenshot({ path: `e2e/screens/${screen.name}.png`, fullPage: true })
  })
}
