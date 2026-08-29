// buzz_score is computed client-side by aggregating the same realtime
// checkin/going stream every client already has — no separate aggregation
// table (handoff doc, section 5). Recent checkins count for more than old
// ones so the pulse actually looks "live" rather than a lifetime tally.

export interface ActivityRow {
  event_id: string;
  created_at: string;
}

export interface BuzzBreakdown {
  eventId: string;
  checkinCount: number;
  goingCount: number;
  buzzScore: number; // raw weighted score, unbounded but soft-capped in practice
  glowIntensity: number; // 0-1, feed directly into the pin's glow animation
}

const RECENT_WINDOW_MS = 15 * 60 * 1000; // last 15 min: full weight
const STALE_WINDOW_MS = 60 * 60 * 1000; // last 60 min: partial weight
const RECENT_WEIGHT = 3;
const STALE_WEIGHT = 1;
const OLD_WEIGHT = 0.25;
const GOING_WEIGHT = 0.5;

function checkinWeight(createdAtIso: string, now: number): number {
  const ageMs = now - new Date(createdAtIso).getTime();
  if (ageMs <= RECENT_WINDOW_MS) return RECENT_WEIGHT;
  if (ageMs <= STALE_WINDOW_MS) return STALE_WEIGHT;
  return OLD_WEIGHT;
}

/**
 * Aggregates raw checkin/going rows (from initial fetch + realtime inserts)
 * into a per-event buzz score. Call this whenever the underlying arrays
 * change — it's cheap enough to rerun on every insert for a demo-sized
 * dataset.
 */
export function computeBuzzScores(
  checkins: ActivityRow[],
  going: ActivityRow[],
  now: number = Date.now()
): Map<string, BuzzBreakdown> {
  const result = new Map<string, BuzzBreakdown>();

  const ensure = (eventId: string): BuzzBreakdown => {
    let entry = result.get(eventId);
    if (!entry) {
      entry = { eventId, checkinCount: 0, goingCount: 0, buzzScore: 0, glowIntensity: 0 };
      result.set(eventId, entry);
    }
    return entry;
  };

  for (const c of checkins) {
    const entry = ensure(c.event_id);
    entry.checkinCount += 1;
    entry.buzzScore += checkinWeight(c.created_at, now);
  }

  for (const g of going) {
    const entry = ensure(g.event_id);
    entry.goingCount += 1;
    entry.buzzScore += GOING_WEIGHT;
  }

  for (const entry of result.values()) {
    // Soft cap via log so one very buzzy event doesn't wash out the rest of
    // the pin sizing/glow scale. Tune the divisor against real demo numbers.
    entry.glowIntensity = Math.min(1, Math.log2(entry.buzzScore + 1) / Math.log2(25));
  }

  return result;
}

/** Convenience accessor with sane defaults for an event with no activity yet. */
export function getBuzz(scores: Map<string, BuzzBreakdown>, eventId: string): BuzzBreakdown {
  return scores.get(eventId) ?? { eventId, checkinCount: 0, goingCount: 0, buzzScore: 0, glowIntensity: 0 };
}
