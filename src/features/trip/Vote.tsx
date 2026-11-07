import { useState } from 'react'
import { motion } from 'motion/react'
import { useNavigate, useParams } from 'react-router'
import { ChevronRight, Globe04, Sliders04, XClose } from '@untitledui/icons'
import { t } from '@/copy'
import { destById, me } from '@/domain/trip'
import { cn } from '@/lib/cn'
import { fadeUp, pop, press, stagger } from '@/lib/motion'
import { useBack } from '@/app/stack'
import { useApp, useIsOrganizer, useTrip, type Candidate } from '@/store/app'
import { Button, IconButton } from '@/ui/Button'
import { FeaturedIcon, TripIcon } from '@/ui/Media'
import { NavBar, Screen } from '@/ui/Screen'
import { Meta, OrDivider, PageHeader, SectionHeader } from '@/ui/Surface'
import { toast } from '@/ui/Toast'

/* WIP board "Confirmation of vote" — list view (1:66725 user · 1:66847 organiser ·
   1:66943 with a custom suggestion). The swipe view (Voting WIP) is a later comparison.
   CTA sits at the end of the list, as drawn (not pinned). */
export function Vote() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const back = useBack(`/trip/${id}`)
  const trip = useTrip(id)
  const isOrganizer = useIsOrganizer(trip)
  const setVote = useApp((s) => s.setVote)
  const resetVotes = useApp((s) => s.resetVotes)
  const confirmVote = useApp((s) => s.confirmVote)
  const [confirming, setConfirming] = useState(false)
  if (!trip) return null
  const votes = me(trip)?.votes ?? {}
  const any = Object.keys(votes).length > 0

  return (
    <Screen
      label={t.vote.title}
      top={
        <NavBar
          left={<IconButton icon={XClose} label={t.common.close} onClick={() => back()} />}
          right={<IconButton icon={Sliders04} label={t.vote.filters} onClick={() => toast(t.vote.filtersSoon)} />}
        />
      }
    >
      <motion.div variants={stagger} initial="hidden" animate="show" className="flex flex-col gap-6 px-4 pt-5">
        <motion.div variants={fadeUp}>
          <PageHeader size="md" title={t.vote.title} subtitle={t.vote.subtitle} />
        </motion.div>

        <section aria-labelledby="ballot" className="flex flex-col gap-4">
          <motion.div variants={fadeUp}>
            <SectionHeader id="ballot" title={t.vote.confirmSection} />
          </motion.div>
          <ul className="flex flex-col gap-3">
            {trip.candidates.map((c) => (
              <BallotRow key={c.destinationId} candidate={c} value={votes[c.destinationId]} onVote={(v) => setVote(trip.id, c.destinationId, v)} />
            ))}
          </ul>
          {isOrganizer && (
            <>
              <OrDivider label={t.common.or} />
              <motion.div variants={fadeUp} {...press}>
                <button
                  type="button"
                  onClick={() => void navigate(`/trip/${trip.id}/vote/suggest`)}
                  className="flex w-full items-center gap-3 rounded-3xl bg-surface p-2.5 text-left shadow-card"
                >
                  <FeaturedIcon icon={Globe04} tone="tint" size={56} />
                  <span className="flex flex-1 flex-col">
                    <span className="text-sm text-ink-muted">{t.vote.suggestEyebrow}</span>
                    <span className="text-md font-semibold text-ink">{t.vote.suggestTitle}</span>
                  </span>
                  <ChevronRight aria-hidden width={20} height={20} className="mr-1.5 text-ink-subtle" />
                </button>
              </motion.div>
            </>
          )}
        </section>

        <motion.div variants={fadeUp} className="flex flex-col items-center gap-2 pb-2">
          <Button
            fullWidth
            disabled={!any}
            loading={confirming}
            onClick={() => {
              setConfirming(true)
              setTimeout(() => {
                confirmVote(trip.id)
                back()
              }, 400)
            }}
          >
            {t.vote.confirm}
          </Button>
          <Button variant="tertiary" size="md" disabled={!any} onClick={() => resetVotes(trip.id)}>
            {t.vote.reset}
          </Button>
        </motion.div>
      </motion.div>
    </Screen>
  )
}

function BallotRow({ candidate: c, value, onVote }: { candidate: Candidate; value?: 1 | -1; onVote: (v: 1 | -1 | null) => void }) {
  const d = destById(c.destinationId)
  if (!d) return null
  const meta = c.source === 'custom' ? t.vote.custom : t.vote.match(c.score)
  return (
    <motion.li variants={fadeUp} className="flex items-center gap-3 rounded-3xl bg-surface p-2.5 shadow-card">
      <TripIcon countryCode={d.countryCode} />
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-md font-semibold text-ink">{d.name}</span>
        <Meta items={[{ text: meta }, { text: t.vote.perDay(d.costPerDay) }]} />
      </span>
      <span className="flex gap-2" role="group" aria-label={d.name}>
        <Thumb kind="yes" on={value === 1} label={t.vote.yes(d.name)} onPress={() => onVote(value === 1 ? null : 1)} />
        <Thumb kind="no" on={value === -1} label={t.vote.no(d.name)} onPress={() => onVote(value === -1 ? null : -1)} />
      </span>
    </motion.li>
  )
}

/* Figma Yes/No: 44px circles. Off = control tint + grey line; Yes on = green tint + green line;
   No on = red tint + red line. aria-pressed carries the state (not colour alone). */
function Thumb({ kind, on, label, onPress }: { kind: 'yes' | 'no'; on: boolean; label: string; onPress: () => void }) {
  return (
    <motion.button
      type="button"
      aria-pressed={on}
      aria-label={label}
      onClick={onPress}
      {...press}
      variants={pop}
      animate={on ? 'pop' : 'rest'}
      className={cn(
        'grid size-11 place-items-center rounded-full border text-md',
        !on && 'border-control-line bg-control-tint',
        on && kind === 'yes' && 'border-vote-yes-line bg-vote-yes-tint',
        on && kind === 'no' && 'border-vote-no-line bg-vote-no-tint',
      )}
    >
      <span aria-hidden>{kind === 'yes' ? '👍' : '👎'}</span>
    </motion.button>
  )
}
