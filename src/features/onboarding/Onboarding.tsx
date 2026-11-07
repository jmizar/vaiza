import { useRef, useState } from 'react'
import { animate, motion, useMotionValue, type PanInfo } from 'motion/react'
import { useNavigate } from 'react-router'
import { t } from '@/copy'
import { cn } from '@/lib/cn'
import { navTransition } from '@/lib/motion'
import { useApp } from '@/store/app'
import { Button } from '@/ui/Button'
import { BottomBar, Screen } from '@/ui/Screen'
import img1 from '@/assets/illustrations/onboarding-1.svg'
import img2 from '@/assets/illustrations/onboarding-2.svg'
import img3 from '@/assets/illustrations/onboarding-3.svg'

/* Figma: Onboarding 4/5/6 (1:43932, 1:44001, 1:44054). Swipe or tap Next; dots show progress.
   Illustration 343², title 30/38 semibold, body 18/28. */
const IMAGES = [img1, img2, img3]

export function Onboarding() {
  const navigate = useNavigate()
  const setOnboarded = useApp((s) => s.setOnboarded)
  const hasProfile = useApp((s) => !!s.profile)
  const [index, setIndex] = useState(0)
  const track = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)
  const pages = t.onboarding.pages
  const last = index === pages.length - 1

  const goTo = (i: number) => {
    const clamped = Math.max(0, Math.min(pages.length - 1, i))
    setIndex(clamped)
    const width = track.current?.offsetWidth ?? 375
    void animate(x, -clamped * width, navTransition)
  }

  const onDragEnd = (_: unknown, info: PanInfo) => {
    const width = track.current?.offsetWidth ?? 375
    const swipe = info.offset.x + info.velocity.x * 0.2
    if (swipe < -width / 4) goTo(index + 1)
    else if (swipe > width / 4) goTo(index - 1)
    else goTo(index)
  }

  const finish = () => {
    setOnboarded()
    void navigate(hasProfile ? '/home' : '/setup', { replace: true })
  }

  return (
    <Screen
      label={t.onboarding.label}
      bottomFade={false}
      bottom={
        <BottomBar className="gap-6">
          <div aria-hidden className="flex justify-center gap-2">
            {pages.map((_, i) => (
              <motion.span key={i} layout className={cn('h-2 rounded-full', i === index ? 'w-6 bg-brand' : 'w-2 bg-line')} />
            ))}
          </div>
          <Button fullWidth onClick={() => (last ? finish() : goTo(index + 1))}>
            {last ? t.onboarding.start : t.onboarding.next}
          </Button>
        </BottomBar>
      }
    >
      <div ref={track} className="h-full overflow-hidden" role="region" aria-roledescription="carousel" aria-label={t.onboarding.label}>
        <motion.div
          className="flex h-full touch-pan-y"
          style={{ x, width: `${pages.length * 100}%` }}
          drag="x"
          dragConstraints={track}
          dragElastic={0.15}
          onDragEnd={onDragEnd}
        >
          {pages.map((p, i) => (
            <section
              key={p.title}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} / ${pages.length}`}
              aria-hidden={i !== index || undefined}
              inert={i !== index}
              style={{ width: `${100 / pages.length}%` }}
              className="flex h-full flex-col items-center justify-center gap-8 px-4 pt-3"
            >
              <img src={IMAGES[i]} alt="" draggable={false} className="aspect-square w-full max-w-[343px] select-none" />
              <div className="flex flex-col items-center gap-3 text-center">
                <h1 className="text-display-sm font-semibold text-ink">{p.title}</h1>
                <p className="text-lg text-ink-secondary">{p.body}</p>
              </div>
            </section>
          ))}
        </motion.div>
      </div>
    </Screen>
  )
}
