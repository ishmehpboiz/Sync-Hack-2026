"use client";

import { forwardRef } from "react";
import Map, { type MapRef } from "react-map-gl/maplibre";

export const SYDNEY_CENTER = { longitude: 151.2093, latitude: -33.8688, zoom: 11.2 };

const MAPTILER_KEY = process.env.NEXT_PUBLIC_MAPTILER_KEY;
// "dataviz" is MapTiler's neutral-grey basemap built for overlaying live data —
// a close match for the approved no-hue design language on its own; the CSS
// grayscale filter below is a belt-and-braces guarantee against any residual hue.
const MAP_STYLE = `https://api.maptiler.com/maps/dataviz-dark/style.json?key=${MAPTILER_KEY}`;

interface MapCanvasProps {
  children?: React.ReactNode;
  onZoomChange: (zoom: number) => void;
  onClick?: () => void;
}

/**
 * The one persistent map instance for the whole app. Never unmount this —
 * the Realtime subscription and the check-in demo path both assume the map
 * stays alive across every view transition (see plan: "single persistent
 * map, not routes").
 *
 * Uses MapLibre GL (not mapbox-gl) so a third-party style host (MapTiler)
 * works without a Mapbox access token — mapbox-gl-js refuses to initialize
 * at all without one, even for non-Mapbox styles; MapLibre has no such
 * requirement. react-map-gl/maplibre is the same component API either way.
 */
export const MapCanvas = forwardRef<MapRef, MapCanvasProps>(function MapCanvas(
  { children, onZoomChange, onClick },
  ref
) {
  return (
    <div className="absolute inset-0 grayscale contrast-[1.05]">
      <Map
        ref={ref}
        initialViewState={SYDNEY_CENTER}
        mapStyle={MAP_STYLE}
        style={{ width: "100%", height: "100%" }}
        onZoom={(e) => onZoomChange(e.viewState.zoom)}
        onClick={onClick}
        attributionControl={false}
      >
        {children}
      </Map>
    </div>
  );
});
