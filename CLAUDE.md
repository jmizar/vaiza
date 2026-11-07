# Vaiza: rules for AI agents working in this repo

Vaiza (formerly "eTrip") is a group trip planner: each friend adds their dates, home city and
preferences; Vaiza finds when everyone can travel, suggests where, the group votes, then books.

**Roles.** Jaime is the product designer and director: he decides, designs in Figma and judges
the output. Claude builds everything (front end, back end, tests) and reviews its own work through
the loop below before anything reaches Jaime. Keep Jaime's effort minimal: never ask him something
the spec, the Figma frames or a sensible default already answers.

## Read first
- `docs/spec.md`: screens, behaviour and acceptance criteria per milestone (the source of truth)
- `docs/decisions.md`: decisions already made; don't relitigate them
- `docs/data-model.md`: database tables, phases, security rules
- `design/frames/`: Figma exports (PNG) per screen; `design/figma/`: raw Figma data and index
- `docs/design-gaps.md`: screens not designed yet; don't invent final visuals for them, build
  a clearly marked placeholder and list it in the review card

## Hard rules
1. **Colours are Jaime's decisions.** Never change a colour value to fix contrast. Flag it in
   `design/a11y-flags.md` (`npm run contrast`). Tokens live only in `design/tokens.json`; run
   `npm run tokens` after editing it. No hard-coded hex values in components.
2. **Accessibility (WCAG 2.2 AA) for everything except flagged brand colours:** semantic HTML,
   labels on every control, 44×44px minimum touch targets (use padding/hit areas, not visual
   changes), never colour alone for meaning, visible focus, respects text zoom, Reduce Motion.
   ESLint `jsx-a11y` (strict) must pass.
3. **Motion only via `src/lib/motion.ts` presets** (fadeUp, stagger, pop, press, sheet). Every
   screen gets: entering content fades up, pressables scale on tap, buttons show a loading state
   while awaiting, sheets spring. `<MotionConfig reducedMotion="user">` is already global.
4. **Matching logic lives in `src/engine`** (pure functions, unit-tested). UI never re-implements it.
5. **Privacy:** individual budgets are never sent to other members. Use `trip_budget_counts`.
6. **Database changes = new migration file** in `supabase/migrations/` with RLS + explicit grants
   (tables are not auto-granted), plus scenarios in `scripts/test-db.mjs`.
7. **Copy:** all user-facing strings in one place per feature (prep for Spanish). English first.
8. Mobile-first: design width 375–430px; on desktop the app sits in a centred 480px column.

## Commands
- `npm run dev`: local app · `npm run build`: production build
- `npm run check`: typecheck + lint + unit tests + database rules (must pass before any PR)
- `npm run e2e`: Playwright flows + axe scan + screenshots (`e2e/screens/`)
- `npm run tokens` / `npm run contrast` / `npm run seed`: regenerate tokens, a11y flags, DB seed

## The loop (per milestone or screen)
1. **Build** from `docs/spec.md` + the Figma frame for that screen.
2. **Gates:** `npm run check` and `npm run e2e` green.
3. **Design review:** run the `design-reviewer` agent (fresh context) on the new screenshots vs
   the Figma frames; then `qa-a11y-reviewer`. Fix and repeat, max 3 rounds.
4. **Review card for Jaime:** preview link, side-by-side screenshots, what changed, decisions he
   must make (as multiple-choice), known gaps. Only real decisions reach him.

## Stack
React 19 + TypeScript + Vite · Tailwind v4 (tokens via `@theme`) · Motion · React Router ·
TanStack Query · Zustand · React Aria (accessible primitives) · Supabase (Postgres + RLS,
anonymous auth, Realtime) · Vitest · Playwright + axe · Cloudflare Pages · Capacitor later for stores.
