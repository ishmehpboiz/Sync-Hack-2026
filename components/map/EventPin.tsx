"use client";

import { motion } from "framer-motion";
import { Marker } from "react-map-gl/maplibre";

import { CATEGORY_ICONS, CATEGORY_COLORS } from "@/lib/categoryIcons";
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
 *
 * The category icon+color is a deliberate exception to the app's greyscale
 * "no hue anywhere" rule elsewhere — requested so event types are readable
 * at a glance on the map. Pin size has a floor well above the glow-driven
 * minimum so the icon stays legible even on a quiet, no-activity event.
 */
export function EventPin({ event, buzz, opacity, selected, onSelect }: EventPinProps) {
  const hasActivity = buzz.glowIntensity > 0;
  const size = selected ? 46 : 30 + buzz.glowIntensity * 16;
  const fillAlpha = hasActivity ? 0.34 + buzz.glowIntensity * 0.66 : 0;
  const ringDuration = 2.6 - buzz.glowIntensity * 1.1; // busier events pulse faster
  const Icon = CATEGORY_ICONS[event.category];
  const color = CATEGORY_COLORS[event.category];

  return (
    <Marker longitude={event.lng} latitude={event.lat} anchor="bottom">
      <button
        type="button"
        onClick={() => onSelect(event.id)}
        className="relative flex min-h-[44px] min-w-[44px] cursor-pointer flex-col items-center justify-end gap-2 bg-transparent p-0"
        style={{ opacity }}
        aria-label={event.title}
      >
        <span className="relative flex items-center justify-center" style={{ width: size, height: size }}>
          <span
            className="absolute inset-0 rounded-full border-white"
            style={{
              background: hasActivity ? `rgba(250,250,250,${fillAlpha})` : "rgba(15,15,15,0.55)",
              borderWidth: selected ? 4 : 3,
              borderColor: color,
              boxShadow: selected ? `0 6px 24px ${color}99` : `0 3px 14px ${color}66`,
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
          <Icon
            className="relative"
            style={{ width: size * 0.52, height: size * 0.52, color }}
            strokeWidth={2.25}
          />
        </span>
        {buzz.checkinCount > 0 && (
          <span className="whitespace-nowrap rounded-md bg-ink-900 px-2 py-1 font-mono text-[10px] font-medium tracking-[0.06em] text-ink-10">
            {buzz.checkinCount} HERE
          </span>
        )}
      </button>
    </Marker>
  );
}
