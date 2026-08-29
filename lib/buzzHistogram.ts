// Buckets a single event's checkins into fixed time windows for the event
// detail sparkline. computeBuzzScores (buzzScore.ts) gives one aggregate
// number per event; this gives the shape of that activity over the last
// hour so the UI can show it rising or falling, not just a total.

import type { ActivityRow } from "./buzzScore";

export interface HistogramBucket {
  /** Bucket start, ms since epoch. */
  start: number;
  count: number;
}

const WINDOW_MS = 60 * 60 * 1000; // last 60 min
const BUCKET_COUNT = 8; // 7.5-min buckets over the 60-min window
const GOING_WINDOW_MS = 2 * 60 * 60 * 1000; // last 2h — matches useLiveActivity's fetch lookback

/** Shared bucketing logic — both checkins and going rows use the same shape. */
function bucketActivity(
  rows: ActivityRow[],
  eventId: string,
  windowMs: number,
  now: number
): HistogramBucket[] {
  const bucketMs = windowMs / BUCKET_COUNT;
  const windowStart = now - windowMs;

  const buckets: HistogramBucket[] = Array.from({ length: BUCKET_COUNT }, (_, i) => ({
    start: windowStart + i * bucketMs,
    count: 0,
  }));

  for (const r of rows) {
    if (r.event_id !== eventId) continue;
    const t = new Date(r.created_at).getTime();
    if (t < windowStart || t > now) continue;
    const index = Math.min(BUCKET_COUNT - 1, Math.floor((t - windowStart) / bucketMs));
    buckets[index].count += 1;
  }

  return buckets;
}

/**
 * Buckets checkins for one event into BUCKET_COUNT equal windows spanning
 * the last WINDOW_MS. Oldest bucket first, so the array reads left-to-right
 * the same way the sparkline renders.
 */
export function buzzHistogram(
  checkins: ActivityRow[],
  eventId: string,
  now: number = Date.now()
): HistogramBucket[] {
  return bucketActivity(checkins, eventId, WINDOW_MS, now);
}

/** Same shape as buzzHistogram but for "going" RSVPs over a longer 2h window (going happens ahead of time, not just in-the-moment). */
export function goingHistogram(
  going: ActivityRow[],
  eventId: string,
  now: number = Date.now()
): HistogramBucket[] {
  return bucketActivity(going, eventId, GOING_WINDOW_MS, now);
}

/** Convenience: how many checkins landed in the most recent bucket window (e.g. "▲ 3 in 15 min"). */
export function recentCount(checkins: ActivityRow[], eventId: string, windowMs: number, now: number = Date.now()): number {
  const cutoff = now - windowMs;
  return checkins.filter((c) => c.event_id === eventId && new Date(c.created_at).getTime() >= cutoff).length;
}
