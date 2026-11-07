import { useState } from 'react'
import { motion } from 'motion/react'
import { useNavigate } from 'react-router'
import { ChevronLeft, Lightbulb04 } from '@untitledui/icons'
import { t } from '@/copy'
import { destById } from '@/domain/trip'
import { fadeUp, stagger } from '@/lib/motion'
import { useBack } from '@/app/stack'
import { useApp } from '@/store/app'
import { useDrafts } from '@/store/drafts'
import { Button, IconButton } from '@/ui/Button'
import { ToggleChip } from '@/ui/Choice'
import { SelectField, TextField } from '@/ui/Field'
import { BottomBar, NavBar, Screen } from '@/ui/Screen'
import { Card, PageHeader } from '@/ui/Surface'

/* Figma: New_trip (1:47789 empty · 1:47841 typing · 1:47895 preset · 1:47947 filled).
   Create → the trip exists; the dates step opens on top of the new trip screen. */
export function NewTrip() {
  const navigate = useNavigate()
  const back = useBack('/home')
  const createTrip = useApp((s) => s.createTrip)
  const draft = useDrafts((s) => s.newTrip)
  const setDraft = useDrafts((s) => s.setNewTrip)
  const resetDraft = useDrafts((s) => s.resetNewTrip)
  const [creating, setCreating] = useState(false)
  const name = draft.name
  const ready = name.trim().length > 0

  const create = () => {
    if (!ready) return
    setCreating(true)
    setTimeout(async () => {
      const id = createTrip(name.trim(), draft.destinationId)
      resetDraft()
      // History becomes Home → Trip → Dates, so closing the dates step lands on the new trip.
      await navigate(`/trip/${id}`, { replace: true })
      await navigate(`/trip/${id}/dates/new`)
    }, 400)
  }

  return (
    <Screen
      label={t.newTrip.title}
      top={<NavBar left={<IconButton icon={ChevronLeft} label={t.common.back} onClick={() => back()} />} />}
      bottom={
        <BottomBar>
          <Button fullWidth disabled={!ready} loading={creating} onClick={create}>
            {t.newTrip.create}
          </Button>
        </BottomBar>
      }
    >
      <motion.form
        variants={stagger}
        initial="hidden"
        animate="show"
        onSubmit={(e) => {
          e.preventDefault()
          create()
        }}
        className="flex flex-col gap-6 px-4 pt-5"
      >
        <motion.div variants={fadeUp}>
          <PageHeader size="md" title={t.newTrip.title} subtitle={t.newTrip.subtitle} />
        </motion.div>

        <motion.div variants={fadeUp} className="flex flex-col gap-4">
          <Card className="flex flex-col gap-3 p-4">
            <TextField
              label={t.newTrip.name}
              placeholder={t.newTrip.namePlaceholder}
              value={name}
              enterKeyHint="done"
              maxLength={40}
              onChange={(e) => setDraft({ name: e.target.value })}
            />
            <div className="flex flex-wrap gap-2" role="group" aria-label={t.newTrip.name}>
              {t.newTrip.presets.map((p) => (
                <ToggleChip key={p} selected={name === p} onToggle={() => setDraft({ name: name === p ? '' : p })}>
                  {p}
                </ToggleChip>
              ))}
            </div>
          </Card>

          <Card className="p-4">
            <SelectField
              label={t.newTrip.where}
              optional={t.newTrip.optional}
              placeholder={t.newTrip.wherePlaceholder}
              value={destById(draft.destinationId)?.name}
              onPress={() => void navigate('/new/destination')}
            />
          </Card>

          <Card className="flex gap-2 p-4">
            <span aria-hidden className="grid size-8 shrink-0 place-items-center rounded-full bg-tint-brand text-brand">
              <Lightbulb04 width={16} height={16} />
            </span>
            <p className="pt-1.5 text-sm text-ink-tertiary">
              {t.newTrip.tipLead} <strong className="font-semibold text-ink">{t.newTrip.tipStrong}</strong> {t.newTrip.tipBody}
            </p>
          </Card>
        </motion.div>
      </motion.form>
    </Screen>
  )
}
