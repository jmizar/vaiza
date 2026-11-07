import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { AnimatePresence, motion, type Variants } from 'motion/react'
import {
  UNSAFE_LocationContext as LocationContext,
  NavigationType,
  useLocation,
  useMatches,
  useNavigate,
  useNavigationType,
  useOutlet,
  type Location,
} from 'react-router'
import { navTransition } from '@/lib/motion'

/* ------------------------------------------------------------------ Stack navigator
   Behaves like an iOS navigation stack on top of the URL:
   - PUSH keeps the previous screen mounted underneath (scroll position and state survive "back").
   - POP slides the top screen away and reveals the one below, exactly as it was left.
   - REPLACE swaps the top screen without animation (tabs, redirects).
   Each route declares how it is presented in its `handle` (push = slide from the right,
   modal = slide up, none = instant). A navigation can override it with state.presentation. */
export type Presentation = 'push' | 'modal' | 'none'
export interface RouteHandle {
  presentation?: Presentation
  /** Colour of the status bar content over this screen. */
  statusBar?: 'light' | 'dark'
}
export interface NavState {
  presentation?: Presentation
}

interface Entry {
  key: string
  location: Location
  element: ReactNode
  presentation: Presentation
  statusBar: 'light' | 'dark'
}

const enterFrom = (p: Presentation) => (p === 'push' ? { x: '100%' } : p === 'modal' ? { y: '100%' } : { x: 0, y: 0 })
const atTop = { x: 0, y: 0, transition: navTransition }
const underneath = (above: Presentation) => (above === 'push' ? { x: '-30%', transition: navTransition } : atTop)

/** Exit runs with the latest navigation (AnimatePresence `custom`): only the screen that was on top
    slides away; screens popped from deeper in the stack (back 2+) disappear instantly. */
interface ExitContext {
  leavingTop?: string
  replace: boolean
}
const exitVariants = (e: Entry): Variants => ({
  exit: (c: ExitContext | undefined) => {
    if (!c || c.replace || c.leavingTop !== e.key || e.presentation === 'none') return { opacity: 0, transition: { duration: 0 } }
    return e.presentation === 'push' ? { x: '100%', transition: navTransition } : { y: '100%', transition: navTransition }
  },
})

export function StackNavigator({ onTopChange }: { onTopChange?: (top: { statusBar: 'light' | 'dark'; pathname: string }) => void }) {
  const location = useLocation()
  const navType = useNavigationType()
  const outlet = useOutlet()
  const matches = useMatches()

  const makeEntry = (): Entry => {
    const handle = Object.assign({}, ...matches.map((m) => (m.handle as RouteHandle | undefined) ?? {})) as RouteHandle
    const override = (location.state as NavState | null)?.presentation
    return {
      key: location.key,
      location,
      element: outlet,
      presentation: navType === NavigationType.Replace ? 'none' : (override ?? handle.presentation ?? 'push'),
      statusBar: handle.statusBar ?? 'dark',
    }
  }

  // Keyed by the location object itself: hash changes typed by hand all share key "default".
  const [state, setState] = useState<{ location: Location; stack: Entry[]; exit: ExitContext }>(() => ({
    location,
    stack: [makeEntry()],
    exit: { replace: false },
  }))

  // Derive the stack from history changes during render (no flash of the wrong screen).
  if (state.location !== location) {
    const entry = makeEntry()
    let stack: Entry[]
    if (navType === NavigationType.Pop) {
      const i = state.stack.findLastIndex((e) => e.key === location.key && e.location.pathname === location.pathname)
      stack = i >= 0 ? state.stack.slice(0, i + 1) : [entry]
    } else if (navType === NavigationType.Replace) {
      stack = [...state.stack.slice(0, -1), entry]
    } else {
      stack = [...state.stack, entry]
    }
    setState({
      location,
      stack,
      exit: { replace: navType === NavigationType.Replace, leavingTop: state.stack[state.stack.length - 1]?.key },
    })
  }

  const top = state.stack[state.stack.length - 1]!
  useEffect(() => {
    onTopChange?.({ statusBar: top.statusBar, pathname: top.location.pathname })
  }, [onTopChange, top])

  return (
    <div className="absolute inset-0">
      <AnimatePresence initial={false} custom={state.exit}>
        {state.stack.map((e, i) => {
          const isTop = i === state.stack.length - 1
          const above = state.stack[i + 1]
          return (
            <motion.div
              key={e.key}
              variants={exitVariants(e)}
              initial={enterFrom(e.presentation)}
              // The screen below follows the one above it: parallax under a push, still under a modal.
              animate={isTop || !above ? atTop : underneath(above.presentation)}
              exit="exit"
              className="absolute inset-0 overflow-hidden"
              // Only the top two screens are ever visible; deeper ones are skipped by paint and AT.
              style={{ zIndex: i, visibility: i < state.stack.length - 2 ? 'hidden' : undefined }}
              inert={!isTop}
              aria-hidden={!isTop || undefined}
            >
              <LocationContext.Provider value={{ location: e.location, navigationType: navType }}>{e.element}</LocationContext.Provider>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}

/* ------------------------------------------------------------------ helpers */

/** Go back `steps` screens; if the app was opened deep (no history), replace with `fallback`. */
export function useBack(fallback: string) {
  const navigate = useNavigate()
  return useCallback(
    (steps = 1) => {
      const idx = (window.history.state as { idx?: number } | null)?.idx ?? 0
      if (idx >= steps) void navigate(-steps)
      else void navigate(fallback, { replace: true })
    },
    [navigate, fallback],
  )
}
