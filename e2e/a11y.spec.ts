import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { mkdirSync, writeFileSync } from 'node:fs'
import { SCREENS, settle } from './screens'

// Contrast on brand colours is a design decision (see design/a11y-flags.md): reported, not failing.
// Every other WCAG 2.2 AA violation fails the build.
const report: Record<string, unknown> = {}

for (const screen of SCREENS) {
  test(`a11y: ${screen.name}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto(screen.path)
    await screen.ready?.(page)
    await settle(page)
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze()
    const flagged = results.violations.filter((v) => v.id === 'color-contrast')
    const failing = results.violations.filter((v) => v.id !== 'color-contrast')
    report[screen.name] = {
      flagged: flagged.flatMap((v) => v.nodes.map((n) => ({ target: n.target, summary: n.failureSummary }))),
      failing: failing.map((v) => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.length })),
    }
    expect(failing, failing.map((v) => `${v.id}: ${v.help}`).join('\n')).toEqual([])
  })
}

test.afterAll(() => {
  mkdirSync('e2e', { recursive: true })
  writeFileSync('e2e/a11y-report.json', JSON.stringify(report, null, 2))
})
