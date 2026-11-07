import { createContext, useContext, useRef, type ReactNode, type RefObject } from 'react'
import { cn } from '@/lib/cn'
import { useHeightVar } from '@/lib/viewport'

/* ------------------------------------------------------------------ Screen
   Every screen is: a scroll area + optional top bar + optional bottom bar.
   - Bars float above content; their measured heights pad the scroll area so nothing hides.
   - Bottom bars get the Figma "Bottom Gradient" fade; content scrolls under it.
   - Only the scroll area scrolls: the page itself never moves (app-like on iPhone).
   - `tone` sets the background and tells the desktop status bar which colour to use. */
export type ScreenTone = 'canvas' | 'navy'

const ScreenScrollContext = createContext<RefObject<HTMLDivElement | null> | null>(null)
export const useScreenScroll = () => useContext(ScreenScrollContext)

export function Screen({
  tone = 'canvas',
  top,
  bottom,
  topFade = true,
  bottomFade = true,
  scrollRef,
  className,
  label,
  overlay,
  children,
}: {
  tone?: ScreenTone
  top?: ReactNode
  bottom?: ReactNode
  topFade?: boolean
  bottomFade?: boolean
  scrollRef?: RefObject<HTMLDivElement | null>
  className?: string
  /** Accessible name of the screen (announced on navigation). */
  label?: string
  /** Sheets, menus, dialogs: above the bars, outside the scroll area. */
  overlay?: ReactNode
  children: ReactNode
}) {
  const screen = useRef<HTMLDivElement>(null)
  const topRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const ownScroll = useRef<HTMLDivElement>(null)
  const scroll = scrollRef ?? ownScroll
  useHeightVar(topRef, screen, '--top-h')
  useHeightVar(bottomRef, screen, '--bottom-h')

  return (
    <ScreenScrollContext.Provider value={scroll}>
      <section ref={screen} className="screen" data-tone={tone} data-status-bar={tone === 'navy' ? 'light' : 'dark'} aria-label={label}>
        <div ref={scroll} className={cn('screen-scroll', className)}>
          {children}
        </div>
        {top && (
          <div ref={topRef} className="screen-top" data-fade={tone === 'canvas' && topFade}>
            {top}
          </div>
        )}
        {bottom && (
          <div ref={bottomRef} className="screen-bottom" data-fade={bottomFade}>
            {bottom}
          </div>
        )}
        {overlay}
      </section>
    </ScreenScrollContext.Provider>
  )
}

/* ------------------------------------------------------------------ NavBar
   Figma: "Actions" row at the top: 44px glass buttons left/right, 12px below the status bar. */
export function NavBar({ left, right, center, className }: { left?: ReactNode; right?: ReactNode; center?: ReactNode; className?: string }) {
  return (
    <div className={cn('relative flex h-14 items-end justify-between px-4', className)}>
      <div className="flex min-w-11 items-center">{left}</div>
      {center && <div className="absolute inset-x-16 bottom-0 flex h-11 items-center justify-center">{center}</div>}
      <div className="flex min-w-11 items-center justify-end">{right}</div>
    </div>
  )
}

/* ------------------------------------------------------------------ BottomBar
   Figma: "CTA Container" (16px sides). Holds one primary button, sometimes a secondary below. */
export function BottomBar({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('flex flex-col items-stretch gap-2 px-4 pt-px', className)}>{children}</div>
}

/** Standard content padding for a screen body (Figma: 16px sides, 12px top). */
export function ScreenBody({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('flex flex-col px-4 pt-3', className)}>{children}</div>
}
