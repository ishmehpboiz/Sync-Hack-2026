// Generates each suburb's one-line "known for" blurb from its real
// Overpass-derived vibe scores via OpenAI, instead of hand-writing them.
// Run once, cache the result — this is the "generated once and cached, not
// computed live" blurb pipeline from the handoff doc (section 5).

import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { suburbs } from "./seedData/suburbs";
import { normalizeToScores, type PoiCounts } from "./overpass";

const OVERPASS_CACHE_PATH = path.join(__dirname, "seedData", "_overpassCache.json");
const BLURB_CACHE_PATH = path.join(__dirname, "seedData", "_blurbCache.json");
const MODEL = "gpt-4o-mini";

function loadOverpassScores(): Map<string, PoiCounts> {
  if (!fs.existsSync(OVERPASS_CACHE_PATH)) {
    throw new Error(`No Overpass cache at ${OVERPASS_CACHE_PATH} — run 'npx tsx scripts/fetchSuburbScores.ts' first.`);
  }
  const raw = JSON.parse(fs.readFileSync(OVERPASS_CACHE_PATH, "utf-8")) as Record<string, PoiCounts>;
  return normalizeToScores(new Map(Object.entries(raw)));
}

function loadBlurbCache(): Record<string, string> {
  if (!fs.existsSync(BLURB_CACHE_PATH)) return {};
  return JSON.parse(fs.readFileSync(BLURB_CACHE_PATH, "utf-8"));
}

function saveBlurbCache(cache: Record<string, string>) {
  fs.writeFileSync(BLURB_CACHE_PATH, JSON.stringify(cache, null, 2));
}

async function generateBlurb(name: string, scores: PoiCounts): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("Missing OPENAI_API_KEY in .env");

  const dims = Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .map(([dim, score]) => `${dim}: ${score}/100`)
    .join(", ");

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You write a single-sentence 'known for' blurb for real Sydney suburbs, for a city-life discovery map app. " +
            "Input is a suburb name and its vibe scores (0-100) across five dimensions, derived from real OpenStreetMap POI density in that suburb — food/nightlife/shopping/activities/sightseeing. " +
            "Use your own knowledge of what that specific suburb is actually like and known for — the scores are a ranking signal for which 1-2 dimensions to lead with, not something to describe numerically. " +
            "Write ONE sentence, under 18 words, in a punchy, concrete, magazine-blurb style — name actual things (a street, a landmark, a kind of venue, a local character trait), not abstract category words like 'food' or 'shopping'. " +
            "Never mention scores, numbers, or rankings. No marketing fluff, no exclamation points, no 'known for' or 'famous for' framing — just the sentence itself. " +
            "Example style: 'Alternative eats, live music pubs, and King St's endless street art.' or 'A ferry ride into laid-back beach life, with The Corso as its social spine.' " +
            'Respond as JSON: {"blurb": "..."}',
        },
        {
          role: "user",
          content: `Suburb: ${name}\nScores (highest first): ${dims}`,
        },
      ],
    }),
  });

  if (!res.ok) {
    throw new Error(`OpenAI request failed: ${res.status} ${res.statusText} — ${await res.text()}`);
  }

  const json = await res.json();
  const content = json.choices?.[0]?.message?.content;
  if (!content) throw new Error(`Unexpected OpenAI response shape: ${JSON.stringify(json)}`);

  const parsed = JSON.parse(content) as { blurb: string };
  return parsed.blurb.trim();
}

async function main() {
  const scores = loadOverpassScores();
  const cache = loadBlurbCache();

  for (const s of suburbs) {
    if (cache[s.name]) {
      console.log(`Skipping ${s.name} (already generated): "${cache[s.name]}"`);
      continue;
    }
    const suburbScores = scores.get(s.name);
    if (!suburbScores) {
      console.warn(`No Overpass scores for ${s.name}, skipping.`);
      continue;
    }
    console.log(`Generating blurb for ${s.name}...`);
    const blurb = await generateBlurb(s.name, suburbScores);
    console.log(`  -> "${blurb}"`);
    cache[s.name] = blurb;
    saveBlurbCache(cache);
  }

  console.log("\n--- All blurbs ---");
  for (const s of suburbs) {
    console.log(`${s.name}: ${cache[s.name] ?? "(missing)"}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
