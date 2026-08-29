// Real, live event search — unlike Eventbrite (public search deprecated
// 2020), Ticketmaster's Discovery API still supports city-wide search with
// just an API key. Covers ticketed events only (concert/festival/some
// cultural) — charity/ngo/historical stay hand-curated in events.ts
// regardless, Ticketmaster has no listings for those categories.

import type { EventSeed } from "./seedData/events";

const DISCOVERY_URL = "https://app.ticketmaster.com/discovery/v2/events.json";

// Best-effort mapping from Ticketmaster's classification segment to our
// category enum. Anything unmapped is skipped rather than guessed wrong.
const SEGMENT_TO_CATEGORY: Record<string, EventSeed["category"]> = {
  Music: "concert",
  Arts: "cultural",
  Theatre: "cultural",
};

interface TmEvent {
  name: string;
  info?: string;
  pleaseNote?: string;
  dates: { start: { dateTime?: string }; end?: { dateTime?: string }; status?: { code?: string } };
  classifications?: { segment?: { name?: string } }[];
  _embedded?: {
    venues?: {
      name: string;
      address?: { line1?: string };
      city?: { name?: string };
      state?: { stateCode?: string };
      postalCode?: string;
      location?: { latitude?: string; longitude?: string };
    }[];
  };
}

interface DiscoveryResponse {
  _embedded?: { events?: TmEvent[] };
  page: { totalElements: number; totalPages: number };
}

function inferEnergySocial(segment: string | undefined): { energyTag: EventSeed["energyTag"]; socialTag: EventSeed["socialTag"] } {
  if (segment === "Theatre" || segment === "Arts") {
    return { energyTag: "low", socialTag: "small_group" };
  }
  // Music and anything else defaults to a typical concert profile.
  return { energyTag: "high", socialTag: "crowd" };
}

// Ticketmaster's venue "city" field is almost always just "Sydney" (the
// metro city), not the actual suburb — useless for matching against our
// seeded suburbs. Nearest-centroid-by-distance on the venue's real lat/lng
// is far more reliable.
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function nearestSuburb(
  lat: number,
  lng: number,
  suburbs: { name: string; centroidLat: number; centroidLng: number }[],
  maxDistanceKm = 6
): string | null {
  let best: { name: string; dist: number } | null = null;
  for (const s of suburbs) {
    const dist = haversineKm(lat, lng, s.centroidLat, s.centroidLng);
    if (!best || dist < best.dist) best = { name: s.name, dist };
  }
  return best && best.dist <= maxDistanceKm ? best.name : null;
}

/**
 * Fetches upcoming events in Sydney from Ticketmaster Discovery API and maps
 * them into our EventSeed shape. `suburbNameForVenue` resolves a venue's
 * lat/lng to one of our seeded suburb names (or null to skip the event
 * entirely rather than mis-bucket it) — pass `nearestSuburb` bound to
 * seedData/suburbs.ts, or your own resolver.
 */
export async function fetchSydneyEvents(
  apiKey: string,
  suburbNameForVenue: (lat: number, lng: number) => string | null,
  size = 50
): Promise<EventSeed[]> {
  const url = new URL(DISCOVERY_URL);
  url.searchParams.set("apikey", apiKey);
  url.searchParams.set("city", "Sydney");
  url.searchParams.set("countryCode", "AU");
  url.searchParams.set("size", String(size));
  url.searchParams.set("sort", "date,asc");

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(`Ticketmaster request failed: ${res.status} ${res.statusText} — ${await res.text()}`);
  }

  const json = (await res.json()) as DiscoveryResponse;
  const events = json._embedded?.events ?? [];

  const mapped: EventSeed[] = [];
  for (const e of events) {
    if (e.dates.status?.code && e.dates.status.code !== "onsale") continue; // skip cancelled/postponed/offsale

    const venue = e._embedded?.venues?.[0];
    if (!venue?.location?.latitude || !venue?.location?.longitude) continue; // skip events with no coordinates

    const segment = e.classifications?.[0]?.segment?.name;
    const category = segment ? SEGMENT_TO_CATEGORY[segment] : undefined;
    if (!category) continue; // skip sports/family/other segments we don't have a category for

    const suburbName = suburbNameForVenue(Number(venue.location.latitude), Number(venue.location.longitude));
    if (!suburbName) continue; // venue too far from any seeded suburb — skip rather than mis-bucket it

    const { energyTag, socialTag } = inferEnergySocial(segment);
    const addressParts = [venue.address?.line1, venue.city?.name, venue.state?.stateCode, venue.postalCode].filter(Boolean);

    mapped.push({
      suburbName,
      title: e.name,
      category,
      description: e.info || e.pleaseNote || `${e.name} at ${venue.name}.`,
      lat: Number(venue.location.latitude),
      lng: Number(venue.location.longitude),
      address: addressParts.join(", "),
      energyTag,
      socialTag,
      wheelchairAccessible: false, // Ticketmaster doesn't expose this reliably; leave conservative default
      sensoryFriendly: false,
      multilingual: false,
      startTime: e.dates.start.dateTime ?? new Date().toISOString(),
      endTime: e.dates.end?.dateTime ?? e.dates.start.dateTime ?? new Date().toISOString(),
    });
  }

  return mapped;
}
