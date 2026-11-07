// Pulls the Vaiza Figma file into the repo using the Figma REST API, in as few
// rate-limited calls as possible (Figma Starter: ~20 "Tier 1" calls per month).
//
//   1 call   GET /v1/files/:key        → design/figma/file.json (whole structure + styles)
//   1-3 calls GET /v1/images/:key       → design/frames/<page>/<screen>.png (every phone frame, @2x)
//
// Env: FIGMA_TOKEN (personal access token, read-only), FIGMA_FILE_KEY (from the file URL)
// Optional: FIGMA_PAGES="Page 1,Flows" (limit pages) · FIGMA_SCALE=2 · FIGMA_MAX_CALLS=6
// Run locally: FIGMA_TOKEN=... FIGMA_FILE_KEY=... npm run figma:sync  (normally run by GitHub Actions)
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'

const token = process.env.FIGMA_TOKEN
const fileKey = process.env.FIGMA_FILE_KEY
if (!token || !fileKey) {
  console.error('Missing FIGMA_TOKEN or FIGMA_FILE_KEY')
  process.exit(1)
}
const scale = Number(process.env.FIGMA_SCALE ?? 2)
const maxCalls = Number(process.env.FIGMA_MAX_CALLS ?? 6)
const pageFilter = (process.env.FIGMA_PAGES ?? '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean)
const BATCH = 40
let tier1Calls = 0

async function figma(path) {
  tier1Calls++
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(`https://api.figma.com/v1${path}`, { headers: { 'X-Figma-Token': token } })
    if (res.status === 429) {
      const wait = Number(res.headers.get('retry-after') ?? 60)
      console.warn(`Rate limited by Figma; retry-after ${wait}s`)
      if (wait > 300) throw new Error(`Figma monthly limit likely reached (retry-after ${wait}s)`)
      await new Promise((r) => setTimeout(r, wait * 1000))
      continue
    }
    if (!res.ok) throw new Error(`Figma ${res.status}: ${await res.text()}`)
    return res.json()
  }
  throw new Error('Figma kept rate limiting')
}

const slug = (s) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'untitled'

// A "screen" is a phone-sized frame, wherever it sits (top level, inside sections or boards).
const isPhone = (n) =>
  (n.type === 'FRAME' || n.type === 'COMPONENT' || n.type === 'INSTANCE') &&
  n.absoluteBoundingBox &&
  n.absoluteBoundingBox.width >= 340 && n.absoluteBoundingBox.width <= 440 &&
  n.absoluteBoundingBox.height >= 640 && n.absoluteBoundingBox.height <= 2400

function collectScreens(node, page, board, out, depth = 0) {
  for (const child of node.children ?? []) {
    if (isPhone(child)) {
      out.push({ id: child.id, name: child.name, page, board, width: child.absoluteBoundingBox.width, height: child.absoluteBoundingBox.height })
    } else if (node.type === 'SECTION' && child.name !== 'Screen Label' && child.absoluteBoundingBox &&
      ['FRAME', 'COMPONENT', 'COMPONENT_SET', 'INSTANCE', 'RECTANGLE', 'GROUP'].includes(child.type) &&
      child.absoluteBoundingBox.width >= 40) {
      out.push({ id: child.id, name: child.name, page, board: `${board}/reference`, width: child.absoluteBoundingBox.width, height: child.absoluteBoundingBox.height })
    } else if (depth < 4 && child.children) {
      const nextBoard = child.type === 'SECTION' || (depth === 0 && child.type === 'FRAME') ? child.name : board
      collectScreens(child, page, nextBoard, out, depth + 1)
    }
  }
}

function findNode(node, id) {
  if (node.id === id) return node
  for (const c of node.children ?? []) {
    const hit = findNode(c, id)
    if (hit) return hit
  }
  return null
}

const reuse = (() => { try { return readFileSync('design/sync-request.txt', 'utf8').includes('reuse-file') } catch { return false } })()
const file = reuse ? JSON.parse(readFileSync('design/figma/file.json', 'utf8')) : await figma(`/files/${fileKey}?geometry=omit`)
if (reuse) console.log('Reusing committed design/figma/file.json')
mkdirSync('design/figma', { recursive: true })
writeFileSync('design/figma/file.json', JSON.stringify(file))

const screens = []
for (const page of file.document.children) {
  if (pageFilter.length && !pageFilter.includes(page.name.toLowerCase())) continue
  collectScreens(page, page.name, page.name, screens)
}
const imageCalls = Math.ceil(screens.length / BATCH)
console.log(`${screens.length} screens found on ${new Set(screens.map((s) => s.page)).size} page(s); ${imageCalls} image call(s) needed`)
if (tier1Calls + imageCalls > maxCalls) {
  throw new Error(`Would use ${tier1Calls + imageCalls} Figma calls (limit ${maxCalls}). Set FIGMA_PAGES or FIGMA_MAX_CALLS.`)
}

if (process.env.FIGMA_DRY) {
  for (const s of screens) console.log(`${s.board} | ${s.name} | ${s.id} | ${Math.round(s.width)}x${Math.round(s.height)}`)
  process.exit(0)
}
rmSync('design/frames', { recursive: true, force: true })
const index = []
for (let i = 0; i < screens.length; i += BATCH) {
  const batch = screens.slice(i, i + BATCH)
  const { images } = await figma(`/images/${fileKey}?ids=${batch.map((s) => s.id).join(',')}&format=png&scale=${scale}`)
  for (const s of batch) {
    const url = images[s.id]
    if (!url) continue
    const dir = `design/frames/${slug(s.board)}`
    const path = `${dir}/${slug(s.name)}--${s.id.replace(/[:;]/g, '-')}.png`
    mkdirSync(dir, { recursive: true })
    const png = Buffer.from(await (await fetch(url)).arrayBuffer()) // CDN download: not rate limited
    writeFileSync(path, png)
    index.push({ ...s, file: path })
  }
}

// Optional SVG export of specific nodes (illustrations, icons, flags): one extra call.
let svgIds = (process.env.FIGMA_SVG_IDS ?? '').split(',').map((s) => s.trim()).filter(Boolean)
try {
  const req = readFileSync('design/sync-request.txt', 'utf8')
  const line = req.split('\n').find((l) => l.startsWith('svg:'))
  if (line) svgIds = [...new Set([...svgIds, ...line.slice(4).split(',').map((s) => s.trim()).filter(Boolean)])]
} catch { /* no request file */ }
const assets = []
if (svgIds.length && tier1Calls < maxCalls) {
  const { images } = await figma(`/images/${fileKey}?ids=${svgIds.join(',')}&format=svg&svg_include_id=false&svg_outline_text=false`)
  mkdirSync('design/assets', { recursive: true })
  for (const id of svgIds) {
    if (!images[id]) continue
    const node = findNode(file.document, id)
    const path = `design/assets/${slug(node?.name ?? 'asset')}--${id.replace(/[:;]/g, '-')}.svg`
    writeFileSync(path, await (await fetch(images[id])).text())
    assets.push({ id, name: node?.name, file: path })
  }
}

writeFileSync(
  'design/figma/index.json',
  JSON.stringify({ fileKey, fileName: file.name, lastModified: file.lastModified, syncedAt: new Date().toISOString(), screens: index, assets }, null, 2),
)
console.log(`Saved ${index.length} screens. Figma Tier-1 calls used: ${tier1Calls}`)
