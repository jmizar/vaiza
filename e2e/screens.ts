import type { Page } from '@playwright/test'

/**
 * Every screen/state worth reviewing. Each gets an axe scan and a screenshot
 * (e2e/screens/<name>.png) that the design reviewer compares with the Figma frame.
 * `figma` = file name in design/frames/ once synced.
 */
export interface Screen {
  name: string
  path: string
  figma?: string
  ready?: (page: Page) => Promise<void>
}

/** Waits until entrance animations (fades, staggers) have finished so screenshots and contrast checks see the final state. */
export async function settle(page: Page) {
  await page.evaluate(() => document.fonts.ready)
  await page.waitForFunction(() => document.getAnimations().every((a) => a.playState !== 'running'), null, { timeout: 5000 })
  await page.waitForTimeout(600) // JS-driven staggers that don't register as Web Animations
}

export const SCREENS: Screen[] = [
  { name: 'dev-foundations', path: '/dev/foundations' },
]
