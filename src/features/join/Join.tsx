import { useState } from 'react'
import { motion } from 'motion/react'
import { useNavigate } from 'react-router'
import { ChevronLeft } from '@untitledui/icons'
import { t } from '@/copy'
import { fadeUp, stagger } from '@/lib/motion'
import { useBack } from '@/app/stack'
import { useApp } from '@/store/app'
import { Button, IconButton } from '@/ui/Button'
import { TextField } from '@/ui/Field'
import { BottomBar, NavBar, Screen } from '@/ui/Screen'
import { PageHeader } from '@/ui/Surface'

/* GAP: "Join an existing trip" isn't designed. Placeholder built only from existing components.
   In the prototype any code joins the demo trip "Morocco Getaway" (loads demo data if needed). */
export function Join() {
  const navigate = useNavigate()
  const back = useBack('/home')
  const trips = useApp((s) => s.trips)
  const loadDemo = useApp((s) => s.loadDemo)
  const [code, setCode] = useState('')

  const join = () => {
    if (!trips.some((tr) => tr.id === 'morocco')) loadDemo()
    void navigate('/trip/morocco', { replace: true })
  }

  return (
    <Screen
      label={t.join.title}
      top={<NavBar left={<IconButton icon={ChevronLeft} label={t.common.back} onClick={() => back()} />} />}
      bottom={
        <BottomBar>
          <Button fullWidth disabled={code.trim().length < 3} onClick={join}>
            {t.join.cta}
          </Button>
        </BottomBar>
      }
    >
      <motion.form
        variants={stagger}
        initial="hidden"
        animate="show"
        onSubmit={(e) => {
          e.preventDefault()
          if (code.trim().length >= 3) join()
        }}
        className="flex flex-col gap-6 px-4 pt-5"
      >
        <motion.div variants={fadeUp}>
          <PageHeader size="md" title={t.join.title} subtitle={t.join.subtitle} />
        </motion.div>
        <motion.div variants={fadeUp} className="flex flex-col gap-3">
          <TextField
            label={t.join.field}
            placeholder={t.join.placeholder}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            autoCapitalize="off"
            autoCorrect="off"
            enterKeyHint="go"
          />
          <p className="rounded-xl border border-dashed border-line px-3.5 py-2.5 text-xs text-ink-muted">{t.join.demo}</p>
        </motion.div>
      </motion.form>
    </Screen>
  )
}
