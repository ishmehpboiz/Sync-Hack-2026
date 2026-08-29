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
 * Colors follow the brief's dark "control room" palette (section: Frontend
 * direction) — electric cyan/blue buzz glow.
 */
export const heatmapLayerStyle = {
  id: "buzz-heatmap",
  type: "heatmap" as const,
  paint: {
    "heatmap-weight": ["get", "weight"],
    "heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 10, 1, 15, 3],
    "heatmap-color": [
      "interpolate",
      ["linear"],
      ["heatmap-density"],
      0,
      "rgba(10,14,26,0)", // background navy, transparent
      0.2,
      "rgba(56,189,248,0.3)", // cyan, low density
      0.5,
      "rgba(56,189,248,0.6)",
      0.8,
      "rgba(34,211,238,0.85)",
      1,
      "rgba(165,243,252,1)", // near-white cyan at peak
    ],
    "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 10, 15, 15, 30],
    "heatmap-opacity": ["interpolate", ["linear"], ["zoom"], 13, 1, 16, 0],
  },
};
