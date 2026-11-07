// Shared motion presets. Every animation in the app should come from here so the
// feel stays consistent and Reduce Motion is respected in one place
// (<MotionConfig reducedMotion="user"> in App.tsx turns transforms off for those users).
import type { Transition, Variants } from 'motion/react'
import { motionTokens } from '@/styles/motion.gen'

const ms = (v: string) => parseInt(v, 10) / 1000

export const spring: Transition = { type: 'spring', ...motionTokens.spring }
export const durations = {
  fast: ms(motionTokens.fast),
  base: ms(motionTokens.base),
  slow: ms(motionTokens.slow),
}
const easeOut = [0.22, 1, 0.36, 1] as const

/** List items and cards entering: fade + 8px rise, staggered by the parent. */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: durations.base, ease: easeOut } },
}

/** Parent of fadeUp children. */
export const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: ms(motionTokens.stagger) } },
}

/** Small "pop" for selections: calendar day, vote thumb, chip. */
export const pop: Variants = {
  rest: { scale: 1 },
  pop: { scale: [1, 1.12, 1], transition: { duration: durations.base, ease: easeOut } },
}

/** Pressable feedback for buttons and cards. */
export const press = { whileTap: { scale: 0.97 }, transition: spring }

/** Bottom sheet. */
export const sheet: Variants = {
  hidden: { y: '100%' },
  show: { y: 0, transition: spring },
  exit: { y: '100%', transition: { duration: durations.base, ease: easeOut } },
}

/** Light haptic tick where the platform supports it (Android browsers; native shell later). */
export function haptic(pattern: number | number[] = 8) {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(pattern)
}

/** Screen push/pop and modal presentation (iOS-like curve, no overshoot). */
export const navTransition: Transition = { duration: 0.42, ease: [0.32, 0.72, 0, 1] }
