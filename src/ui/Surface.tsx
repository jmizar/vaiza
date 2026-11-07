import type { ComponentType, HTMLAttributes, ReactNode, SVGProps } from 'react'
import { cn } from '@/lib/cn'

/* ------------------------------------------------------------------ Card
   Figma: white container, radius 20 (lists, stepper) or 16 (travel window), shadow "card". */
export function Card({ className, radius = '3xl', ...rest }: HTMLAttributes<HTMLDivElement> & { radius?: '2xl' | '3xl' }) {
  return <div className={cn('bg-surface shadow-card', radius === '3xl' ? 'rounded-3xl' : 'rounded-2xl', className)} {...rest} />
}

/* ------------------------------------------------------------------ SectionHeader
   Figma: "Header" rows (MY TRIPS, TRIP STATUS, MEMBERS + "Add members"). */
export function SectionHeader({ title, hint, action, id, className }: { title: string; hint?: string; action?: ReactNode; id?: string; className?: string }) {
  return (
    <div className={cn('flex min-h-5 items-center justify-between gap-2.5', className)}>
      <h2 id={id} className="section-label">
        {title}
        {hint && <span className="ml-1.5 font-normal normal-case tracking-normal">{hint}</span>}
      </h2>
      {action}
    </div>
  )
}

/** Figma: Content divider (1px, line-divider). */
export function Divider({ className }: { className?: string }) {
  return <hr className={cn('h-px w-full border-0 bg-line-divider', className)} />
}

/** "or" divider used between choices (Trip window, Voting). */
export function OrDivider({ label = 'or' }: { label?: string }) {
  return (
    <div className="flex items-center gap-2" role="separator">
      <span className="h-px flex-1 bg-line-subtle" />
      <span className="text-sm text-ink-muted">{label}</span>
      <span className="h-px flex-1 bg-line-subtle" />
    </div>
  )
}

/* ------------------------------------------------------------------ PageHeader
   Title + supporting text. Sizes from Figma: display-sm (30/38) for top-level screens,
   xl (20/30) for flow steps. */
export function PageHeader({
  eyebrow,
  title,
  subtitle,
  size = 'lg',
  className,
}: {
  eyebrow?: string
  title: ReactNode
  subtitle?: ReactNode
  size?: 'lg' | 'md'
  className?: string
}) {
  return (
    <header className={cn('flex flex-col gap-1', className)}>
      {eyebrow && <p className="text-md text-ink">{eyebrow}</p>}
      <h1 className={cn('font-medium text-ink', size === 'lg' ? 'text-display-sm' : 'text-xl')}>{title}</h1>
      {subtitle && <p className={cn(size === 'lg' ? 'text-md text-ink' : 'text-sm text-ink-muted')}>{subtitle}</p>}
    </header>
  )
}

/* ------------------------------------------------------------------ Meta row
   Small icon + text pairs separated by "·" (members, city, days). */
type IconType = ComponentType<SVGProps<SVGSVGElement>>
export function Meta({
  items,
  tone = 'muted',
  size = 'xs',
}: {
  items: Array<{ icon?: IconType; text: ReactNode; tone?: 'brand' | 'warning' }>
  tone?: 'muted' | 'on-dark'
  size?: 'xs' | 'sm'
}) {
  return (
    <span
      className={cn(
        'flex flex-wrap items-center gap-x-1',
        size === 'xs' ? 'text-xs font-medium' : 'text-sm font-medium',
        tone === 'on-dark' ? 'text-ink-on-dark-muted' : 'text-ink-muted',
      )}
    >
      {items.map((it, i) => (
        <span key={i} className="inline-flex items-center gap-1">
          {i > 0 && (
            <span aria-hidden className={cn('font-bold', tone === 'on-dark' ? 'text-ink-on-dark-muted' : 'text-ink-subtle')}>
              ·
            </span>
          )}
          {it.icon && <it.icon aria-hidden width={size === 'xs' ? 12 : 16} height={size === 'xs' ? 12 : 16} />}
          <span className={cn(it.tone === 'brand' && 'text-ink-brand', it.tone === 'warning' && 'text-ink-warning')}>{it.text}</span>
        </span>
      ))}
    </span>
  )
}
