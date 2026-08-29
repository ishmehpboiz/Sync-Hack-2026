// Shared category -> icon/color mapping for event categories. Used by both
// FilterBar (grey chip icons, matches the rest of the greyscale UI) and
// EventPin (colorful map icons — a deliberate, requested exception to the
// "no hue anywhere" design language so event types read at a glance on the
// map itself).

import { Music, PartyPopper, HandHeart, Users, Landmark, Palette, type LucideIcon } from "lucide-react";
import type { EventCategory } from "./types";

export const CATEGORY_ICONS: Record<EventCategory, LucideIcon> = {
  concert: Music,
  festival: PartyPopper,
  charity: HandHeart,
  ngo: Users,
  historical: Landmark,
  cultural: Palette,
};

export const CATEGORY_COLORS: Record<EventCategory, string> = {
  concert: "#a78bfa", // violet
  festival: "#fb923c", // orange
  charity: "#fb7185", // rose
  ngo: "#34d399", // emerald
  historical: "#38bdf8", // sky
  cultural: "#e879f9", // fuchsia
};
