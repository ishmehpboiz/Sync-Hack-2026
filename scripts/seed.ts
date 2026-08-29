// Seeds suburbs + events into Supabase. Idempotent-ish: clears existing
// events/suburbs first so re-running during the hackathon always leaves a
// clean, known golden-path dataset (handoff doc, section 10).
//
// Usage:
//   npm run seed
//   SEED_DEMO_ACTIVITY=true npm run seed   # also seeds a few checkins/going
//                                          # so the map isn't dead on first load

import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { suburbs } from "./seedData/suburbs";
import { events as handCuratedEvents } from "./seedData/events";
import { ticketmasterEvents } from "./seedData/ticketmasterEvents";

// Hand-curated golden-path events (all categories, guaranteed stable) plus
// live Ticketmaster events (concert/festival/cultural only, refreshed via
// `npx tsx scripts/fetchTicketmasterEvents.ts`) — see README for the
// once-a-day refresh workflow.
const events = [...handCuratedEvents, ...ticketmasterEvents];

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
      events.map((e) => {
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
          source: "seeded",
        };
      })
    )
    .select("id, title");

  if (eventError) throw eventError;

  if (process.env.SEED_DEMO_ACTIVITY === "true") {
    console.log("Seeding demo checkins/going so the map has visible buzz on first load...");
    const pick = (title: string) => insertedEvents!.find((e) => e.title === title)?.id;

    const demoCheckins = [
      { title: "Sydney Symphony Under the Sails", count: 14 },
      { title: "The Corso Sunset Market", count: 9 },
      { title: "Enmore Theatre: Local Rock Showcase", count: 6 },
      { title: "Addi Road Community Pantry — Volunteers Needed", count: 3 },
    ];

    for (const { title, count } of demoCheckins) {
      const eventId = pick(title);
      if (!eventId) continue;
      const rows = Array.from({ length: count }, (_, i) => ({
        event_id: eventId,
        session_id: `demo-session-${title.slice(0, 8)}-${i}`,
      }));
      const { error } = await supabase.from("checkins").insert(rows);
      if (error) throw error;
    }

    const demoGoing = [
      { title: "Sydney Symphony Under the Sails", count: 22 },
      { title: "Glebe Markets", count: 11 },
    ];

    for (const { title, count } of demoGoing) {
      const eventId = pick(title);
      if (!eventId) continue;
      const rows = Array.from({ length: count }, (_, i) => ({
        event_id: eventId,
        session_id: `demo-going-${title.slice(0, 8)}-${i}`,
      }));
      const { error } = await supabase.from("going").insert(rows);
      if (error) throw error;
    }
  }

  console.log(`Done. ${insertedSuburbs!.length} suburbs, ${insertedEvents!.length} events seeded.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
