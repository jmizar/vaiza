import { useState } from 'react'
import { motion } from 'motion/react'
import { useNavigate } from 'react-router'
import { Settings02 } from '@untitledui/icons'
import { t } from '@/copy'
import { cityLabel, destById, ME } from '@/domain/trip'
import { fadeUp, stagger } from '@/lib/motion'
import { useApp } from '@/store/app'
import { Badge } from '@/ui/Badge'
import { IconButton } from '@/ui/Button'
import { SelectField, TextField } from '@/ui/Field'
import { Avatar } from '@/ui/Media'
import { Sheet } from '@/ui/Sheet'
import { Card, SectionHeader } from '@/ui/Surface'
import { cn } from '@/lib/cn'
import { DemoControls } from '@/features/dev/DemoPanel'
import { TabScreen } from './Tabs'

/* Figma: Profile (1:45530) · Profile_From (1:45582). Timeline numbers are computed from the
   prototype's trips (Figma shows sample numbers). The gear opens prototype controls for now:
   a real Settings screen isn't designed yet. */
export function Profile() {
  const navigate = useNavigate()
  const profile = useApp((s) => s.profile)
  const trips = useApp((s) => s.trips)
  const saveProfile = useApp((s) => s.saveProfile)
  const [name, setName] = useState(profile?.name ?? '')
  const [settings, setSettings] = useState(false)

  const created = trips.filter((tr) => tr.members.find((m) => m.id === ME)?.role === 'organizer').length
  const countries = new Set(
    trips
      .filter((tr) => tr.phase === 'booking')
      .map((tr) => destById(tr.destinationId)?.countryCode)
      .filter(Boolean),
  ).size
  const partners = new Set(trips.flatMap((tr) => tr.members.filter((m) => m.id !== ME).map((m) => m.id))).size
  const stats = [
    { label: t.profile.stats.created, value: created },
    { label: t.profile.stats.countries, value: countries },
    { label: t.profile.stats.partners, value: partners },
  ]

  return (
    <TabScreen
      tab="profile"
      label={t.tabs.profile}
      overlay={
        <Sheet open={settings} onClose={() => setSettings(false)} title={t.dev.title} description={t.dev.body}>
          <DemoControls onDone={() => setSettings(false)} />
        </Sheet>
      }
    >
      <motion.div variants={stagger} initial="hidden" animate="show" className="flex flex-col gap-8 px-4 pt-3">
        <motion.header variants={fadeUp} className="flex items-center gap-3">
          <Avatar name={profile?.name ?? '?'} size={64} />
          <div className="flex flex-1 flex-col items-start gap-1">
            <h1 className="text-lg font-semibold text-ink">{profile?.name}</h1>
            <Badge tone="best" size="sm">
              {t.profile.badge}
            </Badge>
          </div>
          <IconButton icon={Settings02} label={t.profile.settings} onClick={() => setSettings(true)} className="self-start" />
        </motion.header>

        <motion.section variants={fadeUp} aria-labelledby="info" className="flex flex-col gap-3">
          <SectionHeader id="info" title={t.profile.info} />
          <div className="flex flex-col gap-5">
            <TextField
              label={t.profile.name}
              value={name}
              autoComplete="given-name"
              onChange={(e) => setName(e.target.value)}
              onBlur={() => name.trim() && profile && saveProfile({ ...profile, name: name.trim() })}
            />
            <SelectField
              label={t.profile.city}
              placeholder={t.setup.cityPlaceholder}
              value={cityLabel(profile?.cityId)}
              onPress={() => void navigate('/profile/city')}
            />
          </div>
        </motion.section>

        <motion.section variants={fadeUp} aria-labelledby="timeline" className="flex flex-col gap-3">
          <SectionHeader id="timeline" title={t.profile.timeline} />
          <Card className="px-4 py-1">
            <dl>
              {stats.map((s, i) => (
                <div key={s.label} className={cn('flex h-12 items-center justify-between', i > 0 && 'border-t border-line-divider')}>
                  <dt className="text-sm text-ink-tertiary">{s.label}</dt>
                  <dd className="text-md font-semibold text-ink">{s.value}</dd>
                </div>
              ))}
            </dl>
          </Card>
          <p className="pt-3 text-center text-sm text-ink-muted">{t.profile.version}</p>
        </motion.section>
      </motion.div>
    </TabScreen>
  )
}
