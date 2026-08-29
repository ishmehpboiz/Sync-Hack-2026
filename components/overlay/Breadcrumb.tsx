"use client";

import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";

import { Card } from "@/components/ui/card";

interface BreadcrumbProps {
  suburbName: string;
  eventCount: number;
  hereNow: number;
  onBack: () => void;
  onSuburbClick: () => void;
}

export function Breadcrumb({ suburbName, eventCount, hereNow, onBack, onSuburbClick }: BreadcrumbProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="pointer-events-auto absolute left-8 top-7"
    >
      <Card className="flex items-center gap-4 px-5 py-[15px]">
        <button
          type="button"
          onClick={onBack}
          className="flex min-h-[44px] items-center gap-1.5 font-mono text-[10px] font-medium tracking-[0.1em] text-ink-950/50 hover:text-ink-950"
        >
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} />
          CITY
        </button>
        <span className="h-5 w-px bg-ink-950/16" />
        <button type="button" onClick={onSuburbClick} className="font-serif text-2xl leading-none">
          {suburbName}
        </button>
        <span className="relative inline-flex h-2 w-2">
          <span className="absolute inset-0 rounded-full bg-ink-900" />
          <span className="absolute inset-0 animate-ring rounded-full bg-ink-900/45" />
        </span>
        <span className="font-mono text-[10px] font-medium tracking-[0.1em] text-ink-950/55">
          {eventCount} EVENTS{hereNow > 0 ? ` · ${hereNow} HERE` : ""}
        </span>
      </Card>
    </motion.div>
  );
}
