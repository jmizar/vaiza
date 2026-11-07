// Prints a compact layout tree of a Figma node from design/figma/file.json (no API calls).
// Use it to read exact sizes, auto-layout, colours, radii, effects and copy while building.
//   node scripts/figma-inspect.mjs <nodeId> [depth=6]
//   node scripts/figma-inspect.mjs --find "<name substring>"
import { readFileSync } from 'node:fs'

const file = JSON.parse(readFileSync(new URL('../design/figma/file.json', import.meta.url), 'utf8'))
const comps = file.components ?? {}
const [arg, depthArg] = process.argv.slice(2)

const hex = (c, o = 1) => {
  const a = (c.a ?? 1) * o
  const h = '#' + ['r', 'g', 'b'].map((k) => Math.round(c[k] * 255).toString(16).padStart(2, '0')).join('').toUpperCase()
  return a >= 0.999 ? h : `${h}/${Math.round(a * 100)}%`
}
const paint = (p) => {
  if (p.visible === false) return null
  if (p.type === 'SOLID') return hex(p.color, p.opacity ?? 1)
  if (p.type?.startsWith('GRADIENT')) return `grad(${p.gradientStops.map((s) => `${hex(s.color)} ${Math.round(s.position * 100)}%`).join(', ')})`
  if (p.type === 'IMAGE') return 'image'
  return p.type
}
const r = (n) => Math.round(n * 10) / 10

function describe(n) {
  const bb = n.absoluteBoundingBox
  const parts = [`${n.type.toLowerCase()} "${n.name}"`, n.id]
  if (bb) parts.push(`${r(bb.width)}x${r(bb.height)}`)
  if (n.type === 'INSTANCE' && comps[n.componentId]) parts.push(`<${comps[n.componentId].name}>`)
  if (n.layoutMode && n.layoutMode !== 'NONE') {
    const pad = [n.paddingTop, n.paddingRight, n.paddingBottom, n.paddingLeft].map((v) => v ?? 0).join('/')
    parts.push(`${n.layoutMode === 'VERTICAL' ? 'col' : 'row'} gap=${n.itemSpacing ?? 0} pad=${pad} ${n.primaryAxisAlignItems ?? ''}/${n.counterAxisAlignItems ?? ''}`)
  }
  if (n.layoutSizingHorizontal) parts.push(`w:${n.layoutSizingHorizontal.toLowerCase()} h:${(n.layoutSizingVertical ?? '').toLowerCase()}`)
  const fills = (n.fills ?? []).map(paint).filter(Boolean)
  if (fills.length && n.type !== 'TEXT') parts.push(`bg=${fills.join('+')}`)
  const strokes = (n.strokes ?? []).map(paint).filter(Boolean)
  if (strokes.length) parts.push(`border=${n.strokeWeight ?? 1}px ${strokes.join('+')}`)
  if (n.cornerRadius) parts.push(`r=${r(n.cornerRadius)}`)
  if (n.rectangleCornerRadii && !n.cornerRadius) parts.push(`r=${n.rectangleCornerRadii.map(r).join('/')}`)
  for (const e of n.effects ?? []) {
    if (e.visible === false) continue
    if (e.type === 'DROP_SHADOW' || e.type === 'INNER_SHADOW')
      parts.push(`${e.type === 'INNER_SHADOW' ? 'inset ' : ''}shadow(${r(e.offset.x)} ${r(e.offset.y)} ${r(e.radius)} ${r(e.spread ?? 0)} ${hex(e.color)})`)
    else if (e.type === 'BACKGROUND_BLUR') parts.push(`backdrop-blur(${r(e.radius)})`)
    else parts.push(e.type.toLowerCase())
  }
  if (n.opacity !== undefined && n.opacity < 1) parts.push(`opacity=${r(n.opacity)}`)
  if (n.type === 'TEXT') {
    const s = n.style ?? {}
    parts.push(`"${n.characters.replace(/\n/g, '\\n').slice(0, 80)}" ${s.fontSize}/${r(s.lineHeightPx ?? 0)} w${s.fontWeight} ${fills.join('+')}${s.textCase ? ' ' + s.textCase : ''}${s.letterSpacing ? ' ls' + r(s.letterSpacing) : ''}`)
  }
  if (n.visible === false) parts.push('(hidden)')
  return parts.join('  ')
}

function find(node, id) {
  if (node.id === id) return node
  for (const c of node.children ?? []) {
    const hit = find(c, id)
    if (hit) return hit
  }
  return null
}

function print(n, depth, ind = '') {
  console.log(ind + describe(n))
  if (depth <= 0 || n.type === 'INSTANCE' && depth < 3) return
  for (const c of n.children ?? []) print(c, depth - 1, ind + '  ')
}

if (arg === '--find') {
  const q = depthArg.toLowerCase()
  const walk = (n) => {
    if (n.name?.toLowerCase().includes(q)) console.log(describe(n))
    for (const c of n.children ?? []) walk(c)
  }
  walk(file.document)
} else {
  const node = find(file.document, arg.replace('-', ':'))
  if (!node) throw new Error(`No node ${arg}`)
  print(node, Number(depthArg ?? 6))
}
