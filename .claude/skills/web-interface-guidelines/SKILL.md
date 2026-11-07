---
name: web-interface-guidelines
description: Review Vaiza UI code against Vercel's Web Interface Guidelines (accessibility, focus, forms, animation, touch, performance). Use when reviewing or finishing any React screen or component.
---

# Web Interface Guidelines (local snapshot)

Rules live in [guidelines.md](guidelines.md): a snapshot of
`vercel-labs/web-interface-guidelines` (MIT, see LICENSE), taken 2026-11-07 so reviews don't depend
on fetching instructions from the internet at run time.

1. Read `guidelines.md`.
2. Read the files in scope (default: files changed on the current branch, `git diff --name-only main`).
3. Report violations in the terse `file:line` format the guidelines specify.

Vaiza overrides:
- Colour contrast on brand tokens listed in `design/a11y-flags.md` is a known design decision: list it, don't fix it.
- Motion must come from `src/lib/motion.ts`; flag hand-rolled animations.
- Touch targets: 44×44px minimum (stricter than the guidelines' default where they differ).
