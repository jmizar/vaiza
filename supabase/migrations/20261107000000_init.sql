-- Vaiza: initial schema
-- Principles
--   * Every user is an (anonymous) Supabase auth user; profile = name + home city.
--   * Row-level security on every table. Trip data is visible only to trip members.
--   * Individual budgets are private: stored apart, readable only by their owner;
--     the group only ever sees counts per tier (trip_budget_counts).
--   * State changes that need rules (create, join, lock dates, lock destination)
--     go through SECURITY DEFINER functions so they are atomic and checked server-side.
--   * Matching itself runs in the app (src/engine); the database stores inputs and decisions.

-- ---------------------------------------------------------------- types
create type public.budget_tier as enum ('budget', 'moderate', 'premium', 'no_limit');
create type public.trip_phase as enum ('dates', 'voting', 'booking');
create type public.member_role as enum ('organizer', 'member');

-- ---------------------------------------------------------------- reference data
create table public.cities (
  id text primary key,
  name text not null,
  country_code char(2) not null,
  lat double precision not null,
  lon double precision not null
);

create table public.destinations (
  id text primary key,
  name text not null,
  country text not null,
  country_code char(2) not null,
  continent text not null,
  iata char(3) not null,
  lat double precision not null,
  lon double precision not null,
  cost_per_day integer not null check (cost_per_day > 0),
  activities text[] not null default '{}',
  best_months integer[] not null default '{}'
);

