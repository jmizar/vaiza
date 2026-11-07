# Vaiza

Plan group trips without the WhatsApp chaos. Everyone adds their dates, home city and what they
like; Vaiza finds when the whole group can travel, suggests where, the group votes, then books.

**Status:** M0 foundations: engine, database, design pipeline, CI. Screens start in M1.

| Where | What |
|---|---|
| `docs/spec.md` | What we're building, screen by screen |
| `docs/setup.md` | One-time account steps |
| `docs/design-gaps.md` | Screens still to design in Figma |
| `design/` | Tokens, Figma exports, accessibility flags |
| `src/engine` | Matching: date windows, upgrade hints, destination scores, vote tally |
| `supabase/` | Database schema, security rules, seed data |
| `CLAUDE.md` | Rules and review loop for the AI agents that build this |

```bash
npm install
npm run dev     # app at http://localhost:5173
npm run check   # types, lint, unit tests, database rules
npm run e2e     # flows, accessibility scan, review screenshots
```
