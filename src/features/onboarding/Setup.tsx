import { useState } from 'react'
import { motion } from 'motion/react'
import { useNavigate } from 'react-router'
import { t } from '@/copy'
import { cityLabel } from '@/domain/trip'
import { fadeUp, stagger } from '@/lib/motion'
import { useApp } from '@/store/app'
import { useDrafts } from '@/store/drafts'
import { Button } from '@/ui/Button'
import { TextField, SelectField } from '@/ui/Field'
import { BottomBar, Screen } from '@/ui/Screen'
import { PageHeader, SectionHeader } from '@/ui/Surface'

/* Figma: User_Details (1:44205 empty · 1:44173 filled). City opens the search (1:44123). */
export function Setup() {
  const navigate = useNavigate()
  const saveProfile = useApp((s) => s.saveProfile)
  const profile = useApp((s) => s.profile)
  const draft = useDrafts((s) => s.setup)
  const setDraft = useDrafts((s) => s.setSetup)
  const [name, setName] = useState(draft.name || profile?.name || '')
  const cityId = draft.cityId ?? profile?.cityId
  const [saving, setSaving] = useState(false)
  const ready = name.trim().length > 0 && !!cityId

  const save = () => {
    if (!ready) return
    setSaving(true)
    // Simulated network round-trip so the loading state is visible in the prototype.
    setTimeout(() => {
      saveProfile({ name: name.trim(), cityId: cityId! })
      void navigate('/home', { replace: true })
    }, 500)
  }

  return (
    <Screen
      label={t.setup.title}
      bottom={
        <BottomBar>
          <Button fullWidth disabled={!ready} loading={saving} onClick={save}>
            {t.setup.save}
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
          save()
        }}
        className="flex flex-col gap-8 px-4 pt-6"
      >
        <motion.div variants={fadeUp}>
          <PageHeader title={t.setup.title} subtitle={t.setup.subtitle} />
        </motion.div>
        <motion.div variants={fadeUp} className="flex flex-col gap-3">
          <SectionHeader title={t.setup.section} />
          <div className="flex flex-col gap-5">
            <TextField
              label={t.setup.name}
              placeholder={t.setup.namePlaceholder}
              value={name}
              autoComplete="given-name"
              enterKeyHint="next"
              onChange={(e) => {
                setName(e.target.value)
                setDraft({ name: e.target.value })
              }}
            />
            <SelectField
              label={t.setup.city}
              placeholder={t.setup.cityPlaceholder}
              value={cityLabel(cityId)}
              hint={t.setup.cityHint}
              onPress={() => void navigate('/setup/city')}
            />
          </div>
        </motion.div>
      </motion.form>
    </Screen>
  )
}
