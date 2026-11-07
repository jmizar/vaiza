# Decisions

Newest first. Each entry: decision, why, and who decided. Don't relitigate without new information.

| Date | Decision | Why | By |
|---|---|---|---|
| 2026-11-06 | **No colour changes; only flag contrast issues.** | Brand gradient is a design decision; Jaime will redesign if needed. Tokens make swapping trivial. | Jaime |
| 2026-11-06 | Web app (PWA) first; Capacitor wrap for App Store / Play later. | Free iPhone testing (Add to Home Screen); invitees join from a link without installing; one codebase. | Jaime + Claude |
| 2026-11-06 | Claude builds front end and back end. Nobody else on the team. | | Jaime |
| 2026-11-06 | Anonymous accounts (name + city), no email at sign-up. | Matches Figma set-up flow; zero friction. Optional sign-in later. | Claude (default) |
| 2026-11-06 | Supabase free tier; Cloudflare Pages hosting. | Free; Cloudflare allows commercial use. | Claude |
| 2026-11-06 | Individual budgets private; group sees counts per tier. | Beta guide promise: "Nobody sees your individual budget". | Docs |
| 2026-11-06 | Matching runs client-side in `src/engine`; DB stores inputs + decisions. | Fast iteration, unit-testable, no server cost. Budgets reach it only as counts. | Claude |
| 2026-11-06 | Preferences = budget + activities only (climate/regions from old prototype dropped). | Follows Figma; season fit is inferred from travel dates. To confirm with Jaime. | Claude (assumed) |
| 2026-11-06 | Destination costs stored in EUR; display currency TBD (Figma shows $). | Target market is Europe. To confirm with Jaime. | Open |
| 2026-11-06 | English first, Spanish before friends beta. | First testers are Spanish-speaking. | Claude (default) |
| 2026-11-06 | Swipe voting, live prices, push, AI itineraries after MVP. | Figma marks list view as MVP; keep scope tight. | Figma / plan |
