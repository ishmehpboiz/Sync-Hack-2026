"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { computeBuzzScores } from "@/lib/buzzScore";
import { getSessionId } from "@/lib/supabaseClient";
import {
  fetchRecentActivity,
  subscribeToCheckins,
  subscribeToGoing,
  writeCheckin,
  writeGoing,
  type CheckinRow,
  type GoingRow,
} from "@/lib/realtime";

const ACTIVITY_LOOKBACK_MS = 2 * 60 * 60 * 1000; // 2h — comfortably covers the 60-min buzz/histogram window
const RECOMPUTE_INTERVAL_MS = 15_000; // ticks buzz decay even with no new inserts

/**
 * The single realtime subscription for the whole app (mounted once at the
 * MapExperience root, never per-view) — check-in write -> Realtime insert ->
 * every subscribed client recomputes buzz. See lib/realtime.ts.
 */
export function useLiveActivity() {
  const [checkins, setCheckins] = useState<CheckinRow[]>([]);
  const [going, setGoing] = useState<GoingRow[]>([]);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    let cancelled = false;
    const sinceIso = new Date(Date.now() - ACTIVITY_LOOKBACK_MS).toISOString();

    fetchRecentActivity(sinceIso)
      .then(({ checkins, going }) => {
        if (cancelled) return;
        setCheckins(checkins);
        setGoing(going);
      })
      .catch((err) => {
        // Non-fatal — the map still renders with zero activity; checkins/going just start empty until Realtime inserts arrive.
        console.error("fetchRecentActivity failed:", err);
      });

    const unsubCheckins = subscribeToCheckins((row) => {
      setCheckins((prev) => (prev.some((c) => c.id === row.id) ? prev : [...prev, row]));
    });
    const unsubGoing = subscribeToGoing((row) => {
      setGoing((prev) => (prev.some((g) => g.id === row.id) ? prev : [...prev, row]));
    });

    return () => {
      cancelled = true;
      unsubCheckins();
      unsubGoing();
    };
  }, []);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), RECOMPUTE_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  const buzzScores = useMemo(() => computeBuzzScores(checkins, going, now), [checkins, going, now]);

  const checkIn = useCallback(async (eventId: string) => {
    await writeCheckin(eventId, getSessionId());
  }, []);

  const markGoing = useCallback(async (eventId: string) => {
    await writeGoing(eventId, getSessionId());
  }, []);

  return { checkins, going, buzzScores, checkIn, markGoing };
}
