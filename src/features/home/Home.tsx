import { motion } from 'motion/react'
import { useNavigate } from 'react-router'
import { Globe04, Link03, Plus } from '@untitledui/icons'
import { t } from '@/copy'
import { fadeUp, stagger } from '@/lib/motion'
import { useApp } from '@/store/app'
import { Button } from '@/ui/Button'
import { FeaturedIcon } from '@/ui/Media'
import { Card, OrDivider, SectionHeader } from '@/ui/Surface'
import { TabScreen } from './Tabs'
import { TripCard } from './TripCard'

/* Figma: Home_Empty (1:45318) · Home_Trips (1:45456) · Home_FAB_Open (1:45477). */
export function Home() {
  const navigate = useNavigate()
  const profile = useApp((s) => s.profile)
  const trips = useApp((s) => s.trips)

  return (
    <TabScreen tab="home" label={t.tabs.home}>
      <motion.div variants={stagger} initial="hidden" animate="show" className="flex flex-col gap-8 px-4 pt-6">
        <motion.header variants={fadeUp} className="flex flex-col gap-1">
          <p className="text-md text-ink">{t.home.greeting(profile?.name ?? 'there')}</p>
          <h1 className="text-display-sm font-medium text-ink">
            {t.home.title[0]}
            <br />
            {t.home.title[1]}
          </h1>
        </motion.header>

        <section aria-labelledby="my-trips" className="flex flex-col gap-3">
          <motion.div variants={fadeUp}>
            <SectionHeader id="my-trips" title={t.home.myTrips} />
          </motion.div>
          {trips.length > 0 ? (
            <motion.ul variants={stagger} className="flex flex-col gap-3.5">
              {trips.map((trip) => (
                <TripCard key={trip.id} trip={trip} />
              ))}
            </motion.ul>
          ) : (
            <motion.div variants={fadeUp} className="flex flex-col gap-5">
              <Card className="flex flex-col items-center gap-4 p-5 text-center">
                <FeaturedIcon icon={Globe04} tone="tint" size={56} />
                <div className="flex flex-col">
                  <p className="text-xs text-ink-muted">{t.home.emptyLead}</p>
                  <p className="text-md font-semibold text-ink">{t.home.emptyTitle}</p>
                </div>
                <Button size="md" iconLeft={Plus} onClick={() => void navigate('/new')}>
                  {t.home.start}
                </Button>
              </Card>
              <OrDivider label={t.common.or} />
              <div className="flex justify-center">
                <Button variant="secondary" size="md" iconLeft={Link03} onClick={() => void navigate('/join')}>
                  {t.home.join}
                </Button>
              </div>
            </motion.div>
          )}
        </section>
      </motion.div>
    </TabScreen>
  )
}
