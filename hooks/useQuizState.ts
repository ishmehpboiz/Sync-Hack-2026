"use client";

import { useCallback, useMemo, useState } from "react";

import { matchSuburbs, topSuburb, type SuburbQuizState, type SuburbVibeVector } from "@/lib/suburbMatch";
import type { Energy, Social } from "@/lib/eventMatch";

const DRAFT_DEFAULTS: SuburbQuizState = {
  energy: "medium",
  social: "small_group",
  timeBudget: "short",
  vibePreferences: [],
};

export function useQuizState(suburbs: SuburbVibeVector[]) {
  const [quizAnswers, setQuizAnswers] = useState<SuburbQuizState | null>(null);
  const [draft, setDraft] = useState<Partial<SuburbQuizState>>({});

  const setEnergy = useCallback((energy: Energy) => setDraft((d) => ({ ...d, energy })), []);
  const setSocial = useCallback((social: Social) => setDraft((d) => ({ ...d, social })), []);
  const setTimeBudget = useCallback(
    (timeBudget: SuburbQuizState["timeBudget"]) => setDraft((d) => ({ ...d, timeBudget })),
    []
  );
  const toggleVibe = useCallback((vibe: SuburbQuizState["vibePreferences"][number]) => {
    setDraft((d) => {
      const current = d.vibePreferences ?? [];
      if (current.includes(vibe)) {
        return { ...d, vibePreferences: current.filter((v) => v !== vibe) };
      }
      // Cap at 2 picks (handoff doc quiz spec) — drop the oldest to make room for the newest.
      const next = current.length >= 2 ? [current[1], vibe] : [...current, vibe];
      return { ...d, vibePreferences: next };
    });
  }, []);

  const resolvedDraft: SuburbQuizState = useMemo(
    () => ({ ...DRAFT_DEFAULTS, ...draft }),
    [draft]
  );

  const liveRanking = useMemo(
    () => matchSuburbs(resolvedDraft, suburbs),
    [resolvedDraft, suburbs]
  );

  const submit = useCallback(() => {
    setQuizAnswers(resolvedDraft);
    return topSuburb(resolvedDraft, suburbs);
  }, [resolvedDraft, suburbs]);

  const reset = useCallback(() => {
    setQuizAnswers(null);
    setDraft({});
  }, []);

  return {
    quizAnswers,
    draft,
    resolvedDraft,
    liveRanking,
    setEnergy,
    setSocial,
    setTimeBudget,
    toggleVibe,
    submit,
    reset,
  };
}
