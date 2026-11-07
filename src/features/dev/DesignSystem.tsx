import { useState, type ReactNode } from 'react'
import { ArrowRight, CalendarDate, ChevronLeft, Lightbulb04, Lock03, Plus, Sliders04 } from '@untitledui/icons'
import tokens from '../../../design/tokens.json'
import { useBack } from '@/app/stack'
import { Badge } from '@/ui/Badge'
import { Button, IconButton } from '@/ui/Button'
import { Calendar } from '@/ui/Calendar'
import { OptionCard, ToggleChip } from '@/ui/Choice'
import { SelectField, TextField } from '@/ui/Field'
import { Avatar, FeaturedIcon, Flag, TripIcon } from '@/ui/Media'
import { NavBar, Screen } from '@/ui/Screen'
import { SegmentedControl } from '@/ui/SegmentedControl'
import { StepList } from '@/ui/StepList'
import { Card, Meta, OrDivider, PageHeader, SectionHeader } from '@/ui/Surface'
import { todayISO } from '@/domain/trip'

/* In-app design system gallery: foundations (from design/tokens.json, the single source) then
   components in their states. Everything here is the real component used by the screens. */
const GROUPS: Array<{ title: string; match: (k: string) => boolean }> = [
  { title: 'Surfaces', match: (k) => /^(canvas|surface|navy|scrim|tint-)/.test(k) },
  { title: 'Ink (text & icons)', match: (k) => k.startsWith('ink') || k === 'on-brand' },
  { title: 'Lines (borders)', match: (k) => k.startsWith('line') || k === 'control-line' },
  { title: 'Brand', match: (k) => k.startsWith('brand') },
  { title: 'Status', match: (k) => /^(success|info|neutral|provisional|notice|vote|control-tint)/.test(k) },
  { title: 'Calendar & members', match: (k) => /^(day|member)/.test(k) },
]

