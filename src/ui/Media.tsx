import type { ComponentType, SVGProps } from 'react'
import { cn } from '@/lib/cn'
import { flagUrl } from '@/data/flags'
import tripFlag from '@/assets/trip-icons/flag.svg'
import v1 from '@/assets/trip-icons/variant-1.svg'
import v2 from '@/assets/trip-icons/variant-2.svg'
import v3 from '@/assets/trip-icons/variant-3.svg'
import v4 from '@/assets/trip-icons/variant-4.svg'
import v5 from '@/assets/trip-icons/variant-5.svg'
import v6 from '@/assets/trip-icons/variant-6.svg'

type IconType = ComponentType<SVGProps<SVGSVGElement>>

/* ------------------------------------------------------------------ Avatar
   Figma: "User" squares. Member rows: 40px, radius 12, gray-modern 500 · hint sheet: navy ·
   profile: 64px brand gradient · stacked pairs: 25px radius 8. */
export function Avatar({ name, size = 40, tone = 'muted', className }: { name: string; size?: 25 | 40 | 64; tone?: 'muted' | 'navy'; className?: string }) {
  const initials = name
    .replace(/\(.*?\)/g, '')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('')
  return (
    <span
      aria-hidden
      style={{ width: size, height: size }}
      className={cn(
        'grid shrink-0 place-items-center font-semibold text-on-brand',
        size === 64 && 'rounded-[18px] bg-brand-gradient text-display-xs',
        size === 40 && 'rounded-xl text-md',
        size === 25 && 'rounded-lg text-xxs',
        size !== 64 && (tone === 'navy' ? 'bg-navy' : 'bg-ink-muted'),
        className,
      )}
    >
      {initials}
    </span>
  )
}

/* ------------------------------------------------------------------ TripIcon
   Figma: Trip_Icon (56px tile). Variant 1–6 = icon on orange tint; "flag" = destination flag. */
export type TripIconKind = 'v1' | 'v2' | 'v3' | 'v4' | 'v5' | 'v6'
const tripIcons: Record<TripIconKind, string> = { v1, v2, v3, v4, v5, v6 }

export function TripIcon({ kind, countryCode, size = 56 }: { kind?: TripIconKind; countryCode?: string; size?: number }) {
  if (countryCode) {
    return (
      <span aria-hidden style={{ width: size, height: size }} className="relative grid shrink-0 place-items-center rounded-2xl bg-tint-neutral">
        <img src={flagUrl(countryCode)} alt="" className="size-[calc(100%-6px)] rounded-xl object-cover" />
      </span>
    )
  }
  return <img aria-hidden src={tripIcons[kind ?? 'v1'] ?? tripFlag} alt="" style={{ width: size, height: size }} className="shrink-0" />
}

/* ------------------------------------------------------------------ Flag
   Square country flag (flag-icons, MIT). Figma: Country Flag "Square". */
export function Flag({ countryCode, size = 40, className }: { countryCode: string; size?: number; className?: string }) {
  return (
    <img
      aria-hidden
      src={flagUrl(countryCode)}
      alt=""
      style={{ width: size, height: size }}
      className={cn('shrink-0 rounded-[10px] object-cover shadow-xs', className)}
    />
  )
}

/* ------------------------------------------------------------------ FeaturedIcon
   Figma: gradient tile with a white icon (travel window), or orange-tint tile (empty state). */
export function FeaturedIcon({ icon: I, tone = 'brand', size = 44 }: { icon: IconType; tone?: 'brand' | 'tint' | 'neutral'; size?: 44 | 56 }) {
  return (
    <span
      aria-hidden
      style={{ width: size, height: size }}
      className={cn(
        'grid shrink-0 place-items-center',
        size === 56 ? 'rounded-[14px]' : 'rounded-xl',
        tone === 'brand' && 'bg-brand-gradient text-on-brand',
        tone === 'tint' && 'bg-tint-brand text-brand',
        tone === 'neutral' && 'bg-tint-neutral text-ink-muted',
      )}
    >
      <I width={size === 44 ? 22 : 26} height={size === 44 ? 22 : 26} />
    </span>
  )
}
