import { useMemo, useState } from 'react'
import { motion } from 'motion/react'
import { useParams } from 'react-router'
import { ChevronLeft, Lock03 } from '@untitledui/icons'
import { t } from '@/copy'
import { todayISO } from '@/domain/trip'
import { fadeUp, stagger } from '@/lib/motion'
import { useBack } from '@/app/stack'
import { useApp } from '@/store/app'
import { Button, IconButton } from '@/ui/Button'
import { Calendar, allDaysOfMonth } from '@/ui/Calendar'
import { BottomBar, NavBar, Screen } from '@/ui/Screen'
import { Card, PageHeader } from '@/ui/Surface'
import { toast } from '@/ui/Toast'
import { CountChip } from './Dates'

/* Figma: Trip_Window_Admin_Custom (1:59322 empty · 1:59450 selected). The organiser overrides
   everyone's availability. The locked window runs from the first to the last selected day. */
const monthLong = (y: number, m: number) => new Date(Date.UTC(y, m, 1)).toLocaleDateString('en-GB', { month: 'long', timeZone: 'UTC' })

export function CustomDates() {
  const { id = '' } = useParams()
  const back = useBack(`/trip/${id}`)
  const lockDates = useApp((s) => s.lockDates)
  const today = todayISO()
  const [month, setMonth] = useState({ year: Number(today.slice(0, 4)), month: Number(today.slice(5, 7)) - 1 })
  const [dates, setDates] = useState<string[]>([])
  const [locking, setLocking] = useState(false)
  const selected = useMemo(() => new Set(dates), [dates])
  const monthDays = allDaysOfMonth(month.year, month.month, today)
  const allSelected = monthDays.length > 0 && monthDays.every((d) => selected.has(d))
  const name = monthLong(month.year, month.month)

  const lock = () => {
    const sorted = [...dates].sort()
    if (!sorted.length) return
    setLocking(true)
    setTimeout(() => {
      lockDates(id, sorted[0]!, sorted[sorted.length - 1]!)
      toast(`${t.window.lockedNote} 🔒`)
      back(2)
    }, 400)
  }

  return (
    <Screen
      label={t.custom.title}
      top={<NavBar left={<IconButton icon={ChevronLeft} label={t.common.back} onClick={() => back()} />} />}
      bottom={
        <BottomBar>
          <Button fullWidth iconRight={Lock03} disabled={dates.length === 0} loading={locking} onClick={lock}>
            {t.window.lock}
          </Button>
        </BottomBar>
      }
    >
      <motion.div variants={stagger} initial="hidden" animate="show" className="flex flex-col gap-6 px-4 pt-5">
        <motion.div variants={fadeUp}>
          <PageHeader size="md" title={t.custom.title} subtitle={t.custom.subtitle} />
        </motion.div>
        <motion.div variants={fadeUp}>
          <Card className="flex flex-col gap-4 p-4">
            <Calendar month={month} onMonthChange={setMonth} today={today} selected={selected} onChange={(next) => setDates([...next].sort())} />
            <div className="flex min-h-9 items-center justify-between gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={monthDays.length === 0}
                onClick={() => {
                  const next = new Set(selected)
                  for (const d of monthDays) {
                    if (allSelected) next.delete(d)
                    else next.add(d)
                  }
                  setDates([...next].sort())
                }}
              >
                {allSelected ? t.dates.deselectAll(name) : t.dates.selectAll(name)}
              </Button>
              {dates.length > 0 && <CountChip count={dates.length} onClear={() => setDates([])} />}
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </Screen>
  )
}
