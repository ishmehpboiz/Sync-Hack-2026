// Derives suburb vibe scores from real OpenStreetMap POI density via the
// Overpass API (free, no key) instead of hand-tuning them — gives a real,
// explainable answer for "where do these numbers come from" (handoff doc,
// section 4, Citadel "complexity" criterion).
//
// One Overpass request per suburb: five named sets (food/nightlife/
// shopping/activities/sightseeing), each counted with `out count;` in a
// single round trip rather than five separate requests.

const OVERPASS_URL = "https://overpass-api.de/api/interpreter";
const RADIUS_METERS = 1200;

export interface PoiCounts {
  food: number;
  nightlife: number;
  shopping: number;
  activities: number;
  sightseeing: number;
}

function buildQuery(lat: number, lng: number): string {
  const c = (tagFilter: string) => `nwr(around:${RADIUS_METERS},${lat},${lng})${tagFilter};`;
  return `
[out:json][timeout:25];
(
  ${c('[amenity~"^(restaurant|cafe|fast_food|food_court)$"]')}
)->.food;
(
  ${c('[amenity~"^(bar|pub|nightclub)$"]')}
)->.nightlife;
(
  ${c("[shop]")}
)->.shopping;
(
  ${c("[leisure]")}
  ${c("[sport]")}
)->.activities;
(
  ${c('[tourism~"^(attraction|museum|viewpoint|gallery|artwork)$"]')}
  ${c("[historic]")}
)->.sightseeing;
.food out count;
.nightlife out count;
.shopping out count;
.activities out count;
.sightseeing out count;
`.trim();
}

interface OverpassCountElement {
  type: "count";
  tags: { total: string };
}

const MAX_RETRIES = 4;

async function fetchCounts(lat: number, lng: number): Promise<PoiCounts> {
  const query = buildQuery(lat, lng);

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    let res: Response;
    try {
      res = await fetch(OVERPASS_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "*/*",
          "User-Agent": "community-pulse-map-hackathon/0.1 (suburb POI density seeding script)",
        },
        body: new URLSearchParams({ data: query }).toString(),
      });
    } catch (err) {
      const waitMs = 10_000 * Math.pow(2, attempt);
      console.log(`  Network error (${(err as Error).message}), backing off ${waitMs / 1000}s (attempt ${attempt + 1}/${MAX_RETRIES + 1})...`);
      await new Promise((r) => setTimeout(r, waitMs));
      continue;
    }

    if (res.status === 429 || res.status === 504) {
      const waitMs = 10_000 * Math.pow(2, attempt);
      console.log(`  Overpass rate-limited (${res.status}), backing off ${waitMs / 1000}s (attempt ${attempt + 1}/${MAX_RETRIES + 1})...`);
      await res.text(); // drain body
      await new Promise((r) => setTimeout(r, waitMs));
      continue;
    }

    if (!res.ok) {
      throw new Error(`Overpass request failed: ${res.status} ${res.statusText} — ${await res.text()}`);
    }

    const json = (await res.json()) as { elements: OverpassCountElement[] };
    const counts = json.elements.filter((e) => e.type === "count").map((e) => Number(e.tags.total));

    if (counts.length !== 5) {
      throw new Error(`Expected 5 count elements from Overpass, got ${counts.length}: ${JSON.stringify(json.elements)}`);
    }

    const [food, nightlife, shopping, activities, sightseeing] = counts;
    return { food, nightlife, shopping, activities, sightseeing };
  }

  throw new Error(`Overpass still rate-limited after ${MAX_RETRIES} retries`);
}

/**
 * Fetches raw POI counts for every suburb, sequentially with a gap between
 * requests (Overpass usage policy — be gentle on the shared public
 * instance). Accepts an optional `existing` map so a rerun after a
 * rate-limit failure doesn't redo suburbs that already succeeded.
 */
export async function fetchAllPoiCounts(
  suburbs: { name: string; lat: number; lng: number }[],
  existing: Map<string, PoiCounts> = new Map(),
  onProgress?: (result: Map<string, PoiCounts>) => void
): Promise<Map<string, PoiCounts>> {
  const result = new Map(existing);
  for (const s of suburbs) {
    if (result.has(s.name)) {
      console.log(`Skipping ${s.name} (already fetched)`);
      continue;
    }
    console.log(`Querying Overpass for ${s.name}...`);
    const counts = await fetchCounts(s.lat, s.lng);
    console.log(`  -> ${JSON.stringify(counts)}`);
    result.set(s.name, counts);
    onProgress?.(result); // persist after every success so a rate-limit failure later doesn't lose progress
    await new Promise((r) => setTimeout(r, 5000));
  }
  return result;
}

const DIMS: (keyof PoiCounts)[] = ["food", "nightlife", "shopping", "activities", "sightseeing"];

/**
 * Composition-based normalization: first express each suburb's counts as a
 * share of that suburb's own total POIs (its "vibe mix"), then min-max
 * scale each dimension across suburbs to spread the range to 0-100.
 *
 * Plain density normalization (each dimension scaled only against other
 * suburbs) systematically favors whichever suburb is busiest overall — the
 * CBD ends up near-100 on nearly every dimension just because it has more
 * of everything, which defeats the point of a vibe *match*. Composition
 * normalization instead captures what a suburb is relatively skewed toward,
 * which is what the suburb-matching function actually needs to discriminate
 * suburbs from each other.
 */
export function normalizeToScores(counts: Map<string, PoiCounts>): Map<string, PoiCounts> {
  const composition = new Map<string, PoiCounts>();
  for (const [name, c] of counts) {
    const total = DIMS.reduce((sum, d) => sum + c[d], 0) || 1;
    const comp: PoiCounts = { food: 0, nightlife: 0, shopping: 0, activities: 0, sightseeing: 0 };
    for (const d of DIMS) comp[d] = c[d] / total;
    composition.set(name, comp);
  }

  const max: Record<keyof PoiCounts, number> = { food: 0, nightlife: 0, shopping: 0, activities: 0, sightseeing: 0 };
  for (const c of composition.values()) {
    for (const d of DIMS) max[d] = Math.max(max[d], c[d]);
  }

  const result = new Map<string, PoiCounts>();
  for (const [name, c] of composition) {
    const scored: PoiCounts = { food: 0, nightlife: 0, shopping: 0, activities: 0, sightseeing: 0 };
    for (const d of DIMS) {
      scored[d] = max[d] === 0 ? 5 : Math.max(5, Math.round((c[d] / max[d]) * 100));
    }
    result.set(name, scored);
  }
  return result;
}
