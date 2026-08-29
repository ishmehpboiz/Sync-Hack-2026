"use client";

import { useEffect, useState } from "react";

import { supabase } from "@/lib/supabaseClient";
import type { EventRow, SuburbRow } from "@/lib/types";

interface EventsAndSuburbs {
  events: EventRow[];
  suburbs: SuburbRow[];
  loading: boolean;
  error: string | null;
}

/** One-time fetch of the seeded suburbs/events tables — these don't change live, unlike checkins/going. */
export function useEventsAndSuburbs(): EventsAndSuburbs {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [suburbs, setSuburbs] = useState<SuburbRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const [eventsRes, suburbsRes] = await Promise.all([
        supabase.from("events").select("*"),
        supabase.from("suburbs").select("*"),
      ]);

      if (cancelled) return;

      if (eventsRes.error || suburbsRes.error) {
        setError(eventsRes.error?.message ?? suburbsRes.error?.message ?? "Failed to load map data");
        setLoading(false);
        return;
      }

      setEvents((eventsRes.data as EventRow[]) ?? []);
      setSuburbs((suburbsRes.data as SuburbRow[]) ?? []);
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { events, suburbs, loading, error };
}
