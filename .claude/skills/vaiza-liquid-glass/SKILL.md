---
name: vaiza-liquid-glass
description: How Vaiza does Apple's Liquid Glass look on the web — where glass goes, the CSS recipe, the morphing motion, and the accessibility fallbacks. Use when building or reviewing nav bars, floating buttons, tab pills, segmented controls, sheets, menus or sticky CTAs.
---

# Liquid Glass for Vaiza (web / PWA)

Vaiza's Figma follows iOS 26+ Liquid Glass. We're a web app on iPhone, so every browser there is
WebKit: **true refraction (SVG displacement in `backdrop-filter`) does not render on iOS**. What we
can ship everywhere is *frosted* glass plus the *motion* that makes it feel liquid. Most of the
"liquid" comes from motion, not the material.

Sources: Apple HIG "Materials" and "Adopting Liquid Glass" (developer.apple.com), Apple Design
Resources iOS 26/27 Figma kit (use it as the visual reference, don't redraw system components).

## 1. Where glass goes (and where it never goes)
Glass is the **controls & navigation layer that floats above content**. Use sparingly: max 3–4 glass
surfaces per screen.

| Use glass | Keep solid (content layer) |
|---|---|
| Bottom tab pill (Home/Profile) + "+" FAB | Trip cards, member lists, status stepper |
| Circular top buttons: back, "…", Hint | Calendar grid, destination cards |
| Segmented control (Best matches / Group calendar) | Form fields |
| FAB menu, bottom sheets, action menus | Booking hub rows |
| Sticky bottom CTA area (scroll-edge) | Page backgrounds |
| Buttons floating over the flag/photo header (clear variant) | |

**Regular** variant (more opaque) for anything carrying text. **Clear** variant only over rich media
(flag/photo header), with a 35% dark dimming layer when the media is bright.

## 2. CSS recipe (tokens in design/tokens.json → `glass.*`)
```css
.glass {               /* solid fallback first: readable everywhere */
  background: var(--glass-fallback);            /* e.g. rgba(255,255,255,.94) */
  border: 1px solid var(--glass-stroke);        /* rgba(255,255,255,.6) */
  box-shadow: inset 0 1px 0 rgba(255,255,255,.7), var(--shadow-float);
}
@supports ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
  .glass {
    background: var(--glass-tint);              /* rgba(255,255,255,.62) regular / .18 clear */
    -webkit-backdrop-filter: blur(18px) saturate(180%);   /* literal values: Safari ignores var() here */
    backdrop-filter: blur(18px) saturate(180%);
  }
}
@media (prefers-reduced-transparency: reduce) { .glass { background: var(--glass-fallback); backdrop-filter: none; -webkit-backdrop-filter: none; } }
@media (prefers-contrast: more) { .glass { border-color: currentColor; } }
html[data-reduce-transparency] .glass { background: var(--glass-fallback); backdrop-filter: none; -webkit-backdrop-filter: none; }
```
- Safari doesn't support `prefers-reduced-transparency`, so Settings offers an in-app
  **Reduce transparency** toggle that sets `data-reduce-transparency` on `<html>`.
- Blur ≤ 20px; never animate `blur()` (drops phones to ~30fps). Animate opacity/transform only.
- Text on glass must still hit 4.5:1 against the **worst-case** content behind it: test with the
  flag header and a busy photo scrolled underneath.

## 3. Motion = the "liquid" (Motion library, presets in src/lib/motion.ts)
- **Morphing selection:** the selected tab pill / segment slides between items with a shared
  `layoutId` spring, it doesn't fade.
- **FAB → menu:** the menu grows out of the "+" button (origin at the button, `layout` animation),
  not a separate sheet from the bottom.
- **Press:** glass controls scale to ~0.96 and brighten slightly (inset highlight up) on press, spring back.
- **Sheets:** spring up; half sheets are inset from screen edges with large concentric radii; full
  height becomes more opaque.
- **Scroll edge:** content scrolling under top/bottom glass gets a soft fade/blur mask so controls stay legible.
- **Reduce Motion:** morphs become crossfades; no scale bounces.

## 4. Shapes
Concentric corners: inner radius = outer radius − padding. Capsules for buttons and pills; sheets use
the large radius (`radius.xl`) and inset 8px from the screen edges.

## 5. Review checklist
- [ ] Glass only on controls/navigation; content stays solid
- [ ] ≤ 4 glass surfaces visible at once
- [ ] Solid fallback renders correctly (no backdrop-filter support, Reduce transparency on)
- [ ] Text on glass ≥ 4.5:1 over worst-case content
- [ ] Selection morphs (layoutId), FAB menu grows from the button
- [ ] Reduce Motion: crossfades only
- [ ] No animated blur; scroll stays at 60fps on a mid-range phone
