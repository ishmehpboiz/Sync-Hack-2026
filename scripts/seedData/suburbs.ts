// Seeded once, cached — not computed live. 8 real Sydney suburbs. Vibe
// scores are derived from real OpenStreetMap POI density via the Overpass
// API (composition-normalized — see scripts/overpass.ts), and summaryText
// blurbs are generated once from those scores via OpenAI (gpt-4o-mini —
// see scripts/generateBlurbs.ts). Regenerate both with:
//   npx tsx scripts/fetchSuburbScores.ts && npx tsx scripts/generateBlurbs.ts && npx tsx scripts/writeSuburbsFile.ts
//
// `name` is used as the join key in scripts/seed.ts to attach events to the
// right suburb_id after suburbs are inserted — keep these names unique.

export interface SuburbSeed {
  name: string;
  centroidLat: number;
  centroidLng: number;
  foodScore: number;
  nightlifeScore: number;
  shoppingScore: number;
  activitiesScore: number;
  sightseeingScore: number;
  summaryText: string;
}

export const suburbs: SuburbSeed[] = [
  {
    name: "Sydney CBD & The Rocks",
    centroidLat: -33.8599,
    centroidLng: 151.209,
    foodScore: 71,
    nightlifeScore: 61,
    shoppingScore: 56,
    activitiesScore: 40,
    sightseeingScore: 100,
    summaryText: "Iconic views from Sydney Harbour Bridge, historic laneways, and a vibrant dining scene at Circular Quay.",
  },
  {
    name: "Newtown",
    centroidLat: -33.8983,
    centroidLng: 151.1791,
    foodScore: 88,
    nightlifeScore: 62,
    shoppingScore: 100,
    activitiesScore: 51,
    sightseeingScore: 13,
    summaryText: "Trendy boutiques, vintage shops on King Street, and a diverse range of eateries around the area.",
  },
  {
    name: "Marrickville",
    centroidLat: -33.9115,
    centroidLng: 151.1552,
    foodScore: 78,
    nightlifeScore: 55,
    shoppingScore: 82,
    activitiesScore: 75,
    sightseeingScore: 6,
    summaryText: "Vibrant markets, quirky shops, and a dive into authentic eats along Illawarra Road.",
  },
  {
    name: "Surry Hills",
    centroidLat: -33.8886,
    centroidLng: 151.2094,
    foodScore: 100,
    nightlifeScore: 100,
    shoppingScore: 81,
    activitiesScore: 40,
    sightseeingScore: 28,
    summaryText: "Hip cafes, bustling bars, and boutique shops line the vibrant streets of Surry Hills.",
  },
  {
    name: "Bondi Beach",
    centroidLat: -33.8908,
    centroidLng: 151.2743,
    foodScore: 77,
    nightlifeScore: 20,
    shoppingScore: 61,
    activitiesScore: 90,
    sightseeingScore: 14,
    summaryText: "Surf culture, vibrant cafes on Campbell Parade, and the iconic Bondi to Coogee coastal walk.",
  },
  {
    name: "Manly",
    centroidLat: -33.7969,
    centroidLng: 151.2879,
    foodScore: 65,
    nightlifeScore: 32,
    shoppingScore: 40,
    activitiesScore: 98,
    sightseeingScore: 33,
    summaryText: "Surfing, scenic coastal walks, and the bustling atmosphere of Manly Beach.",
  },
  {
    name: "Glebe",
    centroidLat: -33.8799,
    centroidLng: 151.1857,
    foodScore: 52,
    nightlifeScore: 34,
    shoppingScore: 64,
    activitiesScore: 100,
    sightseeingScore: 17,
    summaryText: "A vibrant hub of markets, quirky boutiques, and the historic charm of Glebe Point Road.",
  },
  {
    name: "Redfern & Eveleigh",
    centroidLat: -33.893,
    centroidLng: 151.1975,
    foodScore: 74,
    nightlifeScore: 55,
    shoppingScore: 74,
    activitiesScore: 69,
    sightseeingScore: 27,
    summaryText: "Trendy eateries on Redfern St and vibrant markets at Carriageworks define this up-and-coming hub.",
  },
];
