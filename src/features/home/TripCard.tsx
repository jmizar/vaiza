import { motion } from 'motion/react'
import { Link } from 'react-router'
import { MarkerPin01, Users01 } from '@untitledui/icons'
import { t } from '@/copy'
import { destById, destShort, tripChip } from '@/domain/trip'
import { fadeUp, press } from '@/lib/motion'
import type { Trip } from '@/store/app'
import { Badge } from '@/ui/Badge'
import { TripIcon } from '@/ui/Media'
import { Meta } from '@/ui/Surface'

/* Figma: Trip Card (1:46520). 343×76, padding 10, radius 20, 56px icon, title 16 semibold,
   meta xs (members · destination), status chip. The whole card is one link. */
export function TripCard({ trip }: { trip: Trip }) {
  const chip = tripChip(trip)
  const dest = destById(trip.destinationId)
  const n = trip.members.length
  return (
    <motion.li variants={fadeUp}>
      <motion.div {...press}>
        <Link to={`/trip/${trip.id}`} className="flex items-center gap-3 rounded-3xl bg-surface p-2.5 shadow-card outline-offset-2">
          <TripIcon kind={trip.icon} countryCode={dest?.countryCode} />
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="truncate text-md font-semibold text-ink-title">{trip.name}</span>
            <Meta
              items={
                dest
                  ? [
                      {
                        icon: Users01,
                        text: (
                          <>
                            {n}
                            <span className="sr-only"> {t.home.members(n).replace(/^\d+ /, '')}</span>
                          </>
                        ),
                      },
                      { icon: MarkerPin01, text: destShort(trip.destinationId) },
                    ]
                  : [{ icon: Users01, text: t.home.members(n) }]
              }
            />
          </span>
          <Badge tone={chip} className="mr-1.5">
            {t.home.chip[chip]}
          </Badge>
        </Link>
      </motion.div>
    </motion.li>
  )
}
