"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

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
  onSeeAll: () => void;
  onNext: () => void;
}

export function SuburbHeroDrawer({
  suburb,
  matchScore,
  rank,
  totalSuburbs,
  events,
  buzzScores,
  onEventClick,
  onSeeAll,
  onNext,
}: SuburbHeroDrawerProps) {
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
  const preview = ranked.slice(0, 3);

  return (
    <motion.aside
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 24 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="pointer-events-auto absolute bottom-8 right-8 top-[120px] flex w-[400px] flex-col bg-ink-5/96 p-7 shadow-[-14px_0_44px_rgba(15,15,15,0.12)] backdrop-blur-lg"
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

      <div className="mt-6 font-mono text-[10px] font-medium tracking-[0.14em] text-ink-950/45">
        VIBE VECTOR
      </div>
      <div className="mt-3.5 flex flex-col gap-2.5">
        {vibeRows.map((row) => (
          <div key={row.label} className="flex items-center gap-3">
            <span className="w-[78px] font-mono text-[10px] font-medium text-ink-950/60">{row.label}</span>
            <span className="h-2 flex-1 bg-ink-950/10">
              <span className="block h-2 bg-ink-900" style={{ width: `${row.value}%` }} />
            </span>
            <span className="w-[26px] text-right font-mono text-[10px] font-medium">{row.value}</span>
          </div>
        ))}
      </div>

      <div className="mt-7 flex items-baseline justify-between">
        <span className="font-mono text-[10px] font-medium tracking-[0.14em] text-ink-950/45">
          HAPPENING NOW
        </span>
        <span className="font-mono text-[10px] font-medium tracking-[0.14em] text-ink-950/35">
          {events.length} EVENTS
        </span>
      </div>
      <div className="mt-3 flex flex-col gap-px border border-ink-950/12 bg-ink-950/12">
        {preview.map((event) => {
          const buzz = buzzScores.get(event.id);
          const hasActivity = (buzz?.glowIntensity ?? 0) > 0;
          return (
            <button
              key={event.id}
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
        })}
      </div>

      <div className="mt-auto flex gap-2.5 pt-6">
        <Button variant="primary" className="flex-1" onClick={onSeeAll}>
          SEE ALL {events.length} EVENTS
        </Button>
        <Button variant="outline" onClick={onNext} className="gap-1.5">
          NEXT
          <ArrowRight className="h-3 w-3" strokeWidth={2} />
        </Button>
      </div>
    </motion.aside>
  );
}
