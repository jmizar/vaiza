import { useState } from 'react'
import { motion } from 'motion/react'
import tokens from '../../../design/tokens.json'
import { fadeUp, press, stagger } from '@/lib/motion'

// Static class names so Tailwind can see them at build time.
const typeScale = [
  ['display', 'text-display'],
  ['title', 'text-title'],
  ['headline', 'text-headline'],
  ['body', 'text-body'],
  ['callout', 'text-callout'],
  ['footnote', 'text-footnote'],
  ['caption', 'text-caption'],
  ['overline', 'text-overline uppercase'],
] as const

/**
 * Dev-only page: renders the design tokens from code so they can be checked
 * against Figma. Becomes the "theme lab" for trying colour variants in previews.
 */
export function Foundations() {
  const [loading, setLoading] = useState(false)
  const colors = Object.entries(tokens.color)

  return (
    <main className="px-5 py-8">
      <p className="text-overline uppercase text-ink-3">Vaiza · foundations</p>
      <h1 className="mt-2 text-display">Design tokens</h1>
      <p className="mt-2 text-body text-ink-2">
        Rendered from <code>design/tokens.json</code>. Approximate until the Figma sync runs.
      </p>

      <section aria-labelledby="colors" className="mt-8">
        <h2 id="colors" className="text-overline uppercase text-ink-3">
          Colour
        </h2>
        <motion.ul
          className="mt-3 grid grid-cols-3 gap-3"
          variants={stagger}
          initial="hidden"
          animate="show"
        >
          {colors.map(([name, value]) => (
            <motion.li key={name} variants={fadeUp} className="rounded-md bg-surface p-2 shadow-card">
              <div className="h-10 rounded-sm border border-border" style={{ background: value }} />
              <p className="mt-2 text-caption font-medium">{name}</p>
              <p className="text-caption text-ink-3">{value}</p>
            </motion.li>
          ))}
        </motion.ul>
      </section>

      <section aria-labelledby="type" className="mt-8">
        <h2 id="type" className="text-overline uppercase text-ink-3">
          Type
        </h2>
        <div className="mt-3 space-y-2 rounded-lg bg-surface p-4 shadow-card">
          {typeScale.map(([k, cls]) => (
            <p key={k} className={cls}>
              {k} · Where do you wanna go?
            </p>
          ))}
        </div>
      </section>

      <section aria-labelledby="components" className="mt-8">
        <h2 id="components" className="text-overline uppercase text-ink-3">
          Primary button
        </h2>
        <motion.button
          type="button"
          {...press}
          onClick={() => {
            setLoading(true)
            setTimeout(() => setLoading(false), 1200)
          }}
          aria-busy={loading}
          className="mt-3 flex h-12 w-full items-center justify-center rounded-pill text-callout font-semibold text-on-brand"
          style={{ background: 'var(--gradient-brand)' }}
        >
          {loading ? (
            <motion.span
              aria-label="Loading"
              className="h-5 w-5 rounded-full border-2 border-white/40 border-t-white"
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
            />
          ) : (
            'Save details'
          )}
        </motion.button>
        <p className="mt-2 text-footnote text-ink-3">
          Contrast flagged (2.9:1), see design/a11y-flags.md. Colour unchanged by design decision.
        </p>
      </section>
    </main>
  )
}
