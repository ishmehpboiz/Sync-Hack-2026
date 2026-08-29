"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Zap, Users, Clock, Sparkles } from "lucide-react";

import { QuizStep } from "./QuizStep";
import { QuizLeaderboard } from "./QuizLeaderboard";
import type { SuburbMatchResult, SuburbQuizState, VibeDimension } from "@/lib/suburbMatch";
import type { Energy, Social } from "@/lib/eventMatch";

interface QuizOverlayProps {
  draft: Partial<SuburbQuizState>;
  liveRanking: SuburbMatchResult[];
  setEnergy: (v: Energy) => void;
  setSocial: (v: Social) => void;
  setTimeBudget: (v: SuburbQuizState["timeBudget"]) => void;
  toggleVibe: (v: VibeDimension) => void;
  onSubmit: () => void;
  onSkip: () => void;
}

const STEPS = [
  {
    title: "How much energy do you want today?",
    subtitle: "This shapes which events feel like a match.",
    icon: Zap,
    field: "energy" as const,
    options: [
      { value: "low", label: "Low key" },
      { value: "medium", label: "Medium" },
      { value: "high", label: "High energy" },
    ],
  },
  {
    title: "Who are you spending it with?",
    subtitle: "Solo, a few friends, or the whole crowd.",
    icon: Users,
    field: "social" as const,
    options: [
      { value: "solo", label: "Solo" },
      { value: "small_group", label: "Small group" },
      { value: "crowd", label: "Crowd" },
    ],
  },
  {
    title: "How much time do you have?",
    subtitle: "Just a stop, or the whole day out.",
    icon: Clock,
    field: "timeBudget" as const,
    options: [
      { value: "short", label: "An hour or two" },
      { value: "long", label: "The whole day" },
    ],
  },
  {
    title: "What are you in the mood for?",
    subtitle: "Pick up to two — these weigh double against every suburb's vibe vector.",
    icon: Sparkles,
    field: "vibePreferences" as const,
    options: [
      { value: "food", label: "Food" },
      { value: "nightlife", label: "Nightlife" },
      { value: "shopping", label: "Shopping" },
      { value: "activities", label: "Activities" },
      { value: "sightseeing", label: "Sightseeing" },
    ],
  },
];

export function QuizOverlay({
  draft,
  liveRanking,
  setEnergy,
  setSocial,
  setTimeBudget,
  toggleVibe,
  onSubmit,
  onSkip,
}: QuizOverlayProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const step = STEPS[stepIndex];
  const isLast = stepIndex === STEPS.length - 1;

  function handleToggle(value: string) {
    if (step.field === "energy") setEnergy(value as Energy);
    else if (step.field === "social") setSocial(value as Social);
    else if (step.field === "timeBudget") setTimeBudget(value as SuburbQuizState["timeBudget"]);
    else toggleVibe(value as VibeDimension);
  }

  const selected: string[] =
    step.field === "vibePreferences"
      ? draft.vibePreferences ?? []
      : draft[step.field]
      ? [draft[step.field] as string]
      : [];

  return (
    <div className="pointer-events-auto absolute inset-0 flex items-center justify-center bg-ink-100/86 backdrop-blur-[3px]">
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="flex w-[1020px] max-w-[92vw] bg-ink-5 shadow-[0_30px_80px_rgba(15,15,15,0.26)]"
      >
        <div className="flex flex-1 flex-col p-11">
          <div className="flex items-center gap-3.5">
            <span className="font-mono text-[10px] font-medium tracking-[0.14em] text-ink-950/50">
              STEP {stepIndex + 1} OF {STEPS.length}
            </span>
            <span className="flex flex-1 gap-1">
              {STEPS.map((_, i) => (
                <span key={i} className={i <= stepIndex ? "h-1 flex-1 bg-ink-900" : "h-1 flex-1 bg-ink-950/16"} />
              ))}
            </span>
          </div>

          <div className="mt-[26px] min-h-[220px]">
            <AnimatePresence mode="wait">
              <QuizStep
                key={step.field}
                title={step.title}
                subtitle={step.subtitle}
                icon={step.icon}
                options={step.options}
                selected={selected}
                onToggle={handleToggle}
              />
            </AnimatePresence>
          </div>

          <div className="mt-auto flex items-center gap-3.5 pt-9">
            <button
              type="button"
              disabled={stepIndex === 0}
              onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
              className="flex min-h-[44px] items-center gap-1.5 border border-ink-950/22 px-5 font-mono text-[10px] font-medium tracking-[0.12em] text-ink-950 disabled:opacity-30"
            >
              <ArrowLeft className="h-3 w-3" strokeWidth={2} />
              BACK
            </button>
            <button
              type="button"
              onClick={() => (isLast ? onSubmit() : setStepIndex((i) => i + 1))}
              className="bg-ink-900 px-7 py-[18px] font-serif text-[22px] leading-none text-ink-10 shadow-[0_12px_30px_rgba(15,15,15,0.26)]"
            >
              {isLast ? "Show me the map" : "Next"}
            </button>
            <button
              type="button"
              onClick={onSkip}
              className="min-h-[44px] bg-transparent font-mono text-[10px] font-medium tracking-[0.12em] text-ink-950/45 underline"
            >
              SKIP · JUST BROWSE
            </button>
          </div>
        </div>

        <QuizLeaderboard ranking={liveRanking} />
      </motion.div>
    </div>
  );
}
