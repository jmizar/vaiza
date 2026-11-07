# Setup steps for Jaime

One-time clicks, in the order they're needed. Keys and tokens go into GitHub's
**Settings → Secrets and variables → Actions**, never into chat or code.

## Now (M0)
1. **Give Claude access to the repo**: claude.ai → Settings → Connectors → GitHub → Connect →
   sign in as `jmizar` → allow the `vaiza` repository.
2. **Figma token** (lets the sync job read your file, ~3 of the ~20 free monthly calls per sync):
   - Figma → your avatar → Settings → Security → *Personal access tokens* → Generate new token.
   - Name it `vaiza-sync`, scope **File content: Read-only**, longest expiry offered. Copy it.
   - GitHub repo → Settings → Secrets and variables → Actions → **Secrets** → New: `FIGMA_TOKEN` = the token.
   - Same page → **Variables** tab → New: `FIGMA_FILE_KEY` = the part of your Figma file URL
     after `/design/` (e.g. `figma.com/design/AbC123xyz/Vaiza` → `AbC123xyz`).
   - Then say "Figma ready". Claude triggers the sync; the frames appear in `design/frames/`.

## M1: preview link
3. **Cloudflare Pages** (free hosting + a preview link for every change):
   dash.cloudflare.com → Workers & Pages → Create → Pages → Connect to Git → `jmizar/vaiza`.
   Build command `npm run build`, output directory `dist`, environment variable `NODE_VERSION` = `22`.

## M2: real data
4. **Supabase** (free): supabase.com → New project (region: EU West) → Authentication →
   Sign In / Providers → enable **Anonymous sign-ins**. Then share with Claude, via GitHub secrets:
   `SUPABASE_ACCESS_TOKEN` (Account → Access tokens) and add the repo variable `SUPABASE_URL` +
   secret `SUPABASE_ANON_KEY` (Project Settings → API). Claude runs the migrations.

## Later (stores, M5)
5. Travelpayouts account (free) for flight prices and partner links.
6. Apple Developer Program (US$99/yr) and Google Play Console (US$25 once), only when going to the stores.
