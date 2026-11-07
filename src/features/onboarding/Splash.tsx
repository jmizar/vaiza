import { useEffect } from 'react'
import { motion } from 'motion/react'
import { useNavigate } from 'react-router'
import { t } from '@/copy'
import { spring } from '@/lib/motion'
import { useApp } from '@/store/app'
import { Screen } from '@/ui/Screen'

/* Figma: Journey Setup / Mobile (1:43922). Navy, logo tile + wordmark, then the app decides where
   to go: first launch → onboarding, no profile → setup, otherwise home. */
export function Splash() {
  const navigate = useNavigate()
  const onboarded = useApp((s) => s.onboarded)
  const hasProfile = useApp((s) => !!s.profile)

  useEffect(() => {
    const next = !onboarded ? '/onboarding' : !hasProfile ? '/setup' : '/home'
    const timer = setTimeout(() => void navigate(next, { replace: true }), 1400)
    return () => clearTimeout(timer)
  }, [navigate, onboarded, hasProfile])

  return (
    <Screen tone="navy" label={t.app.name}>
      <div className="flex min-h-full flex-col items-center justify-center gap-6 px-6 pb-12 pt-8 text-center">
        <motion.span
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1, transition: spring }}
          className="bg-brand-gradient grid size-16 place-items-center rounded-[18px] text-[27px] font-semibold text-on-brand"
          aria-hidden
        >
          V
        </motion.span>
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.15 } }} className="flex flex-col gap-2">
          <h1 className="text-display-md font-medium tracking-[-0.7px] text-ink-on-dark">{t.app.name}</h1>
          <p className="text-md text-ink-on-dark-subtle">{t.splash.tagline}</p>
        </motion.div>
      </div>
    </Screen>
  )
}
