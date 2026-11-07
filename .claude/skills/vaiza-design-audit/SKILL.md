---
name: vaiza-design-audit
description: Audit Vaiza designs (Figma frames in design/frames or built screens in e2e/screens) for UX, iOS/Liquid Glass fit, accessibility, missing states and group-behaviour edge cases. Use before building a flow, when Jaime asks for a review, or at each milestone.
---

# Vaiza design audit

Combines Impeccable's critique method (`.claude/skills/impeccable/reference/critique.md`: Nielsen
scoring, P0–P3 severity, personas) with what's specific to a **group** trip planner.

## Inputs
- Figma frames: `design/frames/**` (or images Jaime attached), spec: `docs/spec.md`, gaps: `docs/design-gaps.md`
- Built screens (if any): `e2e/screens/*.png`, a11y: `e2e/a11y-report.json`, `design/a11y-flags.md`

## Passes
1. **Heuristics:** score Nielsen's 10 (0–4 each, honest; most real apps land 20–32/40).
2. **Platform fit:** iOS conventions (`impeccable/reference/ios.md`) and Liquid Glass placement
   (`vaiza-liquid-glass`). Remember we ship as a PWA: no system back-swipe in standalone mode,
   no native tab bar, WebKit only on iPhone.
3. **Accessibility:** contrast (flag, never recolour), 44px targets, colour-only meaning, VoiceOver
   path through the calendar and voting, Dynamic Type/200% zoom, Reduce Motion & Transparency.
4. **States:** for every screen: empty, loading, partial (some members responded), error, offline,
   locked, and "changed since you last looked". List the ones not designed.
5. **Group stress tests** (run each through the flow and note what breaks):
   - The ghost: joins, never adds dates · the late joiner: arrives after dates lock
   - No overlap at all · 12+ people · one member flying from another continent
   - Organizer goes quiet or leaves · two people called Pablo · very long names/emoji
   - Tie vote · everyone thumbs-down everything · votes visible before you vote (herding)
   - Small group + "private" budget counts that reveal who chose what
   - Invite opened inside WhatsApp's in-app browser, then app added to Home Screen (separate storage)
   - Flaky network mid-vote · phone reinstalled (anonymous account lost)
6. **Personas:** Impeccable's Jordan (first-timer), Sam (accessibility), Casey (distracted, one hand),
   Riley (stress tester) plus Vaiza's own: **Org** (the friend who always organises, wants control
   and nudges), **Inv** (invited friend, low commitment, opened a link, will quit at any friction),
   **Prox** (organiser entering dates for a friend not on the app).

## Output
1. Heuristic table with total and band · 2. What's working (2–3) · 3. Priority issues P0–P3 with
*what / why it matters / fix / Figma frame* · 4. Missing states & screens (checklist) ·
5. Stress-test results · 6. Persona red flags · 7. Questions for Jaime as multiple choice.
Never recolour; flag. Never invent final visuals for gaps; describe what the screen must do.
