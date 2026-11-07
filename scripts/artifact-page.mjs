// Turns dist-artifact/index.html into an artifact page: the host adds <!doctype>, <html>, <head>
// and <body>, so we keep only what goes inside (title, styles, root, script).
import { readFileSync, writeFileSync } from 'node:fs'
const html = readFileSync('dist-artifact/index.html', 'utf8')
const head = html.match(/<head>([\s\S]*)<\/head>/)?.[1] ?? ''
const body = html.match(/<body>([\s\S]*)<\/body>/)?.[1] ?? ''
const keep = head
  .replace(/<meta charset[^>]*>/i, '')
  .replace(/<meta name="viewport"[^>]*>/i, '')
  .replace(/<title>[^<]*<\/title>/i, '')
const scripts = [...keep.matchAll(/<script[\s\S]*?<\/script>/g)].map((m) => m[0])
const rest = keep.replace(/<script[\s\S]*?<\/script>/g, '')
const page = `<title>Vaiza Prototype</title>\n${rest.trim()}\n${body.trim()}\n${scripts.join('\n')}\n`
writeFileSync('dist-artifact/vaiza-prototype.html', page)
console.log(`dist-artifact/vaiza-prototype.html ${(page.length / 1024).toFixed(0)} KB`)
