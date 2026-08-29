// Scores the mood quiz against every suburb's cached vibe vector and returns
// a ranked list. The winning suburb becomes the hero card with its blurb +
// top attractions, and tapping it flies the camera there (handoff doc,
// section 3, "Suburb recommendation").

import type { Energy, Social } from "./eventMatch";

export type VibeDimension = "food" | "nightlife" | "shopping" | "activities" | "sightseeing";
export type TimeBudget = "short" | "long";

export interface SuburbQuizState {
  energy: Energy;
  social: Social;
  timeBudget: TimeBudget;
  vibePreferences: VibeDimension[]; // up to 2, per the quiz spec
}

export interface SuburbVibeVector {
  id: string;
  name: string;
  summaryText: string;
  foodScore: number;
  nightlifeScore: number;
  shoppingScore: number;
  activitiesScore: number;
  sightseeingScore: number;
}

export interface SuburbMatchResult {
  suburb: SuburbVibeVector;
  score: number; // 0-100
}

type SuburbScoreKey = "foodScore" | "nightlifeScore" | "shoppingScore" | "activitiesScore" | "sightseeingScore";

const DIMENSION_KEY: Record<VibeDimension, SuburbScoreKey> = {
  food: "foodScore",
  nightlife: "nightlifeScore",
  shopping: "shoppingScore",
  activities: "activitiesScore",
  sightseeing: "sightseeingScore",
};

// Explicit vibe picks dominate the score; energy/social nudge it toward
// dimensions that tend to correlate (high energy -> nightlife/activities,
// solo -> sightseeing/food, etc.) without overriding what the user actually
// chose.
const EXPLICIT_PICK_WEIGHT = 2.0;
const IMPLICIT_WEIGHT = 0.5;

const ENERGY_IMPLICIT: Record<Energy, Partial<Record<VibeDimension, number>>> = {
  low: { sightseeing: 1, food: 0.5 },
  medium: { food: 0.5, shopping: 0.5, activities: 0.5 },
  high: { nightlife: 1, activities: 1 },
};

const SOCIAL_IMPLICIT: Record<Social, Partial<Record<VibeDimension, number>>> = {
  solo: { sightseeing: 1, food: 0.5 },
  small_group: { food: 0.5, activities: 0.5 },
  crowd: { nightlife: 1, shopping: 0.5 },
};

/** Ranks every suburb against the quiz answers, highest score first. */
export function matchSuburbs(quiz: SuburbQuizState, suburbs: SuburbVibeVector[]): SuburbMatchResult[] {
  const weights: Record<VibeDimension, number> = {
    food: 0,
    nightlife: 0,
    shopping: 0,
    activities: 0,
    sightseeing: 0,
  };

  for (const pick of quiz.vibePreferences) {
    weights[pick] += EXPLICIT_PICK_WEIGHT;
  }
  for (const [dim, w] of Object.entries(ENERGY_IMPLICIT[quiz.energy])) {
    weights[dim as VibeDimension] += w * IMPLICIT_WEIGHT;
  }
  for (const [dim, w] of Object.entries(SOCIAL_IMPLICIT[quiz.social])) {
    weights[dim as VibeDimension] += w * IMPLICIT_WEIGHT;
  }

  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0) || 1;

  const results = suburbs.map((suburb) => {
    let weightedSum = 0;
    for (const dim of Object.keys(weights) as VibeDimension[]) {
      weightedSum += weights[dim] * suburb[DIMENSION_KEY[dim]];
    }
    return { suburb, score: weightedSum / totalWeight };
  });

  return results.sort((a, b) => b.score - a.score);
}

/** Convenience — the single top suburb, or null if the list is empty. */
export function topSuburb(quiz: SuburbQuizState, suburbs: SuburbVibeVector[]): SuburbMatchResult | null {
  const ranked = matchSuburbs(quiz, suburbs);
  return ranked[0] ?? null;
}
