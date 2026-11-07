// Runs the real migration + seed in an in-memory Postgres (PGlite) with small
// stand-ins for Supabase's auth schema, then checks the security rules and RPCs
// by acting as different users. No Supabase account needed.
// Run: npm run test:db
import { readFileSync, readdirSync } from 'node:fs'
import { PGlite } from '@electric-sql/pglite'

const db = new PGlite()
const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8')

// --- Supabase stand-ins ------------------------------------------------------
await db.exec(`
  create role anon nologin; create role authenticated nologin; create role service_role nologin;
  create schema auth;
  grant usage on schema auth to anon, authenticated;
  create table auth.users (id uuid primary key);
  create function auth.uid() returns uuid language sql stable as $$
    select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
  $$;
  grant usage on schema public to anon, authenticated;
  create publication supabase_realtime;
`)

for (const f of readdirSync(new URL('../supabase/migrations', import.meta.url)).sort()) {
  await db.exec(read(`supabase/migrations/${f}`))
}
await db.exec(read('supabase/seed.sql'))

// --- helpers -----------------------------------------------------------------
const users = {
  john: '11111111-1111-1111-1111-111111111111',
  gabriel: '22222222-2222-2222-2222-222222222222',
  stranger: '33333333-3333-3333-3333-333333333333',
}
for (const id of Object.values(users)) await db.query('insert into auth.users (id) values ($1)', [id])

/** Run SQL as a signed-in user, with RLS and grants applied. */
async function as(user, sql, params = []) {
  return db.transaction(async (tx) => {
    await tx.exec(`set local role authenticated; select set_config('request.jwt.claim.sub', '${users[user]}', true);`)
    return (await tx.query(sql, params)).rows
  })
}

let passed = 0
const failures = []
async function check(name, fn) {
  try {
    await fn()
    passed++
    console.log(`  ✓ ${name}`)
  } catch (e) {
    failures.push(name)
    console.log(`  ✗ ${name}\n      ${e.message}`)
  }
}
const eq = (a, b, msg = '') => {
  if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(`${msg} expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`)
}
async function rejects(fn, pattern) {
  try {
    await fn()
  } catch (e) {
    if (pattern && !pattern.test(e.message)) throw new Error(`wrong error: ${e.message}`)
    return
  }
  throw new Error('expected an error, got none')
}

// --- scenarios ---------------------------------------------------------------
console.log('Database rules')
let trip
let gabrielMember

await check('reference data is readable', async () => {
  const [{ n }] = await as('stranger', 'select count(*)::int n from destinations')
  if (n < 40) throw new Error(`only ${n} destinations`)
})

await check('profiles: create own, cannot create for someone else', async () => {
  await as('john', `insert into profiles (id, display_name, home_city_id) values ($1, 'John', 'london-gb')`, [users.john])
  await as('gabriel', `insert into profiles (id, display_name, home_city_id) values ($1, 'Gabriel', 'a-coruna-es')`, [users.gabriel])
  await as('stranger', `insert into profiles (id, display_name) values ($1, 'Mallory')`, [users.stranger])
  await rejects(() => as('stranger', `insert into profiles (id, display_name) values ($1, 'x')`, [users.gabriel]), /row-level security/)
})

await check('create_trip makes the caller organizer with a readable 6-char code', async () => {
  ;[trip] = await as('john', `select * from create_trip('Summer escape', 'wave', null)`)
  if (!/^[A-HJ-NP-Z2-9]{6}$/.test(trip.code)) throw new Error(`bad code ${trip.code}`)
  eq(trip.journey, 'A')
  const members = await as('john', 'select role, display_name, origin_city_id from trip_members where trip_id = $1', [trip.id])
  eq(members, [{ role: 'organizer', display_name: 'John', origin_city_id: 'london-gb' }])
})

await check('outsiders cannot see the trip', async () => {
  eq(await as('gabriel', 'select id from trips where id = $1', [trip.id]), [])
})

await check('join_trip with the code (lowercase, spaces ok), idempotent', async () => {
  await as('gabriel', 'select join_trip($1)', [` ${trip.code.toLowerCase()} `])
  await as('gabriel', 'select join_trip($1)', [trip.code])
  const rows = await as('gabriel', 'select display_name from trip_members where trip_id = $1 order by joined_at', [trip.id])
  eq(rows.map((r) => r.display_name), ['John', 'Gabriel'])
  ;[gabrielMember] = await as('gabriel', 'select id from trip_members where trip_id = $1 and user_id = $2', [trip.id, users.gabriel])
})

await check('wrong code gives a clear error', async () => {
  await rejects(() => as('stranger', `select join_trip('ZZZZZZ')`), /No trip with that code/)
})

await check('members edit their own dates, not others', async () => {
  await as('gabriel', `update trip_members set available_dates = '{2026-07-12,2026-07-13}', dates_submitted_at = now() where id = $1`, [gabrielMember.id])
  const changed = await as('john', `update trip_members set available_dates = '{}' where id = $1 returning id`, [gabrielMember.id])
  eq(changed, [], 'organizer update of another member')
  const [{ n }] = await as('john', 'select cardinality(available_dates) n from trip_members where id = $1', [gabrielMember.id])
  eq(n, 2, 'gabriel dates visible to the group and unchanged')
})

