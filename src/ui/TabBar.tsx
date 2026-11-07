import { motion } from 'motion/react'
import { Plus } from '@untitledui/icons'
import { cn } from '@/lib/cn'
import { press, spring } from '@/lib/motion'

/* Figma: Bottom Nav_Default = "Action Bar_Brand" (glass pill: Home / Profile) + "FAB" (60px glass "+").
   The selected tab sits in a tinted capsule that slides between tabs (shared layoutId). */
export type Tab = 'home' | 'profile'

/* Figma tab icons: home-line and user-02 (Untitled UI), drawn filled when selected. */
const HOUSE =
  'M11.018 2.764 4.235 8.039c-.453.353-.68.53-.843.75a2 2 0 0 0-.318.65C3 9.704 3 9.991 3 10.565V17.8c0 1.12 0 1.68.218 2.108a2 2 0 0 0 .874.874C4.52 21 5.08 21 6.2 21h11.6c1.12 0 1.68 0 2.108-.218a2 2 0 0 0 .874-.874C21 19.48 21 18.92 21 17.8v-7.235c0-.574 0-.861-.074-1.126a2.002 2.002 0 0 0-.318-.65c-.163-.22-.39-.397-.843-.75l-6.783-5.275c-.351-.273-.527-.41-.72-.462a1 1 0 0 0-.523 0c-.194.052-.37.189-.721.462Z'
const PERSON =
  'M12 15c-3.17 0-5.99 1.53-7.784 3.906-.386.511-.58.767-.573 1.112.005.267.172.604.382.769.272.213.649.213 1.402.213h13.146c.753 0 1.13 0 1.402-.213.21-.165.377-.502.382-.769.006-.345-.187-.6-.573-1.112C17.989 16.531 15.17 15 12 15Zm0-3a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Z'

function TabIcon({ tab, active, className }: { tab: Tab; active: boolean; className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" width={24} height={24} className={className} fill="none" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d={tab === 'home' ? HOUSE : PERSON} stroke="currentColor" fill={active ? 'currentColor' : 'none'} />
      {tab === 'home' && <path d="M8 17h8" stroke={active ? 'var(--color-on-brand)' : 'currentColor'} />}
    </svg>
  )
}

export function TabBar({
  active,
  onTab,
  onFab,
  fabOpen,
  labels,
  fabLabel,
}: {
  active: Tab
  onTab: (t: Tab) => void
  onFab: () => void
  fabOpen?: boolean
  labels: Record<Tab, string>
  /** Accessible name of the "+" button. */
  fabLabel: string
}) {
  const tabs = [
    { id: 'home' as const, label: labels.home },
    { id: 'profile' as const, label: labels.profile },
  ]
  return (
    <div className="flex items-center justify-between px-5 pt-px">
      <nav aria-label="Main" className="glass flex h-[60px] items-center rounded-[56px] p-[4.5px]">
        {tabs.map((t) => {
          const on = t.id === active
          return (
            <motion.button
              key={t.id}
              type="button"
              aria-current={on ? 'page' : undefined}
              onClick={() => onTab(t.id)}
              {...press}
              className="relative flex h-[51px] w-[77px] flex-col items-center justify-center gap-0.5 rounded-[26px]"
            >
              {on && (
                <motion.span
                  layoutId="tab-pill"
                  transition={spring}
                  className="absolute inset-0 rounded-[26px] bg-[var(--glass-tint-selected)] shadow-tab-active"
                />
              )}
              <TabIcon tab={t.id} active={on} className={cn('relative', on ? 'text-ink-brand' : 'text-ink-title')} />
              <span className={cn('relative text-xxs font-medium', on ? 'text-ink-brand' : 'text-ink-title')}>{t.label}</span>
            </motion.button>
          )
        })}
      </nav>
      <motion.button
        type="button"
        aria-label={fabLabel}
        aria-expanded={fabOpen}
        aria-haspopup="menu"
        onClick={onFab}
        {...press}
        className="glass grid size-[60px] place-items-center rounded-full text-ink-title"
      >
        <motion.span animate={{ rotate: fabOpen ? 45 : 0 }} transition={spring} className="grid place-items-center">
          <Plus aria-hidden width={28} height={28} />
        </motion.span>
      </motion.button>
    </div>
  )
}