export function DesignSystem() {
  const back = useBack('/profile')
  const colors = Object.entries(tokens.color as Record<string, string>)
  const [seg, setSeg] = useState<'a' | 'b'>('a')
  const [chip, setChip] = useState(true)
  const [card, setCard] = useState(true)
  const [month, setMonth] = useState(() => ({ year: Number(todayISO().slice(0, 4)), month: Number(todayISO().slice(5, 7)) - 1 }))
  const [days, setDays] = useState<Set<string>>(new Set())

  return (
    <Screen label="Design system" top={<NavBar left={<IconButton icon={ChevronLeft} label="Back" onClick={() => back()} />} />}>
      <div className="flex flex-col gap-10 px-4 pb-10 pt-5">
        <PageHeader
          size="md"
          title="Vaiza design system"
          subtitle="Tokens from design/tokens.json and the real components. Change a token, run npm run tokens, everything updates."
        />

        <Block title="Colour tokens (by role)">
          {GROUPS.map((g) => (
            <div key={g.title} className="flex flex-col gap-2">
              <p className="text-xs font-semibold text-ink-secondary">{g.title}</p>
              <div className="grid grid-cols-2 gap-2">
                {colors
                  .filter(([k]) => g.match(k))
                  .map(([k, v]) => (
                    <div key={k} className="flex items-center gap-2 rounded-xl bg-surface p-2 shadow-xs">
                      <span className="size-8 shrink-0 rounded-lg border border-line-subtle" style={{ background: `var(--color-${k})` }} />
                      <span className="flex min-w-0 flex-col">
                        <span className="truncate text-xs font-medium text-ink">{k}</span>
                        <span className="truncate text-xxs text-ink-muted">{v}</span>
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </Block>

        <Block title="Gradients">
          <div className="grid grid-cols-2 gap-2">
            {Object.keys(tokens.gradient).map((k) => (
              <div key={k} className="flex flex-col gap-1">
                <span className="h-12 rounded-xl border border-line-subtle" style={{ background: `var(--gradient-${k})` }} />
                <span className="text-xs text-ink-muted">{k}</span>
              </div>
            ))}
          </div>
        </Block>

        <Block title="Type">
          {Object.entries(tokens.text as Record<string, { size: string; line: string }>).map(([k, v]) => (
            <p key={k} className="text-ink" style={{ fontSize: `var(--text-${k})`, lineHeight: `var(--text-${k}--line-height)` }}>
              {k} · {v.size}/{v.line}
            </p>
          ))}
          <p className="section-label">Overline · section label</p>
        </Block>

        <Block title="Radius & shadow">
          <div className="flex flex-wrap gap-3">
            {Object.keys(tokens.radius).map((k) => (
              <span
                key={k}
                className="grid size-14 place-items-center border border-line bg-surface text-xxs text-ink-muted"
                style={{ borderRadius: `var(--radius-${k})` }}
              >
                {k}
              </span>
            ))}
          </div>
          <div className="flex flex-wrap gap-3">
            {Object.keys(tokens.shadow).map((k) => (
              <span
                key={k}
                className="grid h-14 w-24 place-items-center rounded-xl bg-surface text-xxs text-ink-muted"
                style={{ boxShadow: `var(--shadow-${k})` }}
              >
                {k}
              </span>
            ))}
          </div>
        </Block>

        <Block title="Glass (Liquid Glass approximation)">
          <div className="relative overflow-hidden rounded-3xl p-4" style={{ background: 'var(--gradient-best)' }}>
            <div className="flex items-center gap-3">
              <IconButton icon={ChevronLeft} label="Light glass" />
              <IconButton icon={Lightbulb04} label="Hint">
                Hint
              </IconButton>
              <IconButton icon={Sliders04} label="Dark glass" tone="dark" />
            </div>
          </div>
        </Block>

        <Block title="Buttons">
          <Button fullWidth>Primary xl</Button>
          <Button fullWidth iconRight={ArrowRight} disabled>
            Disabled
          </Button>
          <Button fullWidth loading>
            Loading
          </Button>
          <div className="flex flex-wrap gap-2">
            <Button size="md" iconLeft={Plus}>
              Primary md
            </Button>
            <Button variant="secondary" size="md">
              Secondary
            </Button>
            <Button variant="secondary" size="sm">
              Secondary sm
            </Button>
            <Button variant="tertiary" size="md">
              Tertiary
            </Button>
            <Button variant="link" iconLeft={Lock03}>
              Link
            </Button>
          </div>
        </Block>

        <Block title="Badges & chips">
          <div className="flex flex-wrap gap-2">
            <Badge tone="ready">Ready</Badge>
            <Badge tone="voting">Voting</Badge>
            <Badge tone="draft">Draft</Badge>
            <Badge tone="provisional" size="sm">
              Provisional
            </Badge>
            <Badge tone="best">Best</Badge>
          </div>
          <div className="flex flex-wrap gap-2">
            <ToggleChip selected={chip} onToggle={() => setChip((v) => !v)}>
              🏖️ Beach (tap)
            </ToggleChip>
            <ToggleChip selected={false} onToggle={() => undefined}>
              ⛰️ Mountain
            </ToggleChip>
          </div>
          <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="Budget">
            <OptionCard selected={card} onSelect={() => setCard(true)} symbol="$$" title="Moderate" caption="< $60-120/day" />
            <OptionCard selected={!card} onSelect={() => setCard(false)} symbol="∞" title="No limit" caption="Anything goes" />
          </div>
        </Block>

        <Block title="Fields">
          <TextField label="Your name" placeholder="What should we call you?" />
          <SelectField label="Where you’re based" placeholder="Select your city" hint="Used to calculate flight times." onPress={() => undefined} />
          <SegmentedControl
            label="Demo"
            value={seg}
            onChange={setSeg}
            options={[
              { value: 'a', label: 'Best matches' },
              { value: 'b', label: 'Group calendar' },
            ]}
          />
          <OrDivider />
        </Block>

        <Block title="Media">
          <div className="flex flex-wrap items-center gap-3">
            <Avatar name="John Smith" size={64} />
            <Avatar name="John Smith" />
            <Avatar name="Gabriel" tone="navy" />
            <TripIcon kind="v1" />
            <TripIcon kind="v3" />
            <TripIcon countryCode="PT" />
            <Flag countryCode="IS" />
            <FeaturedIcon icon={CalendarDate} />
          </div>
        </Block>

        <Block title="Cards & lists">
          <Card className="p-4">
            <SectionHeader title="Trip status" className="mb-3" />
            <StepList
              label="Demo steps"
              steps={[
                { id: '1', title: 'Trip created', detail: 'Summer escape 🌊', status: 'complete' },
                { id: '2', title: 'Dates & preferences', detail: '2 of 3 responded', status: 'current' },
                { id: '3', title: 'Voting destination', detail: 'After dates are locked', status: 'upcoming' },
              ]}
            />
          </Card>
          <Card className="p-4">
            <Meta items={[{ text: '7 days' }, { text: '3/3' }]} />
          </Card>
        </Block>

        <Block title="Calendar">
          <Card className="p-4">
            <Calendar month={month} onMonthChange={setMonth} today={todayISO()} selected={days} onChange={setDays} />
          </Card>
        </Block>
      </div>
    </Screen>
  )
}

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="section-label">{title}</h2>
      {children}
    </section>
  )
}