await check('clients cannot change locked fields directly (phase, role)', async () => {
  await rejects(() => as('john', `update trips set phase = 'booking' where id = $1`, [trip.id]), /permission denied/)
  await rejects(() => as('gabriel', `update trip_members set role = 'organizer' where id = $1`, [gabrielMember.id]), /permission denied/)
})

await check('budgets are private; the group only sees counts', async () => {
  await as('gabriel', `insert into member_budgets (member_id, trip_id, tier) values ($1, $2, 'budget')`, [gabrielMember.id, trip.id])
  const [johnMember] = await as('john', 'select id from trip_members where trip_id = $1 and user_id = $2', [trip.id, users.john])
  await as('john', `insert into member_budgets (member_id, trip_id, tier) values ($1, $2, 'moderate')`, [johnMember.id, trip.id])
  eq(await as('john', 'select tier from member_budgets where member_id = $1', [gabrielMember.id]), [], 'john reading gabriel budget')
  const [{ c }] = await as('john', 'select trip_budget_counts($1) c', [trip.id])
  eq(c, { budget: 1, moderate: 1 })
  const [{ c: none }] = await as('stranger', 'select trip_budget_counts($1) c', [trip.id])
  eq(none, null, 'stranger counts')
})

await check('organizer adds a proxy member and can act for them', async () => {
  const [{ add_proxy_member: proxyId }] = await as('john', `select add_proxy_member($1, 'Victor', 'barcelona-es')`, [trip.id])
  const updated = await as('john', `update trip_members set available_dates = '{2026-07-12}' where id = $1 returning id`, [proxyId])
  eq(updated.length, 1, 'organizer edits proxy dates')
  await rejects(() => as('gabriel', `select add_proxy_member($1, 'Eve', null)`, [trip.id]), /Only the organizer/)
})

await check('only the organizer locks dates; Journey A moves to voting with candidates', async () => {
  await rejects(() => as('gabriel', `select lock_dates($1, '2026-07-12', '2026-07-18', '[]')`, [trip.id]), /Only the organizer/)
  const [t] = await as('john', `select * from lock_dates($1, '2026-07-12', '2026-07-18', $2)`, [
    trip.id,
    JSON.stringify([{ destination_id: 'lisbon-pt', match_score: 78 }, { destination_id: 'krakow-pl', match_score: 66 }]),
  ])
  eq([t.phase, t.start_date instanceof Date || typeof t.start_date === 'string'], ['voting', true])
  const ballot = await as('gabriel', 'select destination_id from trip_candidates where trip_id = $1 order by match_score desc', [trip.id])
  eq(ballot.map((b) => b.destination_id), ['lisbon-pt', 'krakow-pl'])
})

await check('dates cannot change after they are locked', async () => {
  await rejects(() => as('gabriel', `update trip_members set available_dates = '{2026-08-01}' where id = $1`, [gabrielMember.id]), /Dates are locked/)
})

await check('members add a custom destination while voting', async () => {
  await as('gabriel', `insert into trip_candidates (trip_id, destination_id, source, added_by) values ($1, 'reykjavik-is', 'custom', $2)`, [trip.id, users.gabriel])
})

await check('votes: for yourself only, visible to the group', async () => {
  await as('gabriel', `insert into votes (trip_id, member_id, destination_id, value) values ($1, $2, 'lisbon-pt', 1)`, [trip.id, gabrielMember.id])
  await rejects(() => as('john', `insert into votes (trip_id, member_id, destination_id, value) values ($1, $2, 'krakow-pl', -1)`, [trip.id, gabrielMember.id]), /row-level security/)
  const seen = await as('john', 'select value from votes where trip_id = $1', [trip.id])
  eq(seen, [{ value: 1 }])
  await rejects(() => as('gabriel', `insert into votes (trip_id, member_id, destination_id, value) values ($1, $2, 'paris-fr', 1)`, [trip.id, gabrielMember.id]), /foreign key/)
})

await check('only the organizer locks the destination, and only from the ballot', async () => {
  await rejects(() => as('gabriel', `select lock_destination($1, 'lisbon-pt')`, [trip.id]), /Only the organizer/)
  await rejects(() => as('john', `select lock_destination($1, 'paris-fr')`, [trip.id]), /not on the ballot/)
  const [t] = await as('john', `select * from lock_destination($1, 'lisbon-pt')`, [trip.id])
  eq([t.phase, t.destination_id], ['booking', 'lisbon-pt'])
})

await check('voting closes once the destination is locked', async () => {
  await rejects(() => as('gabriel', `update votes set value = -1 where member_id = $1`, [gabrielMember.id]), /Voting is closed/)
})

await check('Journey B: destination known at creation goes dates -> booking', async () => {
  const [t] = await as('gabriel', `select * from create_trip('Lisbon trip', null, 'lisbon-pt')`)
  eq(t.journey, 'B')
  const [locked] = await as('gabriel', `select * from lock_dates($1, '2026-09-01', '2026-09-04')`, [t.id])
  eq(locked.phase, 'booking')
})

await check('members can leave; organizer cannot be removed', async () => {
  await as('gabriel', 'delete from trip_members where id = $1', [gabrielMember.id])
  const [org] = await as('john', `select id from trip_members where trip_id = $1 and role = 'organizer'`, [trip.id])
  const removed = await as('john', 'delete from trip_members where id = $1 returning id', [org.id])
  eq(removed, [], 'organizer self-removal')
})

console.log(`\n${passed} passed, ${failures.length} failed`)
process.exit(failures.length ? 1 : 0)
