// The single most important interaction in the app (handoff doc, section
// 3/9): checkin write -> Realtime broadcast -> visible pin update on every
// open client, in ~1s. This wraps the Postgres Changes subscription pattern
// so the map component doesn't have to know about channel plumbing.

import { supabase } from "./supabaseClient";

export interface CheckinRow {
  id: string;
  event_id: string;
  session_id: string;
  created_at: string;
}

export interface GoingRow {
  id: string;
  event_id: string;
  session_id: string;
  created_at: string;
}

/**
 * Subscribes to every new checkin row. Call once (e.g. in the map's root
 * component) and fan the events out to whatever recomputes buzz_score.
 * Returns an unsubscribe function — call it on unmount.
 */
export function subscribeToCheckins(onInsert: (row: CheckinRow) => void): () => void {
  const channel = supabase
    .channel("checkins-realtime")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "checkins" },
      (payload) => onInsert(payload.new as CheckinRow)
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/** Same pattern as subscribeToCheckins, for the "going" pre-commitment table. */
export function subscribeToGoing(onInsert: (row: GoingRow) => void): () => void {
  const channel = supabase
    .channel("going-realtime")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "going" },
      (payload) => onInsert(payload.new as GoingRow)
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/** Writes a checkin. This is the tap that must never fail during the demo. */
export async function writeCheckin(eventId: string, sessionId: string): Promise<void> {
  const { error } = await supabase.from("checkins").insert({ event_id: eventId, session_id: sessionId });
  if (error) throw error;
}

/** Writes a "going" row. Unique per (event_id, session_id) — safe to call more than once. */
export async function writeGoing(eventId: string, sessionId: string): Promise<void> {
  const { error } = await supabase.from("going").insert({ event_id: eventId, session_id: sessionId });
  // 23505 = unique_violation: user already marked "going" for this event, not a real error.
  if (error && error.code !== "23505") throw error;
}

/**
 * Fetches all checkins/going created after `sinceIso`, for computing initial
 * buzz scores on page load before any live events have arrived.
 */
export async function fetchRecentActivity(sinceIso: string): Promise<{ checkins: CheckinRow[]; going: GoingRow[] }> {
  const [checkinsRes, goingRes] = await Promise.all([
    supabase.from("checkins").select("*").gte("created_at", sinceIso),
    supabase.from("going").select("*").gte("created_at", sinceIso),
  ]);
  if (checkinsRes.error) throw checkinsRes.error;
  if (goingRes.error) throw goingRes.error;
  return { checkins: checkinsRes.data as CheckinRow[], going: goingRes.data as GoingRow[] };
}
