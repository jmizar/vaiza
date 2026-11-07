import { defineConfig, mergeConfig } from 'vite'
import { viteSingleFile } from 'vite-plugin-singlefile'
import base from './vite.config'

// One self-contained HTML file (JS, CSS, fonts, SVGs inlined) for sharing the prototype as a
// claude.ai artifact or any static host. `npm run build:artifact` → dist-artifact/.
export default mergeConfig(
  base,
  defineConfig({
    plugins: [viteSingleFile()],
    define: { 'import.meta.env.VITE_EMBED': JSON.stringify('1') },
    build: { outDir: 'dist-artifact', assetsInlineLimit: 100_000_000, cssCodeSplit: false },
  }),
)
