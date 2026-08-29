"use client";

import { useMemo } from "react";
import { Source, Layer, type LayerProps } from "react-map-gl/maplibre";

import { toHeatmapGeoJSON, heatmapLayerStyle, type HeatmapSourceEvent } from "@/lib/heatmapGeoJson";
import type { BuzzBreakdown } from "@/lib/buzzScore";

// heatmapLayerStyle (lib/heatmapGeoJson.ts) is plain untyped JS so it stays
// react-map-gl-agnostic in the shared lib — cast it to LayerProps here at
// the one place it's actually handed to a <Layer>.
const heatmapLayer = heatmapLayerStyle as LayerProps;

interface HeatmapLayerProps {
  events: HeatmapSourceEvent[];
  buzzScores: Map<string, BuzzBreakdown>;
}

export function HeatmapLayer({ events, buzzScores }: HeatmapLayerProps) {
  const data = useMemo(() => toHeatmapGeoJSON(events, buzzScores), [events, buzzScores]);

  return (
    <Source id="buzz-heatmap-source" type="geojson" data={data}>
      <Layer {...heatmapLayer} />
    </Source>
  );
}
