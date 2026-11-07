import { useState, type ReactNode } from 'react'
import { motion } from 'motion/react'
import { useNavigate } from 'react-router'
import { Link03, PlusCircle } from '@untitledui/icons'
import { t } from '@/copy'
import { press } from '@/lib/motion'
import { Sheet } from '@/ui/Sheet'
import { Screen } from '@/ui/Screen'
import { TabBar, type Tab } from '@/ui/TabBar'

/* Sheets and menus go in `overlay` (outside the scroll area), never inside children.
   Shared frame of the two tab screens (Home, Profile): content + floating glass tab bar + FAB.
   FAB opens the "Start a new trip / Join" glass menu (Figma Home_FAB_Open 1:45477). */
export function TabScreen({ tab, label, children, overlay }: { tab: Tab; label: string; children: ReactNode; overlay?: ReactNode }) {
  const navigate = useNavigate()
  const [menu, setMenu] = useState(false)
  const go = (to: string) => {
    setMenu(false)
    void navigate(to)
  }
  return (
    <>
      <Screen
        label={label}
        bottom={
          <TabBar
            active={tab}
            labels={t.tabs}
            fabLabel={t.home.fab.menu}
            fabOpen={menu}
            onFab={() => setMenu((v) => !v)}
            onTab={(next) => next !== tab && void navigate(next === 'home' ? '/home' : '/profile', { replace: true })}
          />
        }
      >
        {children}
      </Screen>
      <Sheet variant="menu" open={menu} onClose={() => setMenu(false)} title={t.home.fab.menu}>
        <MenuItem icon={<PlusCircle aria-hidden width={24} height={24} />} title={t.home.fab.newTitle} body={t.home.fab.newBody} onPress={() => go('/new')} />
        <MenuItem icon={<Link03 aria-hidden width={24} height={24} />} title={t.home.fab.joinTitle} body={t.home.fab.joinBody} onPress={() => go('/join')} />
      </Sheet>
      {overlay}
    </>
  )
}

function MenuItem({ icon, title, body, onPress }: { icon: ReactNode; title: string; body: string; onPress: () => void }) {
  return (
    <motion.button
      type="button"
      role="menuitem"
      onClick={onPress}
      {...press}
      className="flex w-full items-center gap-3 rounded-2xl px-2.5 py-2 text-left active:bg-surface-pressed"
    >
      <span className="text-brand">{icon}</span>
      <span className="flex flex-col">
        <span className="text-md font-medium text-ink">{title}</span>
        <span className="text-xs text-ink-muted">{body}</span>
      </span>
    </motion.button>
  )
}
