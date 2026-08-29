# Community Pulse Map — SYNCS Hack 2026

Real-time city map of community happenings that reshapes itself around the
viewer's live state. See `Handoff_Document.docx` for full project context
(concept, judging criteria, roadmap, demo script).

## Backend

Supabase schema, seed data, and shared logic for the realtime map's data
layer — the Backend Engineer's scope from the handoff doc: schema, seed
data, realtime wiring, suburb-matching, and the golden-path demo dataset.
The Next.js frontend app (map UI, quiz, animation) is not in this repo yet.

### Layout

```
supabase/migrations/0001_init_schema.sql   -- tables, RLS, Realtime publication
scripts/seedData/suburbs.ts                -- 8 real Sydney suburbs + vibe vectors (generated, see below)
scripts/seedData/events.ts                 -- 18 hand-curated real-venue events
scripts/seed.ts                            -- clears + inserts the above into Supabase
scripts/overpass.ts                        -- Overpass POI-density fetch + composition normalization
scripts/fetchSuburbScores.ts               -- runner: caches raw POI counts to seedData/_overpassCache.json
scripts/generateBlurbs.ts                  -- runner: OpenAI (gpt-4o-mini) blurbs to seedData/_blurbCache.json
scripts/writeSuburbsFile.ts                -- merges both caches into seedData/suburbs.ts
lib/supabaseClient.ts                      -- browser client + session id (drop into the Next.js app)
lib/realtime.ts                            -- checkin/going subscribe + write helpers
lib/buzzScore.ts                           -- client-side buzz_score aggregation
lib/eventMatch.ts                          -- energy/social match -> pin opacity
lib/suburbMatch.ts                         -- quiz -> ranked suburb list
```

`lib/*` has no Next.js-specific imports except the `NEXT_PUBLIC_*` env vars in
`supabaseClient.ts`, so it can be copied straight into the frontend app's
`lib/` folder, or the whole repo can become the Next.js app root once FE
scaffolds into it — either works.

### Setup

1. Create a Supabase project (supabase.com -> New Project). Free tier is fine.
2. Copy `.env.example` to `.env` and fill in `SUPABASE_URL` +
   `SUPABASE_SERVICE_ROLE_KEY` from Project Settings -> API.
3. Run the migration: paste `supabase/migrations/0001_init_schema.sql` into
   the Supabase SQL Editor and run it (or `supabase db push` if using the CLI
   with this repo linked).
4. Install deps and seed:
   ```bash
   npm install
   npm run seed
   ```
   Add `SEED_DEMO_ACTIVITY=true` to `.env` first if you want a few pins to
   already show buzz on first load, instead of a completely quiet map.
5. Copy the `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` pair
   into the Next.js app's `.env.local` — the frontend talks to Supabase
   directly, there is no separate API server.

### Re-seeding

`npm run seed` is destructive by design — it clears `checkins`, `going`,
`events`, and `suburbs` before reinserting, so the demo dataset is always in
a known state. Safe to run as many times as needed leading up to the demo;
just don't run it *during* the live judging walkthrough.

### Real event data status

The Eventbrite public **search** API was deprecated in Feb 2020 — a key today
only lists events belonging to an organization you own, not a searchable
city-wide feed, so it can't backfill "real events happening in Sydney" the
way the original brief assumed. `scripts/seedData/events.ts` is hand-curated
against real, verifiable venues/addresses instead and is the dataset the demo
should run on regardless. If council open-data or another real feed turns up
something usable, add a fetch step ahead of the `events` array in
`scripts/seed.ts` — the insert logic doesn't care whether a row came from an
API or was hand-typed.

### Suburb vibe scores — real data pipeline

`scripts/seedData/suburbs.ts` is **generated**, not hand-written. The vibe
scores come from real OpenStreetMap POI density (Overpass API, free/keyless)
and the "known for" blurbs from OpenAI (`gpt-4o-mini`), so there's a real,
explainable answer if a judge asks where the numbers come from.

Pipeline (each step caches to `scripts/seedData/_*.json` so a rerun resumes
instead of restarting — Overpass rate-limits aggressively):

```bash
npx tsx scripts/fetchSuburbScores.ts   # Overpass -> _overpassCache.json (raw POI counts per suburb)
npx tsx scripts/generateBlurbs.ts      # OpenAI -> _blurbCache.json (needs OPENAI_API_KEY in .env)
npx tsx scripts/writeSuburbsFile.ts    # merges both into seedData/suburbs.ts
npm run seed                           # push the regenerated suburbs into Supabase
```

Scores are **composition-normalized**, not raw density: each suburb's counts
are expressed as a share of that suburb's own total POIs, then scaled 0-100
across suburbs. Plain density normalization was tried first and rejected —
it makes the busiest area (Sydney CBD) score near-100 on almost every
dimension just because it has more of everything, which defeats the point of
a *vibe match*. Composition scoring instead captures what each suburb is
relatively skewed toward (see `normalizeToScores` in `scripts/overpass.ts`).

If Overpass rate-limits from one machine/IP, it's a per-IP limit — running
the fetch from a different network for the remaining suburbs and merging the
resulting `_overpassCache.json` files works fine.

### Realtime check

Before building anything on top of this, confirm the core loop works: open
the Supabase Table Editor on `checkins` in one tab, insert a row with
`event_id` set to any seeded event's id, and confirm a `postgres_changes`
INSERT event fires for a client subscribed via `lib/realtime.ts`
(`subscribeToCheckins`). Two browser tabs running the real app is the real
test once FE has a map to point at it.
