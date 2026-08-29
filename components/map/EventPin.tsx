"use client";

import { motion } from "framer-motion";
import { Marker } from "react-map-gl/maplibre";

import type { EventRow } from "@/lib/types";
import type { BuzzBreakdown } from "@/lib/buzzScore";

interface EventPinProps {
  event: EventRow;
  buzz: BuzzBreakdown;
  opacity: number; // from opacityForMatch — 0.35 floor, never fully hidden
  selected: boolean;
  onSelect: (eventId: string) => void;
}

/**
 * A single event marker. Darkness/size = glowIntensity (buzz), opacity =
 * quiz match (dimmed floor, never hidden) — the two signals stay visually
 * distinct per the design's own annotation:
 * "Pin darkness ← buzzScore.glowIntensity · pin opacity ← opacityForMatch()"
 */
export function EventPin({ event, buzz, opacity, selected, onSelect }: EventPinProps) {
  const hasActivity = buzz.glowIntensity > 0;
  const size = selected ? 38 : 16 + buzz.glowIntensity * 14;
  const fillAlpha = hasActivity ? 0.34 + buzz.glowIntensity * 0.66 : 0;
  const ringDuration = 2.6 - buzz.glowIntensity * 1.1; // busier events pulse faster

  return (
    <Marker longitude={event.lng} latitude={event.lat} anchor="bottom">
      <button
        type="button"
        onClick={() => onSelect(event.id)}
        className="relative flex min-h-[44px] min-w-[44px] cursor-pointer flex-col items-center justify-end gap-2 bg-transparent p-0"
        style={{ opacity }}
        aria-label={event.title}
      >
        <span className="relative" style={{ width: size, height: size }}>
          <span
            className="absolute inset-0 rounded-full border-white"
            style={{
              background: hasActivity ? `rgba(250,250,250,${fillAlpha})` : "transparent",
              borderWidth: selected ? 4 : 3,
              borderColor: "#0f0f0f",
              boxShadow: selected ? "0 6px 24px rgba(15,15,15,0.5)" : "0 4px 16px rgba(15,15,15,0.35)",
            }}
          />
          {hasActivity && (
            <motion.span
              className="absolute inset-0 rounded-full"
              style={{ background: `rgba(250,250,250,${0.28 + buzz.glowIntensity * 0.2})` }}
              animate={{ scale: [0.55, 2.6], opacity: [0.75, 0] }}
              transition={{ duration: ringDuration, repeat: Infinity, ease: "easeOut" }}
            />
          )}
        </span>
        {buzz.checkinCount > 0 && (
          <span className="whitespace-nowrap bg-ink-900 px-2 py-1 font-mono text-[10px] font-medium tracking-[0.06em] text-ink-10">
            {buzz.checkinCount} HERE
          </span>
        )}
      </button>
    </Marker>
  );
}
