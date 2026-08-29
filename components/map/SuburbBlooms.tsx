"use client";

import { Marker } from "react-map-gl/maplibre";

import type { SuburbRow } from "@/lib/types";

export interface SuburbAggregate {
  eventCount: number;
  hereNow: number;
  buzz: number; // 0-1, normalized against the busiest suburb
}

interface SuburbBloomsProps {
  suburbs: SuburbRow[];
  aggregates: Map<string, SuburbAggregate>;
  onSelect: (suburbId: string) => void;
}

// Fixed footprint for every suburb marker — deliberately not scaled by
// event count or people count, so one busy suburb (e.g. the CBD with 17
// events) doesn't visually swallow the rest of the map. Buzz still reads
// through glow/label opacity below, just not through size.
const BLOOM_SIZE = 220;
const NAME_SIZE = 20;

/**
 * City-zoom radial "bloom" per suburb — the ambient, non-clickable-pin view
 * of buzz before zooming into individual events. Opacity/label weight scale
 * with that suburb's aggregate buzz; buzz is carried by darkness, never hue
 * (Desktop App Greyscale.dc.html).
 */
export function SuburbBlooms({ suburbs, aggregates, onSelect }: SuburbBloomsProps) {
  return (
    <>
      {suburbs.map((suburb) => {
        const agg = aggregates.get(suburb.id) ?? { eventCount: 0, hereNow: 0, buzz: 0 };
        if (agg.eventCount === 0) return null;

        const size = BLOOM_SIZE;
        const coreAlpha = 0.1 + agg.buzz * 0.4;
        const nameSize = NAME_SIZE;
        const nameOpacity = 0.42 + agg.buzz * 0.44;

        return (
          <Marker
            key={suburb.id}
            longitude={suburb.centroid_lng}
            latitude={suburb.centroid_lat}
            anchor="center"
          >
            <button
              type="button"
              onClick={() => onSelect(suburb.id)}
              className="relative flex cursor-pointer flex-col items-center gap-1 bg-transparent p-0"
              style={{ width: size, height: size }}
              aria-label={`${suburb.name}, ${agg.eventCount} events`}
            >
              <span
                className="pointer-events-none absolute inset-0 rounded-full"
                style={{
                  background: `radial-gradient(circle, rgba(250,250,250,${coreAlpha}), rgba(250,250,250,${coreAlpha * 0.3}) 44%, rgba(250,250,250,0) 72%)`,
                }}
              />
              <span className="pointer-events-none absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1 whitespace-nowrap">
                <span
                  className="font-serif leading-none"
                  style={{ fontSize: nameSize, color: `rgba(250,250,250,${nameOpacity})` }}
                >
                  {suburb.name}
                </span>
                <span className="font-mono text-[10px] font-medium tracking-[0.12em] text-ink-950/50">
                  {agg.eventCount} EVENTS{agg.hereNow > 0 ? ` · ${agg.hereNow} HERE${agg.hereNow > 1 ? " NOW" : ""}` : ""}
                </span>
              </span>
            </button>
          </Marker>
        );
      })}
    </>
  );
}
