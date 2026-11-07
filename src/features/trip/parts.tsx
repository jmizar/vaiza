import { motion } from 'motion/react'
import { Link, useNavigate } from 'react-router'
import { CalendarCheck01, CalendarDate, CalendarPlus01, ChevronRight, Copy01, Edit01, Eye, Pin01, Share07, UserPlus01, Users01 } from '@untitledui/icons'
import { t } from '@/copy'
import { cityById, formatRange, ME, shownWindow } from '@/domain/trip'
import { fadeUp, press } from '@/lib/motion'
import { useApp, type Trip, type TripMember } from '@/store/app'
import { Badge } from '@/ui/Badge'
import { Button } from '@/ui/Button'
import { Avatar, FeaturedIcon } from '@/ui/Media'
import { Sheet } from '@/ui/Sheet'
import { toast } from '@/ui/Toast'
import { Card, Divider, Meta, SectionHeader } from '@/ui/Surface'

/* Building blocks of the trip screen and the trip hub (Figma: Travel Window 1:53926, Members 1:53710). */

/** TRAVEL WINDOW card: gradient calendar tile, range, Provisional until locked, days · who's in. */
export function TravelWindowSection({ trip }: { trip: Trip }) {
  const w = shownWindow(trip)
  if (!w) return null
  const total = trip.members.length
  return (
    <motion.section variants={fadeUp} aria-labelledby="tw" className="flex flex-col gap-3">
      <SectionHeader id="tw" title={t.trip.sections.window} />
      <motion.div {...press}>
        <Link to={`/trip/${trip.id}/window`} className="flex items-center gap-3 rounded-2xl bg-surface p-4 shadow-card">
          <FeaturedIcon icon={CalendarDate} />
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="flex items-center gap-2">
              <span className="text-sm font-medium text-ink-title">{formatRange(w.start, w.end)}</span>
              {!w.locked && (
                <Badge tone="provisional" size="sm">
                  {t.trip.provisional}
                </Badge>
              )}
            </span>
            <Meta items={[{ text: t.trip.windowMeta(w.days) }, { icon: CalendarPlus01, text: `${w.count}/${total}` }]} />
          </span>
          <ChevronRight aria-hidden width={20} height={20} className="text-ink-subtle" />
        </Link>
      </motion.div>
    </motion.section>
  )
}

/** MEMBERS: header with "Add members", then one row per person. */
export function MembersSection({ trip, onInvite, title }: { trip: Trip; onInvite?: () => void; title?: string }) {
  const navigate = useNavigate()
  // You first, then everyone in the order they joined.
  const members = [...trip.members].sort((a, b) => (a.id === ME ? -1 : b.id === ME ? 1 : 0))
  return (
    <motion.section variants={fadeUp} aria-labelledby="members" className="flex flex-col gap-3">
      <SectionHeader
        id="members"
        title={title ?? t.trip.sections.members}
        action={
          onInvite && (
            <Button variant="link" size="sm" iconLeft={UserPlus01} onClick={onInvite} className="hit-44">
              {t.trip.addMembers}
            </Button>
          )
        }
      />
      <Card className="flex flex-col gap-3 p-4">
        {members.map((m, i) => (
          <div key={m.id} className="flex flex-col gap-3">
            {i > 0 && <Divider />}
            <MemberRow member={m} onAction={() => (m.id === ME ? navigate(`/trip/${trip.id}/dates`) : navigate(`/trip/${trip.id}/window/calendar`))} />
          </div>
        ))}
      </Card>
    </motion.section>
  )
}

function MemberRow({ member: m, onAction }: { member: TripMember; onAction: () => void }) {
  const isMe = m.id === ME
  const city = cityById(m.cityId)?.name ?? ''
  const status = m.datesSubmitted
    ? { icon: CalendarCheck01, text: t.trip.daysShort(m.dates.length) }
    : isMe
      ? { text: t.trip.addDates, tone: 'brand' as const }
      : { text: t.trip.waiting, tone: 'warning' as const }
  const Action = isMe ? Edit01 : Eye
  return (
    <div className="flex min-h-[42px] items-center gap-3">
      <Avatar name={m.name} />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-sm font-medium text-ink-title">
          {m.name}
          {isMe && ` ${t.trip.you}`}
        </span>
        <Meta items={[{ icon: Pin01, text: city }, status]} />
      </div>
      <motion.button
        type="button"
        {...press}
        onClick={onAction}
        aria-label={isMe ? t.trip.editYours : t.trip.viewDates(m.name)}
        className="hit-44 grid size-8 place-items-center text-ink-subtle"
      >
        <Action aria-hidden width={20} height={20} />
      </motion.button>
    </div>
  )
}

/** Header meta: "3 members · Lisbon, PT" on navy. */
export function TripMeta({ trip, dest }: { trip: Trip; dest?: string }) {
  return (
    <Meta tone="on-dark" size="sm" items={[{ icon: Users01, text: t.trip.members(trip.members.length) }, ...(dest ? [{ icon: Pin01, text: dest }] : [])]} />
  )
}

/* Invite sheet: NOT designed in Figma (gap). Minimal: link + copy + share, and a clearly labelled
   prototype button that simulates two friends joining. */
export function InviteSheet({ trip, open, onClose }: { trip: Trip; open: boolean; onClose: () => void }) {
  const simulate = useApp((s) => s.simulateFriendsJoin)
  const link = `https://vaiza.app/j/${trip.id.toUpperCase()}`
  const canShare = typeof navigator !== 'undefined' && 'share' in navigator
  return (
    <Sheet open={open} onClose={onClose} title={t.trip.invite.title} description={t.trip.invite.body}>
      <div className="flex flex-col gap-3">
        <p className="truncate rounded-xl border border-line-input bg-canvas px-3.5 py-2.5 text-md text-ink-secondary">{link}</p>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="md"
            iconLeft={Copy01}
            className="flex-1"
            onClick={() => {
              void navigator.clipboard?.writeText(link).catch(() => undefined)
              toast(t.trip.invite.copied)
            }}
          >
            {t.trip.invite.copy}
          </Button>
          {canShare && (
            <Button
              variant="secondary"
              size="md"
              iconLeft={Share07}
              onClick={() => void navigator.share({ title: trip.name, url: link }).catch(() => undefined)}
            >
              {t.trip.invite.share}
            </Button>
          )}
        </div>
        <Divider className="my-1" />
        <Button
          variant="tertiary"
          size="md"
          onClick={() => {
            simulate(trip.id)
            onClose()
          }}
        >
          🧪 {t.trip.invite.simulate}
        </Button>
      </div>
    </Sheet>
  )
}
