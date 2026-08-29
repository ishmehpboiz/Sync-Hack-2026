"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutGrid,
  Music,
  PartyPopper,
  HandHeart,
  Users,
  Landmark,
  Palette,
  Accessibility,
  Moon,
  Check,
  Filter,
  ChevronDown,
  ChevronUp,
  type LucideIcon,
} from "lucide-react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { EventCategory } from "@/lib/types";

const CATEGORY_ICONS: Record<EventCategory, LucideIcon> = {
  concert: Music,
  festival: PartyPopper,
  charity: HandHeart,
  ngo: Users,
  historical: Landmark,
  cultural: Palette,
};

interface CategoryCount {
  category: EventCategory;
  count: number;
}

interface FilterBarProps {
  categories: CategoryCount[];
  totalCount: number;
  activeCategories: Set<EventCategory>;
  accessibilityOnly: boolean;
  tonightOnly: boolean;
  onToggleCategory: (category: EventCategory) => void;
  onClearCategories: () => void;
  onToggleAccessibility: () => void;
  onToggleTonight: () => void;
}

const chipClass = (active: boolean) =>
  cn(
    "flex min-h-[44px] items-center gap-1.5 px-3 font-mono text-[10px] font-medium tracking-[0.08em]",
    active ? "bg-ink-900 text-ink-10" : "border border-ink-950/18 text-ink-950/62"
  );

export function FilterBar({
  categories,
  totalCount,
  activeCategories,
  accessibilityOnly,
  tonightOnly,
  onToggleCategory,
  onClearCategories,
  onToggleAccessibility,
  onToggleTonight,
}: FilterBarProps) {
  const [open, setOpen] = useState(true);
  const activeCount = activeCategories.size + (accessibilityOnly ? 1 : 0) + (tonightOnly ? 1 : 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: 0.05 }}
      className="pointer-events-auto absolute right-8 top-7"
    >
      <Card className="flex items-stretch gap-2.5 px-3.5 py-3">
        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.2 }}
              className="flex items-stretch gap-2.5 overflow-hidden"
            >
              <div className="flex flex-wrap gap-1.5">
                <button type="button" onClick={onClearCategories} className={chipClass(activeCategories.size === 0)}>
                  <LayoutGrid className="h-3 w-3" strokeWidth={2} />
                  ALL {totalCount}
                </button>
                {categories.map(({ category, count }) => {
                  const Icon = CATEGORY_ICONS[category];
                  return (
                    <button
                      key={category}
                      type="button"
                      onClick={() => onToggleCategory(category)}
                      className={chipClass(activeCategories.has(category))}
                    >
                      <Icon className="h-3 w-3" />
                      {category.toUpperCase()} {count}
                    </button>
                  );
                })}
              </div>
              <span className="w-px flex-none bg-ink-950/14" />
              <div className="flex flex-none items-center gap-1.5">
                <button type="button" onClick={onToggleAccessibility} className={chipClass(accessibilityOnly)}>
                  <Accessibility className="h-3 w-3" strokeWidth={2} />
                  ACCESS
                  {accessibilityOnly && <Check className="h-3 w-3" strokeWidth={2.5} />}
                </button>
                <button type="button" onClick={onToggleTonight} className={chipClass(tonightOnly)}>
                  <Moon className="h-3 w-3" strokeWidth={2} />
                  TONIGHT
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Collapse" : "Expand"}
          className="flex min-h-[44px] flex-none items-center gap-1.5 border border-ink-950/20 px-2.5 text-ink-950/60"
        >
          {!open && <Filter className="h-3 w-3" strokeWidth={2} />}
          {!open && activeCount > 0 && (
            <span className="font-mono text-[9px] font-medium tracking-[0.08em]">{activeCount}</span>
          )}
          {open ? <ChevronUp className="h-3.5 w-3.5" strokeWidth={2} /> : <ChevronDown className="h-3.5 w-3.5" strokeWidth={2} />}
        </button>
      </Card>
    </motion.div>
  );
}
