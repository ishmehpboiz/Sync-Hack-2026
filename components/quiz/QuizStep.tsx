"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

interface QuizOption {
  value: string;
  label: string;
}

interface QuizStepProps {
  title: string;
  subtitle: string;
  icon?: LucideIcon;
  options: QuizOption[];
  selected: string[];
  onToggle: (value: string) => void;
}

/** Generic option-chip renderer for one quiz question — energy/social/timeBudget/vibe all share this shape. */
export function QuizStep({ title, subtitle, icon: Icon, options, selected, onToggle }: QuizStepProps) {
  return (
    <motion.div
      key={title}
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -16 }}
      transition={{ duration: 0.22 }}
    >
      {Icon && <Icon className="mb-3 h-7 w-7 text-ink-950/70" strokeWidth={1.5} />}
      <div className="max-w-[22ch] font-serif text-[52px] leading-[1.04] tracking-[-0.015em]">{title}</div>
      <div className="mt-3 text-sm text-ink-950/55">{subtitle}</div>
      <div className="mt-[26px] flex flex-wrap gap-2.5">
        {options.map((opt) => {
          const active = selected.includes(opt.value);
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onToggle(opt.value)}
              className={cn(
                "min-h-[44px] rounded-lg px-[22px] py-4 text-base transition-colors",
                active ? "bg-ink-900 text-ink-10" : "border border-white/15 bg-white/5 backdrop-blur-md text-ink-950"
              )}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}
