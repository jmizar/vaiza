import { motion } from 'motion/react'
import { useParams } from 'react-router'
import { t } from '@/copy'
import { destById, formatRange } from '@/domain/trip'
import { spring } from '@/lib/motion'
import { useBack } from '@/app/stack'
import { useApp, useTrip } from '@/store/app'
import { Button } from '@/ui/Button'
import { Flag } from '@/ui/Media'
import { BottomBar, Screen } from '@/ui/Screen'

/* WIP board "Vote done" / Success_Screen (1:72156) is an empty navy frame. Minimal fill:
   the destination flag, a one-line celebration and the way into the hub. Placeholder until designed. */
export function Locked() {
  const { id = '' } = useParams()
  const back = useBack(`/trip/${id}`)
  const trip = useTrip(id)
  const markCelebrated = useApp((s) => s.markCelebrated)
  const dest = destById(trip?.destinationId)
  if (!trip || !dest) return null

  return (
    <Screen
      tone="navy"
      label={t.locked.title(dest.name)}
      bottom={
        <BottomBar>
          <Button
            fullWidth
            onClick={() => {
              markCelebrated(trip.id)
              back()
            }}
          >
            {t.locked.cta}
          </Button>
        </BottomBar>
      }
      bottomFade={false}
    >
      <div className="flex min-h-full flex-col items-center justify-center gap-6 px-6 text-center">
        <motion.div initial={{ scale: 0.4, rotate: -8, opacity: 0 }} animate={{ scale: 1, rotate: 0, opacity: 1, transition: { ...spring, delay: 0.15 } }}>
          <Flag countryCode={dest.countryCode} size={112} className="rounded-3xl" />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.3 } }} className="flex flex-col gap-2">
          <h1 className="text-display-sm font-semibold text-ink-on-dark">{t.locked.title(dest.name)}</h1>
          <p className="text-md text-ink-on-dark-muted">{t.locked.body}</p>
          {trip.locked && <p className="text-sm font-medium text-ink-on-dark-subtle">{formatRange(trip.locked.start, trip.locked.end)}</p>}
        </motion.div>
      </div>
    </Screen>
  )
}
