import type { Page } from '@playwright/test'

/**
 * Every screen/state worth reviewing. Each gets an axe scan and a screenshot
 * (e2e/screens/<name>.png) that the design reviewer compares with the Figma frame
 * (`figma` = file in design/frames/). Paths are hash routes; `?demo=1` loads the demo trips,
 * `?reset=1` a first launch, `?preview=1` draws the iOS status bar like the frames.
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

const demo = (hash: string) => `/?demo=1&preview=1#${hash}`
const fresh = (hash: string) => `/?reset=1&preview=1#${hash}`

export const SCREENS: Screen[] = [
  { name: 'splash', path: fresh('/'), figma: 'journey-setup-ready/mobile--1-43922.png' },
  { name: 'onboarding', path: fresh('/onboarding'), figma: 'journey-setup-ready/onboarding-4--1-43932.png' },
  { name: 'setup', path: fresh('/setup'), figma: 'journey-setup-ready/user-details--1-44205.png' },
  { name: 'setup-city', path: fresh('/setup/city'), figma: 'journey-setup-ready/user-details--1-44123.png' },
  { name: 'home-empty', path: fresh('/home'), figma: 'home-profile-ready/home-empty--1-45318.png' },
  { name: 'home-trips', path: demo('/home'), figma: 'home-profile-ready/home-trips--1-45456.png' },
  {
    name: 'home-fab-open',
    path: demo('/home'),
    figma: 'home-profile-ready/home-fab-open--1-45477.png',
    ready: async (page) => page.getByRole('button', { name: 'Create or join' }).click(),
  },
  { name: 'profile', path: demo('/profile'), figma: 'home-profile-ready/profile--1-45530.png' },
  { name: 'new-trip', path: demo('/new'), figma: 'create-new-trip-ready/new-trip--1-47789.png' },
  { name: 'dates-new', path: demo('/trip/birthday/dates/new'), figma: 'create-new-trip-ready/dates--1-48000.png' },
  { name: 'preferences', path: demo('/trip/birthday/preferences/new'), figma: 'create-new-trip-ready/preferences--1-48354.png' },
  { name: 'trip-solo', path: demo('/trip/birthday'), figma: 'trip-screen-ready/trip-screen-user--1-52071.png' },
  { name: 'trip-dates-organiser', path: demo('/trip/verano'), figma: 'trip-screen-ready/trip-screen-admin--1-52907.png' },
  { name: 'travel-window-organiser', path: demo('/trip/verano/window'), figma: 'trip-window-ready/trip-window-admin--1-59154.png' },
  {
    name: 'travel-window-hint',
    path: demo('/trip/verano/window'),
    figma: 'trip-window-ready/trip-window-hint-user--1-59227.png',
    ready: async (page) => page.getByRole('button', { name: 'Hint' }).click(),
  },
  { name: 'travel-window-calendar', path: demo('/trip/verano/window/calendar'), figma: 'trip-window-ready/trip-window-user--1-58962.png' },
  { name: 'custom-dates', path: demo('/trip/verano/window/custom'), figma: 'trip-window-ready/trip-window-admin-custom--1-59322.png' },
  { name: 'trip-voting-member', path: demo('/trip/morocco'), figma: 'trip-screen-ready/trip-screen-user--1-53231.png' },
  { name: 'vote-list', path: demo('/trip/morocco/vote'), figma: 'confirmation-of-vote-wip/list-user--1-66725.png' },
  { name: 'trip-hub', path: demo('/trip/lisbon'), figma: 'trip-hub-wip/trip-screen-user--1-73544.png' },
  { name: 'join', path: demo('/join') },
  { name: 'design-system', path: demo('/design') },
]
