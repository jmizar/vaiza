import { forwardRef, type ComponentType, type ReactNode, type SVGProps } from 'react'
import { motion, type HTMLMotionProps } from 'motion/react'
import { cn } from '@/lib/cn'
import { press } from '@/lib/motion'

type IconType = ComponentType<SVGProps<SVGSVGElement> & { size?: number }>

/* ------------------------------------------------------------------ Button
   Figma: Buttons/Button (Untitled UI). Hierarchies used in Vaiza:
   primary = brand gradient pill · secondary = white pill with border · tertiary = text only
   link = inline text button (e.g. "Add members"). Sizes: xl (48px CTA), md (40), sm (36). */
export type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'link'
export type ButtonSize = 'xl' | 'md' | 'sm'

interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variant?: ButtonVariant
  size?: ButtonSize
  iconLeft?: IconType
  iconRight?: IconType
  loading?: boolean
  fullWidth?: boolean
  children?: ReactNode
}

const variantClass: Record<ButtonVariant, string> = {
  primary: 'bg-brand-gradient text-on-brand',
  secondary: 'bg-surface text-ink-secondary border border-line shadow-xs',
  tertiary: 'bg-transparent text-ink-tertiary',
  link: 'bg-transparent text-ink-muted !p-0 !h-auto',
}
const sizeClass: Record<ButtonSize, string> = {
  xl: 'h-12 px-[18px] gap-1.5 text-md font-semibold rounded-full',
  md: 'h-10 px-3.5 gap-1.5 text-sm font-semibold rounded-full',
  sm: 'h-9 px-3 gap-1 text-sm font-medium rounded-full',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'xl', iconLeft: L, iconRight: R, loading, fullWidth, disabled, className, children, type = 'button', ...rest },
  ref,
) {
  const off = disabled || loading
  return (
    <motion.button
      ref={ref}
      type={type}
      disabled={off}
      aria-busy={loading || undefined}
      {...(off ? {} : press)}
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center whitespace-nowrap transition-opacity duration-150',
        variantClass[variant],
        sizeClass[size],
        variant === 'link' && 'text-sm font-medium',
        fullWidth && 'w-full',
        disabled && 'opacity-50',
        variant !== 'link' && 'hit-44',
        className,
      )}
      {...rest}
    >
      <span className={cn('inline-flex items-center gap-[inherit]', loading && 'invisible')}>
        {L && <L aria-hidden width={20} height={20} className="shrink-0" />}
        {children && <span className="px-0.5">{children}</span>}
        {R && <R aria-hidden width={20} height={20} className="shrink-0" />}
      </span>
      {loading && (
        <span className="absolute inset-0 grid place-items-center" aria-label="Loading">
          <motion.span
            className="size-5 rounded-full border-2 border-current border-t-transparent opacity-80"
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
          />
        </span>
      )}
    </motion.button>
  )
})

/* ------------------------------------------------------------------ IconButton
   Figma: Icon_Button (Light / Dark). 44px glass circle used for back, close, more, filters.
   `label` is required: it's the accessible name (icon-only buttons have no visible text). */
interface IconButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  icon: IconType
  label: string
  tone?: 'light' | 'dark'
  children?: ReactNode
}

export function IconButton({ icon: I, label, tone = 'light', className, children, type = 'button', ...rest }: IconButtonProps) {
  return (
    <motion.button
      type={type}
      aria-label={children ? undefined : label}
      {...press}
      className={cn(
        'inline-flex h-11 min-w-11 items-center justify-center gap-1.5 rounded-full',
        tone === 'light' ? 'glass text-ink-secondary' : 'glass-dark text-ink-on-dark',
        children ? 'px-3.5 text-sm font-semibold' : 'w-11',
        className,
      )}
      {...rest}
    >
      <I aria-hidden width={20} height={20} className={cn('shrink-0', !!children && tone === 'light' && 'text-brand')} />
      {children}
    </motion.button>
  )
}
