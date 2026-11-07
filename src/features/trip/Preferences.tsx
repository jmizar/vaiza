import { useState } from 'react'
import { motion } from 'motion/react'
import { useParams } from 'react-router'
import { Check, ChevronLeft } from '@untitledui/icons'
import { t } from '@/copy'
import { ACTIVITIES, BUDGET_TIERS, type Activity, type BudgetTier } from '@/engine'
import { me } from '@/domain/trip'
import { fadeUp, stagger } from '@/lib/motion'
import { useBack } from '@/app/stack'
import { useApp, useTrip } from '@/store/app'
import { Button, IconButton } from '@/ui/Button'
import { OptionCard, ToggleChip } from '@/ui/Choice'
import { BottomBar, NavBar, Screen } from '@/ui/Screen'
import { Card, PageHeader, SectionHeader } from '@/ui/Surface'

/* Figma: Preferences (1:48354 empty · 1:48438 selected). Budget is private: only counts per tier
   ever reach other members. Save or Skip returns to the trip (closing the dates step too). */
export function Preferences() {
  const { id = '' } = useParams()
  const back = useBack(`/trip/${id}`)
  const trip = useTrip(id)
  const save = useApp((s) => s.setMyPreferences)
  const mine = trip ? me(trip) : undefined
  const [budget, setBudget] = useState<BudgetTier | undefined>(mine?.budget)
  const [activities, setActivities] = useState<Activity[]>(mine?.activities ?? [])
  const [saving, setSaving] = useState(false)

  const toggle = (a: Activity) => setActivities((list) => (list.includes(a) ? list.filter((x) => x !== a) : [...list, a]))
  const done = () => back(2)

  return (
    <Screen
      label={t.prefs.title}
      top={
        <NavBar
          left={<IconButton icon={ChevronLeft} label={t.common.back} onClick={() => back()} />}
          right={
            <Button variant="tertiary" size="sm" onClick={done}>
              {t.prefs.skip}
            </Button>
          }
        />
      }
      bottom={
        <BottomBar>
          <Button
            fullWidth
            disabled={!budget}
            loading={saving}
            iconRight={Check}
            onClick={() => {
              setSaving(true)
              setTimeout(() => {
                save(id, budget, activities)
                done()
              }, 400)
            }}
          >
            {t.prefs.save}
          </Button>
        </BottomBar>
      }
    >
      <motion.div variants={stagger} initial="hidden" animate="show" className="flex flex-col gap-6 px-4 pt-5">
        <motion.div variants={fadeUp}>
          <PageHeader size="md" title={t.prefs.title} subtitle={t.prefs.subtitle} />
        </motion.div>

        <motion.section variants={fadeUp} aria-labelledby="budget" className="flex flex-col gap-3">
          <SectionHeader id="budget" title={t.prefs.budget} />
          <div role="radiogroup" aria-labelledby="budget" className="grid grid-cols-2 gap-3">
            {BUDGET_TIERS.map((tier) => {
              const c = t.prefs.tiers[tier]
              return <OptionCard key={tier} selected={budget === tier} onSelect={() => setBudget(tier)} symbol={c.symbol} title={c.title} caption={c.caption} />
            })}
          </div>
        </motion.section>

        <motion.section variants={fadeUp} aria-labelledby="activities" className="flex flex-col gap-3">
          <SectionHeader id="activities" title={t.prefs.activities} hint={t.prefs.optional} />
          <Card className="flex flex-wrap gap-2 p-4" role="group" aria-labelledby="activities">
            {ACTIVITIES.map((a) => (
              <ToggleChip key={a} selected={activities.includes(a)} onToggle={() => toggle(a)}>
                {t.prefs.activityLabels[a]}
              </ToggleChip>
            ))}
          </Card>
        </motion.section>
      </motion.div>
    </Screen>
  )
}
