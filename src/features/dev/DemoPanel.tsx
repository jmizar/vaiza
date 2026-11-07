import { useNavigate } from 'react-router'
import { useApp } from '@/store/app'
import { cn } from '@/lib/cn'
import { SegmentedControl } from '@/ui/SegmentedControl'

/* Prototype controls (not part of the product). Desktop: a panel beside the phone.
   Phone: Profile → gear. Lets Jaime jump to any state without clicking through every flow. */
const JUMPS: Array<{ label: string; to: string; demo?: boolean }> = [
  { label: 'Splash → onboarding', to: '/' },
  { label: 'Onboarding', to: '/onboarding' },
  { label: 'Set up profile', to: '/setup' },
  { label: 'Home', to: '/home' },
  { label: 'Profile', to: '/profile' },
  { label: 'Start a new trip', to: '/new' },
  { label: 'Join a trip (gap)', to: '/join' },
  { label: 'Trip · collecting dates (Verano 2027)', to: '/trip/verano', demo: true },
  { label: 'Trip · only you (Pablo’s Birthday)', to: '/trip/birthday', demo: true },
  { label: 'Travel window (Verano 2027)', to: '/trip/verano/window', demo: true },
  { label: 'Trip · voting (Morocco)', to: '/trip/morocco', demo: true },
  { label: 'Vote list (Morocco)', to: '/trip/morocco/vote', demo: true },
  { label: 'Trip hub (Lisbon)', to: '/trip/lisbon', demo: true },
  { label: 'Design system', to: '/design' },
]

export function DemoControls({ onDone, pathname }: { onDone?: () => void; pathname?: string }) {
  const navigate = useNavigate()
  const s = useApp()
  const tripId = (pathname ?? '').match(/^\/trip\/([^/]+)/)?.[1]
  const trip = s.trips.find((tr) => tr.id === tripId)
  const go = (to: string, demo?: boolean) => {
    if (demo && !s.trips.some((tr) => to.includes(`/trip/${tr.id}`))) s.loadDemo()
    onDone?.()
    void navigate(to)
  }

  return (
    <div className="flex flex-col gap-5 text-sm">
      <Group title="Data">
        <Row>
          <Small
            onClick={() => {
              s.loadDemo()
              onDone?.()
              void navigate('/home', { replace: true })
            }}
          >
            Load demo trips
          </Small>
          <Small
            onClick={() => {
              s.reset()
              onDone?.()
              void navigate('/', { replace: true })
            }}
          >
            Reset (first launch)
          </Small>
        </Row>
      </Group>

      <Group title="View trips as">
        <SegmentedControl
          label="View trips as"
          value={s.viewAs}
          onChange={s.setViewAs}
          options={[
            { value: 'auto', label: 'Real role' },
            { value: 'organizer', label: 'Organiser' },
            { value: 'member', label: 'Member' },
          ]}
        />
      </Group>

      {trip && (
        <Group title={`Simulate friends · ${trip.name}`}>
          <Row>
            <Small onClick={() => s.simulateFriendsJoin(trip.id)}>Join</Small>
            <Small onClick={() => s.simulateFriendsDates(trip.id)}>Add dates</Small>
            <Small onClick={() => s.simulateFriendsVote(trip.id)} disabled={!trip.candidates.length}>
              Vote
            </Small>
          </Row>
        </Group>
      )}

      <Group title="Jump to">
        <ul className="flex flex-col">
          {JUMPS.map((j) => (
            <li key={j.to}>
              <button type="button" onClick={() => go(j.to, j.demo)} className="flex min-h-10 w-full items-center text-left text-ink-secondary hover:text-ink">
                {j.label}
              </button>
            </li>
          ))}
        </ul>
      </Group>

      <Group title="Accessibility">
        <label className="flex min-h-10 items-center gap-2 text-ink-secondary">
          <input
            type="checkbox"
            checked={s.reduceTransparency}
            onChange={(e) => s.setReduceTransparency(e.target.checked)}
            className="size-4 accent-[var(--color-brand)]"
          />
          Reduce transparency (glass → solid)
        </label>
      </Group>
    </div>
  )
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="section-label">{title}</h3>
      {children}
    </section>
  )
}
const Row = ({ children }: { children: React.ReactNode }) => <div className="flex flex-wrap gap-2">{children}</div>
function Small({ children, onClick, disabled }: { children: React.ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn('min-h-9 rounded-full border border-line bg-surface px-3 text-sm font-medium text-ink-secondary shadow-xs', disabled && 'opacity-50')}
    >
      {children}
    </button>
  )
}

/** Desktop only (≥1100px): fixed beside the phone, outside the app. */
export function DemoPanel({ pathname }: { pathname: string }) {
  return (
    <aside aria-label="Prototype controls" className="absolute inset-y-0 left-[calc(50%+244px)] hidden w-[300px] overflow-y-auto py-10 pr-6 min-[1100px]:block">
      <p className="mb-1 text-md font-semibold text-ink">Vaiza prototype</p>
      <p className="mb-6 text-xs text-ink-muted">Controls for reviewing. Not part of the app. On a phone: Profile → gear.</p>
      <DemoControls pathname={pathname} />
    </aside>
  )
}
