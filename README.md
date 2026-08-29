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
scripts/seedData/events.ts                 -- 18 hand-curated real-venue events (permanent golden-path floor)
scripts/seedData/ticketmasterEvents.ts     -- live concert/festival/cultural events (generated, see below)
scripts/ticketmaster.ts                    -- Discovery API fetch + nearest-suburb resolution
scripts/fetchTicketmasterEvents.ts         -- runner: writes seedData/ticketmasterEvents.ts
scripts/seed.ts                            -- clears + inserts suburbs + both event sources into Supabase
scripts/overpass.ts                        -- Overpass POI-density fetch + composition normalization
scripts/fetchSuburbScores.ts               -- runner: caches raw POI counts to seedData/_overpassCache.json
scripts/generateBlurbs.ts                  -- runner: OpenAI (gpt-4o-mini) blurbs to seedData/_blurbCache.json
scripts/writeSuburbsFile.ts                -- merges both caches into seedData/suburbs.ts
lib/supabaseClient.ts                      -- browser client + session id (drop into the Next.js app)
lib/realtime.ts                            -- checkin/going subscribe + write helpers
lib/buzzScore.ts                           -- client-side buzz_score aggregation
lib/eventMatch.ts                          -- energy/social match -> pin opacity
lib/suburbMatch.ts                         -- quiz -> ranked suburb list
lib/heatmapGeoJson.ts                      -- buzz scores -> Mapbox heatmap layer GeoJSON + style
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
city-wide feed. **Ticketmaster's Discovery API replaces it** — it's a real,
live, city-wide public search that still works. `scripts/seed.ts` combines
two sources:

- `scripts/seedData/events.ts` — 18 hand-curated events against real,
  verifiable venues/addresses, covering all 6 categories including
  charity/ngo/historical (Ticketmaster has no listings for those). This is
  the permanent golden-path floor the demo can always fall back on.
- `scripts/seedData/ticketmasterEvents.ts` — **generated**, live concert/
  festival/cultural events currently on sale in Sydney. Regenerate with:
  ```bash
  npx tsx scripts/fetchTicketmasterEvents.ts   # needs TICKETMASTER_API_KEY in .env
  npm run seed
  ```
  Each venue is bucketed into a seeded suburb by nearest centroid distance
  (Ticketmaster's own "city" field is just "Sydney", not the actual
  suburb — useless for matching). Cancelled/offsale events are filtered by
  `dates.status.code`. This is the "update once a day" source — rerun the
  fetch + reseed on whatever cadence you want; it's a static file in
  between runs, so the demo never depends on a live API call happening
  during judging.

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

### Heatmap layer

There's no external "heatmap API" — per the handoff doc, the heatmap is a
Mapbox GL native `type: 'heatmap'` layer rendered client-side from the same
checkin/going data that drives pin glow, just weighted and displayed
differently. `lib/heatmapGeoJson.ts` does the one conversion step needed:
`toHeatmapGeoJSON(events, buzzScores)` turns events + the output of
`computeBuzzScores` into the GeoJSON `FeatureCollection` a Mapbox `<Source>`
expects, and `heatmapLayerStyle` is a ready-to-use `<Layer>` paint config
(dark-palette cyan ramp, radius/opacity keyed to zoom so it cross-fades into
individual pins as the viewer zooms in, matching the brief's spec). Events
with no activity still appear at weight 0 rather than being dropped, so the
heatmap's extent always reflects "where events are," not just "where
checkins have happened."

### Realtime check

Before building anything on top of this, confirm the core loop works: open
the Supabase Table Editor on `checkins` in one tab, insert a row with
`event_id` set to any seeded event's id, and confirm a `postgres_changes`
INSERT event fires for a client subscribed via `lib/realtime.ts`
(`subscribeToCheckins`). Two browser tabs running the real app is the real
test once FE has a map to point at it.
