import fs from "node:fs";
import path from "node:path";
import { suburbs } from "./seedData/suburbs";
import { fetchAllPoiCounts, normalizeToScores, type PoiCounts } from "./overpass";

const CACHE_PATH = path.join(__dirname, "seedData", "_overpassCache.json");

function loadCache(): Map<string, PoiCounts> {
  if (!fs.existsSync(CACHE_PATH)) return new Map();
  const raw = JSON.parse(fs.readFileSync(CACHE_PATH, "utf-8")) as Record<string, PoiCounts>;
  return new Map(Object.entries(raw));
}

function saveCache(counts: Map<string, PoiCounts>) {
  fs.writeFileSync(CACHE_PATH, JSON.stringify(Object.fromEntries(counts), null, 2));
}

async function main() {
  const input = suburbs.map((s) => ({ name: s.name, lat: s.centroidLat, lng: s.centroidLng }));
  const existing = loadCache();

  const rawCounts = await fetchAllPoiCounts(input, existing, saveCache);
  saveCache(rawCounts);

  const scores = normalizeToScores(rawCounts);
  console.log("\n--- Normalized 0-100 scores ---");
  for (const s of suburbs) {
    console.log(s.name, scores.get(s.name));
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
