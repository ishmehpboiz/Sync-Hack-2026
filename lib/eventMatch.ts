// Weighted match on energy_tag/social_tag against the mood quiz answers.
// Matching events render full-opacity; non-matches dim but never disappear
// (handoff doc, section 3 & 6 — "no dead ends").

export type Energy = "low" | "medium" | "high";
export type Social = "solo" | "small_group" | "crowd";

export interface QuizState {
  energy: Energy;
  social: Social;
}

export interface MatchableEvent {
  energy_tag: Energy | null;
  social_tag: Social | null;
}

const ENERGY_ORDER: Energy[] = ["low", "medium", "high"];
const SOCIAL_ORDER: Social[] = ["solo", "small_group", "crowd"];

// Distance of 0 -> full match, 1 -> adjacent, 2 -> opposite ends.
function ordinalSimilarity<T>(order: T[], a: T, b: T): number {
  const dist = Math.abs(order.indexOf(a) - order.indexOf(b));
  return 1 - dist / (order.length - 1); // 1, 0.5, 0
}

const ENERGY_WEIGHT = 0.5;
const SOCIAL_WEIGHT = 0.5;

/**
 * Returns a 0-1 match score for an event against the quiz state. An event
 * with no tags set scores 0.5 (neutral — dim it slightly, never fully).
 */
export function computeMatchScore(event: MatchableEvent, quiz: QuizState): number {
  const energyScore = event.energy_tag ? ordinalSimilarity(ENERGY_ORDER, event.energy_tag, quiz.energy) : 0.5;
  const socialScore = event.social_tag ? ordinalSimilarity(SOCIAL_ORDER, event.social_tag, quiz.social) : 0.5;
  return energyScore * ENERGY_WEIGHT + socialScore * SOCIAL_WEIGHT;
}

const MIN_OPACITY = 0.35; // dimmed floor — always visible, never hidden

/** Maps a match score straight to the pin's render opacity. */
export function opacityForMatch(score: number): number {
  return MIN_OPACITY + (1 - MIN_OPACITY) * score;
}
