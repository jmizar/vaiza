import { useState } from 'react'
import { motion } from 'motion/react'
import { useNavigate } from 'react-router'
import { Check, Lock03 } from '@untitledui/icons'
import { t } from '@/copy'
import { destById, votingResult } from '@/domain/trip'
import { cn } from '@/lib/cn'
import { press } from '@/lib/motion'
import { useApp, type Trip } from '@/store/app'
import { Badge } from '@/ui/Badge'
import { Button } from '@/ui/Button'
import { Flag } from '@/ui/Media'
import { Sheet } from '@/ui/Sheet'

/* GAP (not in Figma): how the organiser sees the results and picks. Minimal placeholder:
   ranked list with 👍/👎 counts, leader pre-selected, one lock button. Needs Jaime's design. */
export function DecideSheet({ trip, open, onClose }: { trip: Trip; open: boolean; onClose: () => void }) {
  const navigate = useNavigate()
  const lock = useApp((s) => s.lockDestination)
  const result = votingResult(trip)
  const [picked, setPicked] = useState<string | null>(null)
  const choice = picked ?? result.ranking[0]?.destinationId ?? null

  return (
    <Sheet open={open} onClose={onClose} title={t.vote.decide.title} description={t.vote.decide.body}>
      <div role="radiogroup" aria-label={t.vote.decide.title} className="flex flex-col gap-2">
        {result.ranking.slice(0, 5).map((r, i) => {
          const d = destById(r.destinationId)
          if (!d) return null
          const on = choice === r.destinationId
          return (
            <motion.button
              key={r.destinationId}
              type="button"
              role="radio"
              aria-checked={on}
              {...press}
              onClick={() => setPicked(r.destinationId)}
              className={cn('flex items-center gap-3 rounded-2xl border p-2.5 text-left', on ? 'border-brand bg-tint-brand' : 'border-line-subtle bg-surface')}
            >
              <Flag countryCode={d.countryCode} size={40} />
              <span className="flex flex-1 flex-col">
                <span className="flex items-center gap-2 text-md font-semibold text-ink">
                  {d.name}
                  {i === 0 && result.leaderId && (
                    <Badge tone="best" size="sm">
                      {t.vote.decide.leader}
                    </Badge>
                  )}
                </span>
                <span className="text-xs text-ink-muted">{t.vote.decide.votes(r.up.length, r.down.length)}</span>
              </span>
              {on && <Check aria-hidden width={20} height={20} className="text-brand" />}
            </motion.button>
          )
        })}
      </div>
      <Button
        fullWidth
        iconRight={Lock03}
        disabled={!choice}
        onClick={() => {
          if (!choice) return
          lock(trip.id, choice)
          onClose()
          void navigate(`/trip/${trip.id}/locked`)
        }}
      >
        {t.vote.decide.lock}
      </Button>
    </Sheet>
  )
}
