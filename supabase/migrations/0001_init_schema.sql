-- Community Pulse Map — initial schema
-- Matches the data model agreed in the handoff doc (section 5).
-- No auth for MVP: session id lives in localStorage on the client, so RLS
-- below is intentionally permissive (open read/write). Tighten before any
-- real deployment beyond the hackathon demo.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- suburbs: seeded once, cached vibe vectors + blurb. Not computed live.
-- ---------------------------------------------------------------------------
create table if not exists suburbs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  centroid_lat double precision not null,
  centroid_lng double precision not null,
  boundary jsonb, -- optional GeoJSON polygon, not required for MVP matching
  food_score smallint not null default 0 check (food_score between 0 and 100),
  nightlife_score smallint not null default 0 check (nightlife_score between 0 and 100),
  shopping_score smallint not null default 0 check (shopping_score between 0 and 100),
  activities_score smallint not null default 0 check (activities_score between 0 and 100),
  sightseeing_score smallint not null default 0 check (sightseeing_score between 0 and 100),
  summary_text text, -- one-line "known for" blurb
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- events: seeded from real APIs + hand-entered NGO/historical entries
-- ---------------------------------------------------------------------------
create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  suburb_id uuid references suburbs(id) on delete set null,
  title text not null,
  category text not null check (
    category in ('concert', 'festival', 'charity', 'ngo', 'historical', 'cultural')
  ),
  description text,
  lat double precision not null,
  lng double precision not null,
  address text,
  energy_tag text check (energy_tag in ('low', 'medium', 'high')),
  social_tag text check (social_tag in ('solo', 'small_group', 'crowd')),
  wheelchair_accessible boolean not null default false,
  sensory_friendly boolean not null default false,
  multilingual boolean not null default false,
  start_time timestamptz,
  end_time timestamptz,
  image_url text,
  source text not null default 'seeded' check (
    source in ('eventbrite', 'council', 'seeded')
  ),
  created_at timestamptz not null default now()
);

create index if not exists events_suburb_id_idx on events (suburb_id);
create index if not exists events_category_idx on events (category);
create index if not exists events_start_time_idx on events (start_time);

-- ---------------------------------------------------------------------------
-- checkins: live presence, drives the buzz/pulse visualization. Realtime ON.
-- ---------------------------------------------------------------------------
create table if not exists checkins (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  session_id text not null,
  created_at timestamptz not null default now()
);

create index if not exists checkins_event_id_idx on checkins (event_id);
create index if not exists checkins_created_at_idx on checkins (created_at);

-- ---------------------------------------------------------------------------
-- going: pre-commitment / "I'm planning to go". Realtime ON.
-- ---------------------------------------------------------------------------
create table if not exists going (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  session_id text not null,
  created_at timestamptz not null default now(),
  unique (event_id, session_id) -- one "going" per session per event
);

create index if not exists going_event_id_idx on going (event_id);

-- ---------------------------------------------------------------------------
-- Row Level Security — open policies for the no-auth MVP
-- ---------------------------------------------------------------------------
alter table suburbs enable row level security;
alter table events enable row level security;
alter table checkins enable row level security;
alter table going enable row level security;

create policy "public read suburbs" on suburbs for select using (true);
create policy "public read events" on events for select using (true);

create policy "public read checkins" on checkins for select using (true);
create policy "public insert checkins" on checkins for insert with check (true);

create policy "public read going" on going for select using (true);
create policy "public insert going" on going for insert with check (true);

-- suburbs/events are seeded via the service role key (scripts/seed.ts),
-- not written by clients, so no public insert policy on those two tables.

-- ---------------------------------------------------------------------------
-- Realtime: enable on the two tables that drive live pulse + going counts
-- ---------------------------------------------------------------------------
alter publication supabase_realtime add table checkins;
alter publication supabase_realtime add table going;
