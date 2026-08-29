"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Radio, Info, ChevronDown, ChevronUp } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface IdentityBarProps {
  eventCount: number;
  hereNow: number;
}

export function IdentityBar({ eventCount, hereNow }: IdentityBarProps) {
  const [open, setOpen] = useState(true);

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="pointer-events-auto absolute left-8 top-7"
    >
      <Card className="flex items-center gap-4 px-5 py-4">
        <span className="flex items-center gap-2 font-serif text-[28px] leading-none">
          <Radio className="h-5 w-5" strokeWidth={1.75} />
          Pulse
        </span>

        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-4 overflow-hidden"
            >
              <span className="h-6 w-px flex-none bg-ink-950/16" />
              <span className="relative inline-flex h-[9px] w-[9px] flex-none">
                <span className="absolute inset-0 rounded-full bg-ink-900" />
                <span className="absolute inset-0 animate-ring rounded-full bg-ink-900/45" />
              </span>
              <span className="whitespace-nowrap font-mono text-[11px] font-medium leading-[1.5] tracking-[0.1em] text-ink-950/66">
                SYDNEY · {eventCount} EVENTS LIVE
                <br />
                <span className="text-ink-950/42">{hereNow} PEOPLE OUT RIGHT NOW</span>
              </span>
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="ml-1.5 flex min-h-[44px] flex-none items-center gap-1.5 whitespace-nowrap rounded-lg border border-white/15 bg-white/5 backdrop-blur-md px-3 font-mono text-[9px] font-medium tracking-[0.08em] text-ink-950/60"
                  >
                    <Info className="h-3 w-3" strokeWidth={2} />
                    HOW IT WORKS
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-72 text-[13px] leading-relaxed text-ink-950/75">
                  Google Maps tells you what&apos;s there. Pulse shows what fits how you feel right
                  now, where the city&apos;s energy actually is, and which part of the city matches
                  your mood today — updated live as people check in.
                </PopoverContent>
              </Popover>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Collapse" : "Expand"}
          className="flex h-[30px] w-[30px] flex-none items-center justify-center rounded-lg border border-white/15 bg-white/5 backdrop-blur-md text-ink-950/60"
        >
          {open ? <ChevronUp className="h-3.5 w-3.5" strokeWidth={2} /> : <ChevronDown className="h-3.5 w-3.5" strokeWidth={2} />}
        </button>
      </Card>
    </motion.div>
  );
}
