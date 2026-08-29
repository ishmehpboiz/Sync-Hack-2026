"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ChevronDown, ChevronUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { SuburbRow, EventRow } from "@/lib/types";
import type { BuzzBreakdown } from "@/lib/buzzScore";

interface VibeRow {
  label: string;
  value: number;
}

interface SuburbHeroDrawerProps {
  suburb: SuburbRow;
  matchScore: number | null; // null if quiz hasn't been taken
  rank: number;
  totalSuburbs: number;
  events: EventRow[];
  buzzScores: Map<string, BuzzBreakdown>;
  onEventClick: (eventId: string) => void;
  onNext: () => void;
}

function EventListRow({
  event,
  buzz,
  onEventClick,
}: {
  event: EventRow;
  buzz: BuzzBreakdown | undefined;
  onEventClick: (eventId: string) => void;
}) {
  const hasActivity = (buzz?.glowIntensity ?? 0) > 0;
  return (
    <button
      type="button"
      onClick={() => onEventClick(event.id)}
      className="flex min-h-[44px] items-center gap-3 bg-ink-5 px-4 py-3.5 text-left"
    >
      <span
        className="h-[11px] w-[11px] flex-none rounded-full"
        style={{
          background: hasActivity ? "#f7f7f7" : "transparent",
          border: hasActivity ? "none" : "2px solid rgba(250,250,250,0.4)",
        }}
      />
      <span className="flex flex-1 flex-col gap-0.5">
        <span className="text-sm text-ink-950">{event.title}</span>
        <span className="font-mono text-[9px] font-medium tracking-[0.08em] text-ink-950/45">
          {event.category.toUpperCase()}
          {event.energy_tag ? ` · ${event.energy_tag.toUpperCase()} ENERGY` : ""}
        </span>
      </span>
      <span className="font-mono text-[11px] text-ink-950/70">{buzz?.checkinCount ?? 0}</span>
    </button>
  );
}

export function SuburbHeroDrawer({
  suburb,
  matchScore,
  rank,
  totalSuburbs,
  events,
  buzzScores,
  onEventClick,
  onNext,
}: SuburbHeroDrawerProps) {
  const [vibeOpen, setVibeOpen] = useState(true);
  const [showAllEvents, setShowAllEvents] = useState(false);

  const vibeRows: VibeRow[] = [
    { label: "FOOD", value: suburb.food_score },
    { label: "NIGHTLIFE", value: suburb.nightlife_score },
    { label: "SHOPPING", value: suburb.shopping_score },
    { label: "ACTIVITIES", value: suburb.activities_score },
    { label: "SIGHTS", value: suburb.sightseeing_score },
  ];

  const ranked = [...events].sort(
    (a, b) => (buzzScores.get(b.id)?.buzzScore ?? 0) - (buzzScores.get(a.id)?.buzzScore ?? 0)
  );
  const visibleEvents = showAllEvents ? ranked : ranked.slice(0, 3);

  return (
    <motion.aside
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 24 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="pointer-events-auto absolute bottom-8 right-8 top-[120px] flex w-[400px] flex-col overflow-hidden rounded-2xl bg-ink-5/75 p-7 shadow-[-14px_0_44px_rgba(15,15,15,0.3)] backdrop-blur-xl border border-white/10"
    >
      <div className="flex items-baseline justify-between">
        <span className="font-mono text-[10px] font-medium tracking-[0.14em] text-ink-950/50">
          {matchScore !== null ? `${matchScore}% VIBE MATCH` : "NO VIBE SET"}
        </span>
        <span className="font-mono text-[10px] font-medium tracking-[0.14em] text-ink-950/35">
          RANK {rank} OF {totalSuburbs}
        </span>
      </div>

      <div className="mt-3 font-serif text-[46px] leading-[1.02] tracking-[-0.01em]">{suburb.name}</div>
      <div className="mt-3 text-sm leading-relaxed text-ink-950/68">{suburb.summary_text}</div>

      {/* Bounded scroll area — everything below the header scrolls inside the
          drawer itself instead of spilling past it and dragging the whole
          page into a runaway scroll once a suburb has a lot of events. */}
      <div className="mt-6 flex min-h-0 flex-1 flex-col overflow-y-auto">
        <button
          type="button"
          onClick={() => setVibeOpen((v) => !v)}
          className="flex min-h-[32px] w-full items-center justify-between font-mono text-[10px] font-medium tracking-[0.14em] text-ink-950/45"
        >
          VIBE VECTOR
          {vibeOpen ? <ChevronUp className="h-3.5 w-3.5" strokeWidth={2} /> : <ChevronDown className="h-3.5 w-3.5" strokeWidth={2} />}
        </button>
        <AnimatePresence initial={false}>
          {vibeOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="mt-3.5 flex flex-col gap-2.5">
                {vibeRows.map((row) => (
                  <div key={row.label} className="flex items-center gap-3">
                    <span className="w-[78px] font-mono text-[10px] font-medium text-ink-950/60">{row.label}</span>
                    <span className="h-2 flex-1 rounded-full bg-ink-950/10">
                      <span className="block h-2 rounded-full bg-ink-900" style={{ width: `${row.value}%` }} />
                    </span>
                    <span className="w-[26px] text-right font-mono text-[10px] font-medium">{row.value}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-7 flex items-baseline justify-between">
          <span className="font-mono text-[10px] font-medium tracking-[0.14em] text-ink-950/45">
            HAPPENING NOW
          </span>
          <span className="font-mono text-[10px] font-medium tracking-[0.14em] text-ink-950/35">
            {events.length} EVENTS
          </span>
        </div>
        <div className="mt-3 flex shrink-0 flex-col gap-px overflow-hidden rounded-lg border border-white/10 bg-white/5">
          {visibleEvents.map((event) => (
            <EventListRow key={event.id} event={event} buzz={buzzScores.get(event.id)} onEventClick={onEventClick} />
          ))}
        </div>
      </div>

      <div className="flex flex-none gap-2.5 pt-6">
        <Button variant="primary" className="flex-1" onClick={() => setShowAllEvents((v) => !v)}>
          {showAllEvents ? "SHOW TOP 3" : `SEE ALL ${events.length} EVENTS`}
        </Button>
        <Button variant="outline" onClick={onNext} className="gap-1.5">
          NEXT
          <ArrowRight className="h-3 w-3" strokeWidth={2} />
        </Button>
      </div>
    </motion.aside>
  );
}
