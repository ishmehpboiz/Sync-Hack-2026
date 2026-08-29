"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Zap } from "lucide-react";

import type { CheckinRow } from "@/lib/realtime";
import type { EventRow } from "@/lib/types";

interface CheckinTickerProps {
  checkins: CheckinRow[];
  events: EventRow[];
  visible: boolean;
}

interface TickerEntry {
  id: string;
  title: string;
  createdAt: number;
}

const DISPLAY_MS = 4000;

/** Live "someone just checked in" toast — the visible payoff of the check-in -> Realtime -> pin-glow path. */
export function CheckinTicker({ checkins, events, visible }: CheckinTickerProps) {
  const [entry, setEntry] = useState<TickerEntry | null>(null);
  const seenIds = useRef(new Set<string>());
  const [, forceTick] = useState(0);

  useEffect(() => {
    const latest = checkins[checkins.length - 1];
    if (!latest || seenIds.current.has(latest.id)) return;
    seenIds.current.add(latest.id);

    const event = events.find((e) => e.id === latest.event_id);
    if (!event) return;

    setEntry({ id: latest.id, title: event.title, createdAt: Date.now() });
    const timeout = setTimeout(() => setEntry((cur) => (cur?.id === latest.id ? null : cur)), DISPLAY_MS);
    return () => clearTimeout(timeout);
  }, [checkins, events]);

  useEffect(() => {
    if (!entry) return;
    const id = setInterval(() => forceTick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, [entry]);

  if (!visible) return null;

  const secondsAgo = entry ? Math.max(0, Math.round((Date.now() - entry.createdAt) / 1000)) : 0;

  return (
    <div className="pointer-events-none absolute left-1/2 top-7 -translate-x-1/2">
      <AnimatePresence>
        {entry && (
          <motion.div
            key={entry.id}
            initial={{ opacity: 0, y: -14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -14 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="flex items-center gap-3.5 bg-ink-900 px-5 py-3.5 text-ink-10 shadow-[0_10px_30px_rgba(15,15,15,0.28)]"
          >
            <Zap className="h-3.5 w-3.5" strokeWidth={2} fill="currentColor" />
            <span className="relative inline-flex h-2 w-2">
              <span className="absolute inset-0 rounded-full bg-ink-10" />
              <span className="absolute inset-0 animate-ring rounded-full bg-ink-10/50" />
            </span>
            <span className="font-mono text-[11px] font-medium tracking-[0.1em]">
              SOMEONE JUST CHECKED IN · {entry.title.toUpperCase()}
            </span>
            <span className="font-mono text-[11px] font-medium tracking-[0.1em] text-ink-10/50">
              {secondsAgo}s AGO
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
