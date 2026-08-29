// Regenerates scripts/seedData/suburbs.ts from the Overpass score cache +
// OpenAI blurb cache, keeping name/centroid as-is and replacing the vibe
// scores + summaryText with the real-data-derived versions.

import fs from "node:fs";
import path from "node:path";
import { suburbs } from "./seedData/suburbs";
import { normalizeToScores, type PoiCounts } from "./overpass";

const OVERPASS_CACHE_PATH = path.join(__dirname, "seedData", "_overpassCache.json");
const BLURB_CACHE_PATH = path.join(__dirname, "seedData", "_blurbCache.json");
const OUTPUT_PATH = path.join(__dirname, "seedData", "suburbs.ts");

function main() {
  const rawCounts = JSON.parse(fs.readFileSync(OVERPASS_CACHE_PATH, "utf-8")) as Record<string, PoiCounts>;
  const scores = normalizeToScores(new Map(Object.entries(rawCounts)));
  const blurbs = JSON.parse(fs.readFileSync(BLURB_CACHE_PATH, "utf-8")) as Record<string, string>;

  const entries = suburbs.map((s) => {
    const score = scores.get(s.name);
    const blurb = blurbs[s.name];
    if (!score) throw new Error(`No Overpass score for ${s.name}`);
    if (!blurb) throw new Error(`No blurb for ${s.name}`);
    return { ...s, foodScore: score.food, nightlifeScore: score.nightlife, shoppingScore: score.shopping, activitiesScore: score.activities, sightseeingScore: score.sightseeing, summaryText: blurb };
  });

  const body = entries
    .map(
      (s) => `  {
    name: ${JSON.stringify(s.name)},
    centroidLat: ${s.centroidLat},
    centroidLng: ${s.centroidLng},
    foodScore: ${s.foodScore},
    nightlifeScore: ${s.nightlifeScore},
    shoppingScore: ${s.shoppingScore},
    activitiesScore: ${s.activitiesScore},
    sightseeingScore: ${s.sightseeingScore},
    summaryText: ${JSON.stringify(s.summaryText)},
  },`
    )
    .join("\n");

  const fileContent = `// Seeded once, cached — not computed live. 8 real Sydney suburbs. Vibe
// scores are derived from real OpenStreetMap POI density via the Overpass
// API (composition-normalized — see scripts/overpass.ts), and summaryText
// blurbs are generated once from those scores via OpenAI (gpt-4o-mini —
// see scripts/generateBlurbs.ts). Regenerate both with:
//   npx tsx scripts/fetchSuburbScores.ts && npx tsx scripts/generateBlurbs.ts && npx tsx scripts/writeSuburbsFile.ts
//
// \`name\` is used as the join key in scripts/seed.ts to attach events to the
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
${body}
];
`;

  fs.writeFileSync(OUTPUT_PATH, fileContent);
  console.log(`Wrote ${OUTPUT_PATH}`);
}

main();
