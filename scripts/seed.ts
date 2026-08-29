// Seeds suburbs + events into Supabase. Idempotent-ish: clears existing
// events/suburbs first so re-running during the hackathon always leaves a
// clean, known golden-path dataset (handoff doc, section 10).
//
// Every event also gets a randomized baseline of filler checkins/going
// (see seedFillerActivity below) — without this, the very first real
// check-in becomes the only lit-up point on the whole map/heatmap and reads
// as wildly out of proportion. A populated baseline gives it context.
//
// Usage:
//   npm run seed

import "dotenv/config";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { suburbs } from "./seedData/suburbs";
import { events as handCuratedEvents } from "./seedData/events";
import { ticketmasterEvents } from "./seedData/ticketmasterEvents";

// Hand-curated golden-path events (all categories, guaranteed stable) plus
// live Ticketmaster events (concert/festival/cultural only, refreshed via
// `npx tsx scripts/fetchTicketmasterEvents.ts`) — see README for the
// once-a-day refresh workflow.
const events = [...handCuratedEvents, ...ticketmasterEvents];

// Filler event photos via LoremFlickr — an open, keyless API that serves
// real Flickr photos matching keyword tags. `lock` pins a deterministic
// photo per index so re-running `npm run seed` doesn't reshuffle images.
const CATEGORY_IMAGE_KEYWORDS: Record<string, string> = {
  concert: "concert,music",
  festival: "festival,crowd",
  charity: "charity,volunteer",
  ngo: "community,volunteer",
  historical: "history,architecture",
  cultural: "art,gallery",
};

function imageUrlFor(category: string, index: number): string {
  const keywords = CATEGORY_IMAGE_KEYWORDS[category] ?? "city,sydney";
  return `https://loremflickr.com/640/400/${keywords}?lock=${index}`;
}

// Buzz tiers so the city doesn't look uniformly busy or uniformly dead —
// a handful of genuinely popular events, a lot of moderate ones, some quiet.
const BUZZ_TIERS: { weight: number; checkins: [number, number]; going: [number, number] }[] = [
  { weight: 0.15, checkins: [8, 20], going: [15, 40] }, // high
  { weight: 0.35, checkins: [2, 7], going: [4, 14] }, // medium
  { weight: 0.35, checkins: [0, 2], going: [1, 5] }, // low
  { weight: 0.15, checkins: [0, 0], going: [0, 1] }, // quiet
];

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickTier() {
  const r = Math.random();
  let acc = 0;
  for (const tier of BUZZ_TIERS) {
    acc += tier.weight;
    if (r <= acc) return tier;
  }
  return BUZZ_TIERS[BUZZ_TIERS.length - 1];
}

// Random past timestamp within the last `maxAgeMs` — spreads activity across
// the histogram windows instead of stacking everything at "now".
function randomRecentTimestamp(maxAgeMs: number): string {
  return new Date(Date.now() - Math.random() * maxAgeMs).toISOString();
}

const CHECKIN_WINDOW_MS = 60 * 60 * 1000; // matches lib/buzzHistogram.ts's 60-min checkin window
const GOING_WINDOW_MS = 100 * 60 * 1000; // stays inside useLiveActivity's 2h fetch lookback

/** Seeds a randomized baseline of checkins/going across every event, tiered so a few events read as genuinely popular. */
async function seedFillerActivity(
  supabase: SupabaseClient,
  insertedEvents: { id: string; title: string }[]
) {
  const checkinRows: { event_id: string; session_id: string; created_at: string }[] = [];
  const goingRows: { event_id: string; session_id: string; created_at: string }[] = [];

  insertedEvents.forEach((event, i) => {
    const tier = pickTier();
    const checkinCount = randomInt(...tier.checkins);
    const goingCount = randomInt(...tier.going);

    for (let j = 0; j < checkinCount; j++) {
      checkinRows.push({
        event_id: event.id,
        session_id: `filler-checkin-${i}-${j}`,
        created_at: randomRecentTimestamp(CHECKIN_WINDOW_MS),
      });
    }
    for (let j = 0; j < goingCount; j++) {
      goingRows.push({
        event_id: event.id,
        session_id: `filler-going-${i}-${j}`,
        created_at: randomRecentTimestamp(GOING_WINDOW_MS),
      });
    }
  });

  if (checkinRows.length) {
    const { error } = await supabase.from("checkins").insert(checkinRows);
    if (error) throw error;
  }
  if (goingRows.length) {
    const { error } = await supabase.from("going").insert(goingRows);
    if (error) throw error;
  }

  console.log(
    `Seeded ${checkinRows.length} filler checkins and ${goingRows.length} filler going across ${insertedEvents.length} events.`
  );
}

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error(
    "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Copy .env.example to .env and fill them in from your Supabase project's API settings."
  );
  process.exit(1);
}

// Service role key bypasses RLS — required to seed suburbs/events, which
// have no public insert policy (see supabase/migrations/0001_init_schema.sql).
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  console.log(`Seeding against ${SUPABASE_URL}`);

  console.log("Clearing existing checkins, going, events, suburbs...");
  await supabase.from("checkins").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("going").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("events").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("suburbs").delete().neq("id", "00000000-0000-0000-0000-000000000000");

  console.log(`Inserting ${suburbs.length} suburbs...`);
  const { data: insertedSuburbs, error: suburbError } = await supabase
    .from("suburbs")
    .insert(
      suburbs.map((s) => ({
        name: s.name,
        centroid_lat: s.centroidLat,
        centroid_lng: s.centroidLng,
        food_score: s.foodScore,
        nightlife_score: s.nightlifeScore,
        shopping_score: s.shoppingScore,
        activities_score: s.activitiesScore,
        sightseeing_score: s.sightseeingScore,
        summary_text: s.summaryText,
      }))
    )
    .select("id, name");

  if (suburbError) throw suburbError;

  const suburbIdByName = new Map(insertedSuburbs!.map((s) => [s.name, s.id as string]));

  console.log(`Inserting ${events.length} events...`);
  const { data: insertedEvents, error: eventError } = await supabase
    .from("events")
    .insert(
      events.map((e, i) => {
        const suburbId = suburbIdByName.get(e.suburbName);
        if (!suburbId) {
          throw new Error(`Event "${e.title}" references unknown suburb "${e.suburbName}"`);
        }
        return {
          suburb_id: suburbId,
          title: e.title,
          category: e.category,
          description: e.description,
          lat: e.lat,
          lng: e.lng,
          address: e.address,
          energy_tag: e.energyTag,
          social_tag: e.socialTag,
          wheelchair_accessible: e.wheelchairAccessible,
          sensory_friendly: e.sensoryFriendly,
          multilingual: e.multilingual,
          start_time: e.startTime,
          end_time: e.endTime,
          image_url: imageUrlFor(e.category, i),
          source: "seeded",
        };
      })
    )
    .select("id, title");

  if (eventError) throw eventError;

  console.log("Seeding filler checkins/going so the map isn't dead (or lopsided) on first load...");
  await seedFillerActivity(supabase, insertedEvents!);

  console.log(`Done. ${insertedSuburbs!.length} suburbs, ${insertedEvents!.length} events seeded.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
