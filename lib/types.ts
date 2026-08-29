// Row shapes as returned by Supabase, matching supabase/migrations/0001_init_schema.sql
// column names exactly (snake_case) — no client-side renaming, to keep the
// mapping between the DB and the UI a straight pass-through.

import type { Energy, Social } from "./eventMatch";
import type { SuburbVibeVector } from "./suburbMatch";

export type EventCategory =
  | "concert"
  | "festival"
  | "charity"
  | "ngo"
  | "historical"
  | "cultural";

export interface SuburbRow {
  id: string;
  name: string;
  centroid_lat: number;
  centroid_lng: number;
  boundary: unknown | null;
  food_score: number;
  nightlife_score: number;
  shopping_score: number;
  activities_score: number;
  sightseeing_score: number;
  summary_text: string | null;
  created_at: string;
}

export type ViewState = "city" | "suburb" | "event" | "quiz";

export interface EventRow {
  id: string;
  suburb_id: string | null;
  title: string;
  category: EventCategory;
  description: string | null;
  lat: number;
  lng: number;
  address: string | null;
  energy_tag: Energy | null;
  social_tag: Social | null;
  wheelchair_accessible: boolean;
  sensory_friendly: boolean;
  multilingual: boolean;
  start_time: string | null;
  end_time: string | null;
  image_url: string | null;
  source: "eventbrite" | "council" | "seeded" | "ticketmaster";
  created_at: string;
}

/** lib/suburbMatch.ts's matchSuburbs expects camelCase SuburbVibeVector; the DB (and Supabase's response) is snake_case SuburbRow. This is the one conversion point between them. */
export function toSuburbVibeVector(suburb: SuburbRow): SuburbVibeVector {
  return {
    id: suburb.id,
    name: suburb.name,
    summaryText: suburb.summary_text ?? "",
    foodScore: suburb.food_score,
    nightlifeScore: suburb.nightlife_score,
    shoppingScore: suburb.shopping_score,
    activitiesScore: suburb.activities_score,
    sightseeingScore: suburb.sightseeing_score,
  };
}
