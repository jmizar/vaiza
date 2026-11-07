import { useId, type ComponentType, type InputHTMLAttributes, type ReactNode, type SVGProps } from 'react'
import { motion } from 'motion/react'
import { ChevronDown } from '@untitledui/icons'
import { cn } from '@/lib/cn'
import { press } from '@/lib/motion'

/* Figma: Input field (Untitled UI, size md). Label 14/20 medium, input 44px, radius 12,
   border line-input, text 16/24 (16px also stops iOS zooming on focus). */
const inputBox = 'flex h-11 w-full items-center gap-2 rounded-xl border border-line-input bg-surface px-3.5 text-md text-ink'

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label: string
  hint?: ReactNode
  hideLabel?: boolean
}

export function TextField({ label, hint, hideLabel, className, id, ...rest }: TextFieldProps) {
  const auto = useId()
  const inputId = id ?? auto
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={inputId} className={cn('text-sm font-medium text-ink', hideLabel && 'sr-only')}>
        {label}
      </label>
      <input
        id={inputId}
        aria-describedby={hint ? `${inputId}-hint` : undefined}
        className={cn(inputBox, 'outline-none placeholder:text-ink-placeholder focus:border-line-focus focus:shadow-focus')}
        {...rest}
      />
      {hint && (
        <p id={`${inputId}-hint`} className="text-sm text-ink-tertiary">
          {hint}
        </p>
      )}
    </div>
  )
}

/* Looks like an input, behaves like a button that opens a picker (city, destination). */
export function SelectField({
  label,
  value,
  placeholder,
  hint,
  onPress,
  optional,
}: {
  label: string
  value?: string
  placeholder: string
  hint?: ReactNode
  onPress: () => void
  optional?: string
}) {
  const id = useId()
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span id={`${id}-label`} className="text-sm font-medium text-ink">
          {label}
        </span>
        {optional && <span className="text-xs text-ink-muted">{optional}</span>}
      </div>
      <motion.button
        type="button"
        {...press}
        onClick={onPress}
        aria-labelledby={`${id}-label ${id}-value`}
        aria-describedby={hint ? `${id}-hint` : undefined}
        className={cn(inputBox, 'justify-between text-left')}
      >
        <span id={`${id}-value`} className={cn('truncate', !value && 'text-ink-placeholder')}>
          {value || placeholder}
        </span>
        <ChevronDown aria-hidden width={16} height={16} className="shrink-0 text-ink-subtle" />
      </motion.button>
      {hint && (
        <p id={`${id}-hint`} className="text-sm text-ink-tertiary">
          {hint}
        </p>
      )}
    </div>
  )
}

/* Figma: rows inside the "Traveling from / Maximum trip duration" card. */
export function SelectRow({
  label,
  value,
  placeholder = 'Select',
  onPress,
  icon: Icon,
}: {
  label: string
  value?: string
  placeholder?: string
  onPress: () => void
  icon?: ComponentType<SVGProps<SVGSVGElement>>
}) {
  return (
    <motion.button type="button" {...press} onClick={onPress} className="flex min-h-11 w-full items-center justify-between gap-4 text-left">
      <span className="flex items-center gap-2 text-sm text-ink-tertiary">
        {Icon && <Icon aria-hidden width={16} height={16} />}
        {label}
      </span>
      <span className={cn('flex items-center gap-1 text-sm', value ? 'font-semibold text-ink' : 'text-ink-subtle')}>
        {value || placeholder}
        <ChevronDown aria-hidden width={16} height={16} className="text-ink-subtle" />
      </span>
    </motion.button>
  )
}
