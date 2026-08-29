"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface QuizEntryCtaProps {
  view: "city" | "suburb" | "event" | "quiz";
  quizSummary: string | null;
  onStartQuiz: () => void;
}

export function QuizEntryCta({ view, quizSummary, onStartQuiz }: QuizEntryCtaProps) {
  return (
    <div className="pointer-events-none absolute bottom-10 left-1/2 -translate-x-1/2">
      <AnimatePresence mode="wait">
        {view === "city" && !quizSummary && (
          <motion.div
            key="cta"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.25 }}
            className="pointer-events-auto flex flex-col items-center gap-3.5"
          >
            <Card className="border-none px-[18px] py-3 text-[13.5px] text-ink-950/72 shadow-[0_8px_24px_rgba(15,15,15,0.1)]">
              Four taps and the map re-sorts itself around your mood
            </Card>
            <Button variant="primary" size="lg" onClick={onStartQuiz} className="gap-4 shadow-[0_14px_36px_rgba(15,15,15,0.3)]">
              <Sparkles className="h-5 w-5" strokeWidth={1.75} />
              <span className="font-serif text-2xl normal-case tracking-normal">Match my vibe</span>
              <span className="text-ink-10/55">4 TAPS · 20s</span>
            </Button>
          </motion.div>
        )}

        {view !== "quiz" && quizSummary && (
          <motion.div
            key="chip"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.25 }}
            className="pointer-events-auto"
          >
            <Card className="flex items-center gap-3.5 px-[18px] py-3">
              <span className="font-mono text-[10px] font-medium tracking-[0.12em] text-ink-950/45">
                YOUR VIBE
              </span>
              <span className="text-[13.5px]">{quizSummary}</span>
              <button
                type="button"
                onClick={onStartQuiz}
                className="flex min-h-[44px] items-center gap-1 border border-ink-950/20 px-2.5 font-mono text-[9px] font-medium tracking-[0.1em] text-ink-950/60"
              >
                <Pencil className="h-2.5 w-2.5" strokeWidth={2} />
                EDIT
              </button>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