-- ---------------------------------------------------------------- profiles
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 40),
  home_city_id text references public.cities (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------- trips
create table public.trips (
  id uuid primary key default gen_random_uuid(),
  -- 6-char invite code; no I, O, 0, 1 so it's easy to read out loud.
  code text not null unique check (code ~ '^[A-HJ-NP-Z2-9]{6}$'),
  name text not null check (char_length(name) between 1 and 60),
  icon text,
  organizer_id uuid not null references auth.users (id) on delete cascade,
  -- Journey A: no destination yet (dates -> vote -> booking).
  -- Journey B: destination chosen at creation (dates -> booking).
  journey char(1) not null check (journey in ('A', 'B')),
  destination_id text references public.destinations (id),
  phase public.trip_phase not null default 'dates',
  start_date date,
  end_date date,
  dates_locked_at timestamptz,
  destination_locked_at timestamptz,
  created_at timestamptz not null default now(),
  check ((start_date is null) = (end_date is null)),
  check (end_date is null or end_date >= start_date),
  check (journey = 'A' or destination_id is not null)
);

create table public.trip_members (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  -- null = proxy member: someone not on the app, entered by the organizer.
  user_id uuid references auth.users (id) on delete cascade,
  added_by uuid references auth.users (id) on delete set null,
  display_name text not null check (char_length(display_name) between 1 and 40),
  role public.member_role not null default 'member',
  -- "Traveling from" for this trip (defaults to the profile's home city).
  origin_city_id text references public.cities (id),
  available_dates date[] not null default '{}',
  max_trip_days integer check (max_trip_days between 1 and 60),
  activities text[] not null default '{}',
  dates_submitted_at timestamptz,
  vote_confirmed_at timestamptz,
  joined_at timestamptz not null default now(),
  unique (trip_id, user_id),
  check (user_id is not null or added_by is not null)
);
create index trip_members_user_idx on public.trip_members (user_id);
create index trip_members_trip_idx on public.trip_members (trip_id);

-- Private: one row per member, readable only by whoever acts for that member.
create table public.member_budgets (
  member_id uuid primary key references public.trip_members (id) on delete cascade,
  trip_id uuid not null references public.trips (id) on delete cascade,
  tier public.budget_tier not null
);

-- Destinations on the ballot: engine suggestions plus members' custom picks.
create table public.trip_candidates (
  trip_id uuid not null references public.trips (id) on delete cascade,
  destination_id text not null references public.destinations (id),
  source text not null check (source in ('suggested', 'custom')),
  match_score integer check (match_score between 0 and 100),
  added_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (trip_id, destination_id)
);

create table public.votes (
  trip_id uuid not null,
  member_id uuid not null references public.trip_members (id) on delete cascade,
  destination_id text not null,
  value smallint not null check (value in (-1, 1)),
  updated_at timestamptz not null default now(),
  primary key (member_id, destination_id),
  foreign key (trip_id, destination_id) references public.trip_candidates (trip_id, destination_id) on delete cascade
);
create index votes_trip_idx on public.votes (trip_id);

-- ---------------------------------------------------------------- helpers
-- SECURITY DEFINER so policies can call them without recursive RLS checks.
create function public.is_trip_member(p_trip uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from trip_members where trip_id = p_trip and user_id = auth.uid());
$$;

create function public.is_trip_organizer(p_trip uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from trips where id = p_trip and organizer_id = auth.uid());
$$;

-- True when the caller is this member, or is the one who added this proxy member.
create function public.can_act_for(p_member uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from trip_members
    where id = p_member
      and (user_id = auth.uid() or (user_id is null and added_by = auth.uid()))
  );
$$;

create function public.new_trip_code() returns text
language plpgsql volatile set search_path = public as $$
declare
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  bytes bytea;
  v_code text;
begin
  loop
    bytes := uuid_send(gen_random_uuid());
    v_code := '';
    for i in 0..5 loop
      v_code := v_code || substr(alphabet, (get_byte(bytes, i) % 32) + 1, 1);
    end loop;
    exit when not exists (select 1 from trips t where t.code = v_code);
  end loop;
  return v_code;
end;
$$;

-- ---------------------------------------------------------------- rules (triggers)
create function public.touch_updated_at() returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

-- Once the organizer locks dates, members can no longer change their availability.
create function public.guard_member_dates() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.available_dates is distinct from old.available_dates
     and exists (select 1 from trips where id = new.trip_id and dates_locked_at is not null) then
    raise exception 'Dates are locked for this trip' using errcode = 'P0001';
  end if;
  return new;
end;
$$;
create trigger trip_members_guard_dates before update on public.trip_members
  for each row execute function public.guard_member_dates();

-- Votes only while the trip is voting, and only for members of that same trip.
create function public.guard_vote() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from trips where id = new.trip_id and phase = 'voting') then
    raise exception 'Voting is closed for this trip' using errcode = 'P0001';
  end if;
  if not exists (select 1 from trip_members where id = new.member_id and trip_id = new.trip_id) then
    raise exception 'Member does not belong to this trip' using errcode = 'P0001';
  end if;
  new.updated_at := now();
  return new;
end;
$$;
create trigger votes_guard before insert or update on public.votes
  for each row execute function public.guard_vote();

-- ---------------------------------------------------------------- actions (RPC)
create function public.create_trip(p_name text, p_icon text default null, p_destination_id text default null)
returns public.trips
language plpgsql security definer set search_path = public as $$
declare
  me profiles;
  t trips;
begin
  select * into me from profiles where id = auth.uid();
  if me.id is null then raise exception 'Set up your profile first' using errcode = 'P0001'; end if;

  insert into trips (code, name, icon, organizer_id, journey, destination_id)
  values (new_trip_code(), p_name, p_icon, me.id,
          case when p_destination_id is null then 'A' else 'B' end, p_destination_id)
  returning * into t;

  insert into trip_members (trip_id, user_id, added_by, display_name, role, origin_city_id)
  values (t.id, me.id, me.id, me.display_name, 'organizer', me.home_city_id);
  return t;
end;
$$;

-- Join with the 6-letter code (or the invite link, which carries the code).
-- Idempotent: joining a trip you're already in just returns it.
create function public.join_trip(p_code text) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  me profiles;
  t_id uuid;
begin
  select * into me from profiles where id = auth.uid();
  if me.id is null then raise exception 'Set up your profile first' using errcode = 'P0001'; end if;
  select id into t_id from trips where code = upper(trim(p_code));
  if t_id is null then raise exception 'No trip with that code' using errcode = 'P0002'; end if;

  insert into trip_members (trip_id, user_id, added_by, display_name, origin_city_id)
  values (t_id, me.id, me.id, me.display_name, me.home_city_id)
  on conflict (trip_id, user_id) do nothing;
  return t_id;
end;
$$;

-- Organizer adds someone who isn't on the app (Figma: "Victor (proxy)").
create function public.add_proxy_member(p_trip uuid, p_name text, p_city text default null) returns uuid
language plpgsql security definer set search_path = public as $$
declare m_id uuid;
begin
  if not is_trip_organizer(p_trip) then raise exception 'Only the organizer can add members' using errcode = '42501'; end if;
  insert into trip_members (trip_id, user_id, added_by, display_name, origin_city_id)
  values (p_trip, null, auth.uid(), p_name, p_city)
  returning id into m_id;
  return m_id;
end;
$$;

-- Lock the travel window. Journey A moves to voting with the engine's suggestions
-- on the ballot; Journey B (destination known) moves straight to booking.
-- p_candidates: [{"destination_id": "lisbon-pt", "match_score": 78}, ...]
create function public.lock_dates(p_trip uuid, p_start date, p_end date, p_candidates jsonb default '[]')
returns public.trips
language plpgsql security definer set search_path = public as $$
declare t trips;
begin
  if not is_trip_organizer(p_trip) then raise exception 'Only the organizer can lock dates' using errcode = '42501'; end if;
  update trips set
    start_date = p_start,
    end_date = p_end,
    dates_locked_at = now(),
    phase = case when journey = 'A' then 'voting'::trip_phase else 'booking'::trip_phase end
  where id = p_trip and dates_locked_at is null
  returning * into t;
  if t.id is null then raise exception 'Dates are already locked' using errcode = 'P0001'; end if;

  if t.journey = 'A' then
    insert into trip_candidates (trip_id, destination_id, source, match_score, added_by)
    select p_trip, c->>'destination_id', 'suggested', (c->>'match_score')::int, auth.uid()
    from jsonb_array_elements(p_candidates) c
    on conflict do nothing;
  end if;
  return t;
end;
$$;

create function public.lock_destination(p_trip uuid, p_destination text) returns public.trips
language plpgsql security definer set search_path = public as $$
declare t trips;
begin
  if not is_trip_organizer(p_trip) then raise exception 'Only the organizer can pick the destination' using errcode = '42501'; end if;
  if not exists (select 1 from trip_candidates where trip_id = p_trip and destination_id = p_destination) then
    raise exception 'That destination is not on the ballot' using errcode = 'P0001';
  end if;
  update trips set destination_id = p_destination, destination_locked_at = now(), phase = 'booking'
  where id = p_trip and phase = 'voting'
  returning * into t;
  if t.id is null then raise exception 'This trip is not voting' using errcode = 'P0001'; end if;
  return t;
end;
$$;

-- What the group may know about budgets: how many people chose each tier, never who.
create function public.trip_budget_counts(p_trip uuid) returns jsonb
language sql stable security definer set search_path = public as $$
  select case when is_trip_member(p_trip) then
    coalesce((select jsonb_object_agg(tier, n) from (
      select tier, count(*) n from member_budgets where trip_id = p_trip group by tier
    ) s), '{}'::jsonb)
  end;
$$;

-- ---------------------------------------------------------------- row-level security
alter table public.cities enable row level security;
alter table public.destinations enable row level security;
alter table public.profiles enable row level security;
alter table public.trips enable row level security;
alter table public.trip_members enable row level security;
alter table public.member_budgets enable row level security;
alter table public.trip_candidates enable row level security;
alter table public.votes enable row level security;

create policy "reference data is public" on public.cities for select using (true);
create policy "reference data is public" on public.destinations for select using (true);

create policy "own profile" on public.profiles for all
  using (id = auth.uid()) with check (id = auth.uid());

create policy "members see their trips" on public.trips for select using (is_trip_member(id));
create policy "organizer edits trip" on public.trips for update
  using (organizer_id = auth.uid()) with check (organizer_id = auth.uid());
create policy "organizer deletes trip" on public.trips for delete using (organizer_id = auth.uid());

create policy "members see each other" on public.trip_members for select using (is_trip_member(trip_id));
create policy "edit own or own proxy" on public.trip_members for update
  using (can_act_for(id)) with check (can_act_for(id));
create policy "leave, or organizer removes" on public.trip_members for delete
  using (role <> 'organizer' and (user_id = auth.uid() or is_trip_organizer(trip_id)));

create policy "budget is private" on public.member_budgets for all
  using (can_act_for(member_id))
  with check (
    can_act_for(member_id)
    and exists (select 1 from trip_members m where m.id = member_id and m.trip_id = member_budgets.trip_id)
  );

create policy "members see ballot" on public.trip_candidates for select using (is_trip_member(trip_id));
create policy "members suggest custom destinations" on public.trip_candidates for insert
  with check (
    is_trip_member(trip_id) and added_by = auth.uid() and source = 'custom'
    and exists (select 1 from trips where id = trip_id and phase = 'voting')
  );
create policy "organizer removes candidates" on public.trip_candidates for delete using (is_trip_organizer(trip_id));

create policy "members see votes" on public.votes for select using (is_trip_member(trip_id));
create policy "vote for yourself or your proxy" on public.votes for all
  using (can_act_for(member_id)) with check (can_act_for(member_id));

-- ---------------------------------------------------------------- privileges
-- Column-level grants keep clients from editing fields that only RPCs may set
-- (phase, locks, roles, codes).
revoke all on all tables in schema public from anon, authenticated;
grant select on public.cities, public.destinations to anon, authenticated;
grant select, insert, update, delete on public.profiles to authenticated;
grant select, delete on public.trips to authenticated;
grant update (name, icon) on public.trips to authenticated;
grant select, delete on public.trip_members to authenticated;
grant update (display_name, origin_city_id, available_dates, max_trip_days, activities, dates_submitted_at, vote_confirmed_at)
  on public.trip_members to authenticated;
grant select, insert, update, delete on public.member_budgets to authenticated;
grant select, insert, delete on public.trip_candidates to authenticated;
grant select, insert, update, delete on public.votes to authenticated;

revoke execute on all functions in schema public from public, anon;
grant execute on function
  public.create_trip(text, text, text),
  public.join_trip(text),
  public.add_proxy_member(uuid, text, text),
  public.lock_dates(uuid, date, date, jsonb),
  public.lock_destination(uuid, text),
  public.trip_budget_counts(uuid),
  public.is_trip_member(uuid),
  public.is_trip_organizer(uuid),
  public.can_act_for(uuid)
to authenticated;

-- ---------------------------------------------------------------- realtime
-- Live updates on the trip screen (members joining, dates, votes). RLS still applies.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.trips, public.trip_members, public.trip_candidates, public.votes;
  end if;
end;
$$;
