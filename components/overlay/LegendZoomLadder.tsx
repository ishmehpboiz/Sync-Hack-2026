"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, ChevronDown, ChevronUp } from "lucide-react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ViewState } from "@/lib/types";

interface LegendZoomLadderProps {
  view: ViewState;
}

const BANDS: { key: "city" | "suburb" | "event"; label: string }[] = [
  { key: "city", label: "CITY" },
  { key: "suburb", label: "SUBURB" },
  { key: "event", label: "EVENT" },
];

export function LegendZoomLadder({ view }: LegendZoomLadderProps) {
  const activeBand = view === "quiz" ? "city" : view;
  const [open, setOpen] = useState(true);

  return (
    <div className="pointer-events-auto absolute bottom-8 left-8 w-[250px]">
      <Card className="p-5">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-center justify-between gap-1.5 font-mono text-[10px] font-medium tracking-[0.14em] text-ink-950/45"
        >
          <span className="flex items-center gap-1.5">
            <Activity className="h-3 w-3" strokeWidth={2} />
            BUZZ · LAST 60 MIN
          </span>
          {open ? <ChevronUp className="h-3.5 w-3.5" strokeWidth={2} /> : <ChevronDown className="h-3.5 w-3.5" strokeWidth={2} />}
        </button>

        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div
                className="mt-3 h-3.5 border border-ink-950/12"
                style={{ background: "linear-gradient(90deg,#101010 40%,#5e5e5e 65%,#b4b4b4 85%,#f4f4f4)" }}
              />
              <div className="mt-2 flex justify-between font-mono text-[9px] font-medium text-ink-950/50">
                <span>QUIET</span>
                <span>BUZZING</span>
              </div>

              <div className="mt-[18px] flex flex-col gap-2">
                <LegendRow swatch={<span className="h-[13px] w-[13px] rounded-full border-2 border-ink-10 bg-ink-900" />} label="people here now" />
                <LegendRow swatch={<span className="h-[13px] w-[13px] rounded-full border-2 border-ink-10 bg-ink-900/30" />} label="going, not arrived" />
                <LegendRow swatch={<span className="h-[13px] w-[13px] rounded-full border-2 border-ink-950/34" />} label="no activity yet" />
              </div>

              <div className="mt-5 font-mono text-[10px] font-medium tracking-[0.14em] text-ink-950/45">ZOOM</div>
              <div className="mt-2.5 flex gap-1">
                {BANDS.map((band) => (
                  <span
                    key={band.key}
                    className={cn("h-1.5 flex-1", band.key === activeBand ? "bg-ink-900" : "bg-ink-950/16")}
                  />
                ))}
              </div>
              <div className="mt-2 flex justify-between font-mono text-[9px] font-medium text-ink-950/42">
                {BANDS.map((band) => (
                  <span key={band.key}>{band.label}</span>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </div>
  );
}

function LegendRow({ swatch, label }: { swatch: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2.5 text-xs text-ink-950/72">
      {swatch}
      {label}
    </div>
  );
}
