"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { CheckCircle2, CalendarCheck, Check, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { computeMatchScore, type QuizState } from "@/lib/eventMatch";
import { buzzHistogram, goingHistogram, recentCount } from "@/lib/buzzHistogram";
import type { CheckinRow, GoingRow } from "@/lib/realtime";
import type { EventRow } from "@/lib/types";
import type { BuzzBreakdown } from "@/lib/buzzScore";

interface EventDetailDrawerProps {
  event: EventRow;
  buzz: BuzzBreakdown;
  checkins: CheckinRow[];
  going: GoingRow[];
  quizAnswers: QuizState | null;
  rank: number;
  totalInSuburb: number;
  onCheckIn: (eventId: string) => Promise<void>;
  onGoing: (eventId: string) => Promise<void>;
}

function formatTimeRange(start: string | null, end: string | null): string {
  if (!start) return "TIME TBA";
  const startDate = new Date(start);
  const startStr = startDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (!end) return `TODAY · ${startStr}`;
  const endStr = new Date(end).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return `TODAY · ${startStr} – ${endStr}`;
}

export function EventDetailDrawer({
  event,
  buzz,
  checkins,
  going,
  quizAnswers,
  rank,
  totalInSuburb,
  onCheckIn,
  onGoing,
}: EventDetailDrawerProps) {
  const [checkingIn, setCheckingIn] = useState(false);
  const [goingLoading, setGoingLoading] = useState(false);

  const matchScore = quizAnswers
    ? Math.round(computeMatchScore(event, quizAnswers) * 100)
    : null;

  const histogram = buzzHistogram(checkins, event.id);
  const maxCount = Math.max(1, ...histogram.map((b) => b.count));
  const recent15 = recentCount(checkins, event.id, 15 * 60 * 1000);

  const goingHist = goingHistogram(going, event.id);
  const maxGoingCount = Math.max(1, ...goingHist.map((b) => b.count));

  async function handleCheckIn() {
    if (checkingIn) return;
    setCheckingIn(true);
    try {
      await onCheckIn(event.id);
      toast("You checked in!", { description: event.title });
    } catch {
      toast.error("Check-in failed — try again");
    } finally {
      setCheckingIn(false);
    }
  }

  async function handleGoing() {
    setGoingLoading(true);
    try {
      await onGoing(event.id);
    } finally {
      setGoingLoading(false);
    }
  }

  return (
    <motion.aside
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 24 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="pointer-events-auto absolute bottom-8 right-8 top-[120px] flex w-[420px] flex-col overflow-hidden bg-ink-5/97 shadow-[-14px_0_44px_rgba(15,15,15,0.12)] backdrop-blur-lg"
    >
      <div
        className="flex h-[172px] flex-none items-end justify-between border-b border-ink-950/12 px-5 py-4"
        style={{
          backgroundImage: event.image_url ? `url(${event.image_url})` : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundColor: "#1a1a1a",
        }}
      >
        {!event.image_url && (
          <span className="font-mono text-[10px] font-medium tracking-[0.14em] text-ink-950/42">
            EVENTS.IMAGE_URL
          </span>
        )}
        <Badge variant="solid">{event.category}</Badge>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-7 py-6">
        <div className="flex items-baseline justify-between">
          <span className="font-mono text-[10px] font-medium tracking-[0.14em] text-ink-950/50">
            {matchScore !== null ? `${matchScore}% MATCHES YOUR VIBE` : "NO VIBE SET"}
          </span>
          <span className="font-mono text-[10px] font-medium tracking-[0.14em] text-ink-950/35">
            {rank} OF {totalInSuburb}
          </span>
        </div>

        <div className="mt-3 font-serif text-[40px] leading-[1.04] tracking-[-0.01em]">{event.title}</div>
        <div className="mt-3 font-mono text-[11px] font-medium leading-[1.7] tracking-[0.04em] text-ink-950/60">
          {formatTimeRange(event.start_time, event.end_time)}
          <br />
          {event.address?.toUpperCase()}
        </div>
        <div className="mt-3.5 text-sm leading-relaxed text-ink-950/70">{event.description}</div>

        <div className="mt-[18px] flex flex-wrap gap-1.5">
          {event.energy_tag && <Badge>ENERGY · {event.energy_tag.toUpperCase()}</Badge>}
          {event.social_tag && <Badge>SOCIAL · {event.social_tag.toUpperCase()}</Badge>}
          <Badge variant={event.wheelchair_accessible ? "outline" : "dashed"}>
            WHEELCHAIR {event.wheelchair_accessible ? <Check className="h-2.5 w-2.5" strokeWidth={2.5} /> : <X className="h-2.5 w-2.5" strokeWidth={2.5} />}
          </Badge>
          <Badge variant={event.multilingual ? "outline" : "dashed"}>
            MULTILINGUAL {event.multilingual ? <Check className="h-2.5 w-2.5" strokeWidth={2.5} /> : <X className="h-2.5 w-2.5" strokeWidth={2.5} />}
          </Badge>
          <Badge variant={event.sensory_friendly ? "outline" : "dashed"}>
            SENSORY {event.sensory_friendly ? <Check className="h-2.5 w-2.5" strokeWidth={2.5} /> : <X className="h-2.5 w-2.5" strokeWidth={2.5} />}
          </Badge>
        </div>

        <div className="mt-5 border border-ink-950/14 bg-ink-100 p-[18px]">
          <div className="flex items-baseline justify-between">
            <span className="font-mono text-[10px] font-medium tracking-[0.14em] text-ink-950/50">
              BUZZ · LAST 60 MIN
            </span>
            {recent15 > 0 && (
              <span className="font-mono text-[10px] font-medium tracking-[0.14em]">
                ▲ {recent15} IN 15 MIN
              </span>
            )}
          </div>
          <div className="mt-3.5 flex h-[52px] items-end gap-1.5">
            {histogram.map((bucket, i) => (
              <span
                key={bucket.start}
                className="flex-1 bg-ink-950"
                style={{
                  height: `${Math.max(6, (bucket.count / maxCount) * 100)}%`,
                  opacity: bucket.count === 0 ? 0.1 : 0.55 + (bucket.count / maxCount) * 0.45,
                }}
                aria-label={`bucket ${i}: ${bucket.count} checkins`}
              />
            ))}
          </div>
          <div className="mt-2 flex justify-between font-mono text-[10px] font-medium text-ink-950/45">
            <span>{buzz.checkinCount} CHECKED IN</span>
            <span>7.5 MIN BUCKETS</span>
          </div>

          <div className="mt-4 flex items-baseline justify-between border-t border-ink-950/14 pt-3.5">
            <span className="font-mono text-[10px] font-medium tracking-[0.14em] text-ink-950/50">
              GOING · LAST 2 HRS
            </span>
          </div>
          <div className="mt-3.5 flex h-[36px] items-end gap-1.5">
            {goingHist.map((bucket, i) => (
              <span
                key={bucket.start}
                className="flex-1 bg-ink-950"
                style={{
                  height: `${Math.max(6, (bucket.count / maxGoingCount) * 100)}%`,
                  opacity: bucket.count === 0 ? 0.1 : 0.55 + (bucket.count / maxGoingCount) * 0.45,
                }}
                aria-label={`bucket ${i}: ${bucket.count} going`}
              />
            ))}
          </div>
          <div className="mt-2 flex justify-between font-mono text-[10px] font-medium text-ink-950/45">
            <span>{buzz.goingCount} GOING</span>
            <span>15 MIN BUCKETS</span>
          </div>
        </div>

        <div className="mt-auto flex gap-2.5 pt-5">
          <Button
            variant="primary"
            size="lg"
            className="flex-[1.5] shadow-[0_10px_26px_rgba(15,15,15,0.26)]"
            onClick={handleCheckIn}
            disabled={checkingIn}
          >
            <CheckCircle2 className="h-4 w-4" strokeWidth={2} />
            {checkingIn ? "CHECKING IN…" : "I'M HERE NOW"}
          </Button>
          <Button variant="outline" size="lg" className="flex-1" onClick={handleGoing} disabled={goingLoading}>
            <CalendarCheck className="h-4 w-4" strokeWidth={2} />
            GOING
          </Button>
        </div>
      </div>
    </motion.aside>
  );
}
