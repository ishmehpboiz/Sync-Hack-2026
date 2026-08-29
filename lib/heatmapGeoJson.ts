// Converts events + live buzz scores into the GeoJSON shape Mapbox GL's
// native `heatmap` layer type expects. There is no external "heatmap API" —
// per the handoff doc (section 5), the heatmap is a Mapbox layer rendered
// client-side from the same checkin/going stream that drives pin glow, just
// weighted and rendered differently. This is the one conversion step
// between our data and that layer.

import type { BuzzBreakdown } from "./buzzScore";
import { getBuzz } from "./buzzScore";

export interface HeatmapSourceEvent {
  id: string;
  lat: number;
  lng: number;
}

export interface HeatmapFeatureCollection {
  type: "FeatureCollection";
  features: {
    type: "Feature";
    properties: { weight: number; eventId: string };
    geometry: { type: "Point"; coordinates: [number, number] };
  }[];
}

/**
 * Builds a GeoJSON FeatureCollection ready to hand straight to a Mapbox
 * `<Source type="geojson" data={...}>` feeding a `type: 'heatmap'` layer.
 * `weight` is each event's glowIntensity (0-1) from computeBuzzScores —
 * the same number driving pin glow, so the heatmap and the pins are always
 * telling the same story. Events with zero activity still get a point at
 * weight 0 rather than being dropped, so the heatmap's extent still
 * reflects "where events are," not just "where checkins have happened" —
 * matches the "no dead map" principle from the UI checklist.
 */
export function toHeatmapGeoJSON(
  events: HeatmapSourceEvent[],
  buzzScores: Map<string, BuzzBreakdown>
): HeatmapFeatureCollection {
  return {
    type: "FeatureCollection",
    features: events.map((e) => ({
      type: "Feature",
      properties: { weight: getBuzz(buzzScores, e.id).glowIntensity, eventId: e.id },
      geometry: { type: "Point", coordinates: [e.lng, e.lat] },
    })),
  };
}

/**
 * Mapbox layer style config for the heatmap — drop this straight into a
 * react-map-gl <Layer>. Weight ramps intensity, zoom ramps radius so it
 * cross-fades into individual pins as the viewer zooms in (handoff doc,
 * "Live heatmap layer" — "cross-fades into individual pins when zoomed in").
 * Colors follow the approved greyscale "no hue anywhere" design language
 * (Desktop App Greyscale.dc.html) — buzz is carried by lightness alone, not
 * color. Ramp runs dark-to-light (rather than light-to-dark) because it sits
 * on the app's dark basemap — high buzz needs to get brighter to read, not
 * darker into invisibility.
 *
 * Tuned for high contrast with a wide "quiet" floor: density has to build up
 * past ~0.4 before anything shows at all, and past that it snaps quickly to
 * bright. Combined with computeBuzzScores' log2 soft-cap and a populated
 * baseline of seeded activity (scripts/seed.ts), this keeps one lone
 * check-in from lighting up as a big, disproportionate blob — it takes real
 * accumulated density nearby to read as "buzzing."
 */
export const heatmapLayerStyle = {
  id: "buzz-heatmap",
  type: "heatmap" as const,
  paint: {
    "heatmap-weight": ["get", "weight"],
    "heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 10, 1, 15, 2],
    "heatmap-color": [
      "interpolate",
      ["linear"],
      ["heatmap-density"],
      0,
      "rgba(250,250,250,0)", // transparent — quiet floor extends out to 0.4
      0.4,
      "rgba(94,94,94,0.5)", // #5e5e5e
      0.65,
      "rgba(180,180,180,0.75)", // #b4b4b4
      0.85,
      "rgba(232,232,232,0.92)", // #e8e8e8
      1,
      "rgba(250,250,250,1)", // #fafafa — buzzing
    ],
    "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 10, 10, 15, 24],
    // Fully off at city zoom (SuburbBlooms owns that view — overlapping the
    // two washed everything out into one big haze) and off again once pins
    // take over; only visible in the suburb-zoom band between them.
    "heatmap-opacity": ["interpolate", ["linear"], ["zoom"], 11.5, 0, 13, 1, 15, 1, 16.2, 0],
  },
};
