"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Radio, Activity, Sparkles, CheckCircle2, type LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

const STORAGE_KEY = "pulse-onboarding-seen";

interface OnboardingStep {
  icon: LucideIcon;
  title: string;
  body: string;
}

const STEPS: OnboardingStep[] = [
  {
    icon: Radio,
    title: "Welcome to Pulse",
    body: "A live map of what's actually happening in Sydney right now — not just what's listed, what's buzzing.",
  },
  {
    icon: Activity,
    title: "See the city's real pulse",
    body: "Suburb glow and pin brightness track live check-ins. Brighter means busier right now, not last week.",
  },
  {
    icon: Sparkles,
    title: "Match your vibe",
    body: "Four taps tell us your mood and how much time you've got. We point you at the suburb and events that actually fit.",
  },
  {
    icon: CheckCircle2,
    title: "Check in, make it real",
    body: 'Tap "I\'m here now" at an event and everyone else watching the map sees it update live.',
  },
];

/** First-visit-only walkthrough, gated on localStorage — shown once, skippable, never blocks a returning visitor. */
export function OnboardingOverlay() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) setOpen(true);
    } catch {
      // localStorage unavailable (private browsing, etc.) — skip onboarding rather than block the app.
    }
  }, []);

  function dismiss() {
    setOpen(false);
    try {
      localStorage.setItem(STORAGE_KEY, "true");
    } catch {
      // worst case it just reappears next visit
    }
  }

  if (!open) return null;

  const current = STEPS[step];
  const Icon = current.icon;
  const isLast = step === STEPS.length - 1;

  return (
    <div className="pointer-events-auto absolute inset-0 z-50 flex items-center justify-center bg-ink-100/70 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="flex w-[440px] max-w-[92vw] flex-col overflow-hidden rounded-2xl bg-ink-5/75 p-10 shadow-[0_30px_80px_rgba(15,15,15,0.45)] backdrop-blur-xl border border-white/10"
      >
        <button
          type="button"
          onClick={dismiss}
          className="self-end min-h-[44px] font-mono text-[10px] font-medium tracking-[0.12em] text-ink-950/45 underline"
        >
          SKIP
        </button>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col items-start"
          >
            <Icon className="h-8 w-8 text-ink-950/80" strokeWidth={1.5} />
            <div className="mt-5 font-serif text-[32px] leading-[1.08] tracking-[-0.01em]">
              {current.title}
            </div>
            <div className="mt-3 text-sm leading-relaxed text-ink-950/65">{current.body}</div>
          </motion.div>
        </AnimatePresence>

        <div className="mt-9 flex items-center gap-4">
          <div className="flex flex-1 gap-1.5">
            {STEPS.map((_, i) => (
              <span key={i} className={i <= step ? "h-1 flex-1 rounded-full bg-ink-900" : "h-1 flex-1 rounded-full bg-ink-950/16"} />
            ))}
          </div>
          <Button variant="primary" onClick={() => (isLast ? dismiss() : setStep((s) => s + 1))}>
            {isLast ? "Get started" : "Next"}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
