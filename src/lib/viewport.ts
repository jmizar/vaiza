import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react'

/**
 * Keeps --app-height equal to the *visible* viewport. On iPhone the on-screen keyboard
 * shrinks the visual viewport but not the layout viewport; following it keeps bottom
 * buttons above the keyboard and stops the page from being pushed around.
 */
export function useAppHeight() {
  useEffect(() => {
    if (document.documentElement.dataset.embed === 'true') return // the frame sizes us
    const vv = window.visualViewport
    const set = () => {
      const h = vv ? vv.height : window.innerHeight
      document.documentElement.style.setProperty('--app-height', `${Math.round(h)}px`)
      // iOS scrolls the layout viewport when an input is focused; undo it so nothing jumps.
      if (window.scrollY !== 0) window.scrollTo(0, 0)
    }
    set()
    vv?.addEventListener('resize', set)
    vv?.addEventListener('scroll', set)
    window.addEventListener('resize', set)
    return () => {
      vv?.removeEventListener('resize', set)
      vv?.removeEventListener('scroll', set)
      window.removeEventListener('resize', set)
    }
  }, [])
}

/**
 * Desktop preview = wider than the widest phone, or no touch at all.
 * Then we draw a status bar + home indicator so screens read like the Figma frames.
 */
export function useIsPreview() {
  const query = '(min-width: 441px), (hover: hover) and (pointer: fine)'
  // ?preview=1 / ?preview=0 forces it (review screenshots, testing on a phone).
  const forced = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('preview') : null
  const [preview, setPreview] = useState(() => (forced ? forced === '1' : typeof window !== 'undefined' && window.matchMedia(query).matches))
  useEffect(() => {
    if (forced) return
    const mq = window.matchMedia(query)
    const on = () => setPreview(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [forced])
  return preview
}

/** Writes an element's height into a CSS variable on a target element (used for bar insets). */
export function useHeightVar(ref: RefObject<HTMLElement | null>, target: RefObject<HTMLElement | null>, name: string) {
  useLayoutEffect(() => {
    const el = ref.current
    const tgt = target.current
    if (!el || !tgt) {
      tgt?.style.removeProperty(name)
      return
    }
    const ro = new ResizeObserver(() => tgt.style.setProperty(name, `${el.offsetHeight}px`))
    ro.observe(el)
    tgt.style.setProperty(name, `${el.offsetHeight}px`)
    return () => ro.disconnect()
  }, [ref, target, name])
}

/** True once the element has scrolled past `threshold` px (for collapsing headers). */
export function useScrolledPast(threshold: number) {
  const ref = useRef<HTMLDivElement>(null)
  const [past, setPast] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const on = () => setPast(el.scrollTop > threshold)
    el.addEventListener('scroll', on, { passive: true })
    return () => el.removeEventListener('scroll', on)
  }, [threshold])
  return [ref, past] as const
}
