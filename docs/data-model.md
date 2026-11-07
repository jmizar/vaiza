# Data model

Migration: `supabase/migrations/20261107000000_init.sql` · Rules tested by `npm run test:db`.

```
auth.users (Supabase, anonymous)
  └─ profiles            name, home city
trips                    code (6 chars), name, icon, organizer, journey A|B, phase, locked dates/destination
  ├─ trip_members        user or proxy, role, origin city, available_dates[], max_trip_days, activities[]
  │    └─ member_budgets PRIVATE: tier (only the member / proxy's organizer can read)
  ├─ trip_candidates     the ballot: engine suggestions + custom picks, match score
  └─ votes               member × destination, +1 / -1
cities, destinations     reference data (seeded from src/data)
```

## Trip phases
| `phase` | Journey A | Journey B | Home chip |
|---|---|---|---|
| `dates` | collecting dates & preferences | collecting dates & preferences | **Draft** if only the organizer and no dates yet, else **Voting** |
| `voting` | dates locked, voting destination | (not used) | **Voting** |
| `booking` | destination locked | dates locked | **Ready** |

## Who can do what (enforced in the database)
| Action | Who | How |
|---|---|---|
| Create trip | anyone with a profile | `create_trip()` |
| Join | anyone with the code | `join_trip(code)` (idempotent) |
| See trip, members, ballot, votes | trip members only | RLS |
| Edit dates/preferences | yourself; organizer for proxies | RLS + column grants; blocked after dates lock |
| Read a budget | yourself; organizer for proxies | RLS; group sees `trip_budget_counts()` |
| Add proxy member | organizer | `add_proxy_member()` |
| Lock dates (+ put suggestions on the ballot) | organizer | `lock_dates()` |
| Suggest a custom destination | members, while voting | RLS insert |
| Vote | yourself / your proxy, while voting | RLS + trigger |
| Lock destination | organizer, from the ballot | `lock_destination()` |
| Leave / remove member | member leaves; organizer removes (not themselves) | RLS |

## Not yet
Affiliate click log, price snapshots (v1.1), notifications, invite-code rate limiting.
