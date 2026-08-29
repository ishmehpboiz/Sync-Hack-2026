// Converts events + live buzz scores into the GeoJSON shape MapLibre GL's
// native `heatmap` layer type expects. There is no external "heatmap API" —
// per the handoff doc (section 5), the heatmap is a map layer rendered
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
 * Builds a GeoJSON FeatureCollection ready to hand straight to a MapLibre
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
 * MapLibre layer style config for the heatmap — drop this straight into a
 * react-map-gl <Layer>. Weight ramps intensity, zoom ramps radius so it
 * cross-fades into individual pins as the viewer zooms in.
 *
 * The color ramp is quantized into flat bands with sharp edges (rather than
 * one smooth gradient) so each point's gaussian falloff reads as distinct
 * concentric rings radiating outward — like a contour map — instead of a
 * single blurred blob. Small, tight radius keeps the rings legible around
 * individual points instead of smearing together.
 */
export const heatmapLayerStyle = {
  id: "buzz-heatmap",
  type: "heatmap" as const,
  paint: {
    "heatmap-weight": ["get", "weight"],
    "heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 10, 1, 15, 1.8],
    "heatmap-color": [
      "interpolate",
      ["linear"],
      ["heatmap-density"],
      0,
      "rgba(250,250,250,0)",
      0.14,
      "rgba(250,250,250,0)",
      0.15,
      "rgba(94,94,94,0.4)", // ring 1
      0.34,
      "rgba(94,94,94,0.4)",
      0.35,
      "rgba(140,140,140,0.55)", // ring 2
      0.54,
      "rgba(140,140,140,0.55)",
      0.55,
      "rgba(185,185,185,0.7)", // ring 3
      0.74,
      "rgba(185,185,185,0.7)",
      0.75,
      "rgba(225,225,225,0.85)", // ring 4
      0.89,
      "rgba(225,225,225,0.85)",
      0.9,
      "rgba(250,250,250,0.96)", // core
      1,
      "rgba(250,250,250,0.96)",
    ],
    "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 10, 12, 15, 26],
    // Fully off at city zoom (SuburbBlooms owns that view) and off again once
    // pins take over; only visible in the suburb-zoom band between them.
    "heatmap-opacity": ["interpolate", ["linear"], ["zoom"], 11.5, 0, 13, 1, 15, 1, 16.2, 0],
  },
};
