"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutGrid,
  Accessibility,
  Moon,
  Check,
  Filter,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

import { Card } from "@/components/ui/card";
import { Toggle } from "@/components/ui/toggle";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { CATEGORY_ICONS } from "@/lib/categoryIcons";
import type { EventCategory } from "@/lib/types";

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

  function handleCategoryValueChange(newValue: string[]) {
    const newSet = new Set(newValue);
    for (const cat of activeCategories) {
      if (!newSet.has(cat)) return onToggleCategory(cat);
    }
    for (const cat of newValue) {
      if (!activeCategories.has(cat as EventCategory)) return onToggleCategory(cat as EventCategory);
    }
  }

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
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex items-stretch gap-2.5"
            >
              <div className="flex max-w-[460px] flex-wrap gap-1.5">
                <Toggle pressed={activeCategories.size === 0} onPressedChange={onClearCategories}>
                  <LayoutGrid className="h-3 w-3" strokeWidth={2} />
                  ALL {totalCount}
                </Toggle>
                <ToggleGroup
                  type="multiple"
                  value={Array.from(activeCategories)}
                  onValueChange={handleCategoryValueChange}
                  className="flex flex-wrap gap-1.5"
                >
                  {categories.map(({ category, count }) => {
                    const Icon = CATEGORY_ICONS[category];
                    return (
                      <ToggleGroupItem key={category} value={category}>
                        <Icon className="h-3 w-3" />
                        {category.toUpperCase()} {count}
                      </ToggleGroupItem>
                    );
                  })}
                </ToggleGroup>
              </div>
              <span className="w-px flex-none bg-white/10" />
              <div className="flex flex-none items-center gap-1.5">
                <Toggle pressed={accessibilityOnly} onPressedChange={onToggleAccessibility}>
                  <Accessibility className="h-3 w-3" strokeWidth={2} />
                  ACCESS
                  {accessibilityOnly && <Check className="h-3 w-3" strokeWidth={2.5} />}
                </Toggle>
                <Toggle pressed={tonightOnly} onPressedChange={onToggleTonight}>
                  <Moon className="h-3 w-3" strokeWidth={2} />
                  TONIGHT
                </Toggle>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Collapse" : "Expand"}
          className="flex min-h-[44px] flex-none items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-2.5 text-ink-950/60"
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
