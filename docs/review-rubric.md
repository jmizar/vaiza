# Review rubric

Used by the `design-reviewer` and `qa-a11y-reviewer` agents. Each finding gets a severity:
**blocker** (must fix before Jaime sees it), **major** (fix this round), **minor** (list in card).

## Design fidelity (screenshot vs Figma frame, same viewport 393×852)
1. Layout & hierarchy: same sections, order, alignment, grouping.
2. Spacing: paddings and gaps within ±2px of Figma; consistent 4px grid.
3. Typography: correct token (display/title/headline/body/callout/footnote/caption/overline), weight, case.
4. Colour: only tokens; matches the frame (contrast issues are flagged, never "fixed").
5. Components: same states (default, pressed, selected, disabled, loading, error, empty).
6. Copy: exact text from Figma; no lorem; no placeholder left unless it's a listed gap.
7. Icons & imagery: correct icon, size, alignment; illustrations crisp at 2× / 3×.
8. Motion: entering content fades up; pressables scale; loading states present; sheets spring.
   Nothing animates when Reduce Motion is on.

## Accessibility (WCAG 2.2 AA)
1. axe: zero violations except `color-contrast` on flagged brand pairings (listed in `design/a11y-flags.md`).
2. Every interactive element: role, accessible name, state (`aria-pressed`, `aria-selected`, `aria-expanded`).
3. Touch targets ≥ 44×44px (visual can be smaller; hit area can't).
4. Focus: visible, logical order, trapped in sheets/dialogs, restored on close.
5. Meaning never by colour alone (calendar, chips, votes).
6. Text zoom 200%: no clipped or overlapping text.
7. Forms: labels, errors announced (`aria-live`), keyboard "Go" submits.

## Behaviour
1. Matches `docs/spec.md` acceptance criteria for the screen.
2. Uses `src/engine` for any matching logic.
3. Works offline-gracefully (clear error, retry), and with slow network (loading states).
4. No console errors.

## Output format
```
VERDICT: pass | fail
blockers: n · majors: n · minors: n
- [blocker] <screen> · <what's wrong> · <expected (Figma/spec)> · <suggested fix>
```
