"use client";

import type { SuburbMatchResult } from "@/lib/suburbMatch";

interface QuizLeaderboardProps {
  ranking: SuburbMatchResult[];
}

/** Live-updating ranked suburb list, recomputed on every quiz answer — "the map keeps updating behind this panel." */
export function QuizLeaderboard({ ranking }: QuizLeaderboardProps) {
  const top = ranking.slice(0, 4);
  const leaderScore = top[0]?.score || 1;

  return (
    <div className="flex w-[330px] flex-none flex-col border-l border-white/10 bg-ink-50/70 backdrop-blur-xl px-9 py-11">
      <div className="font-mono text-[10px] font-medium tracking-[0.14em] text-ink-950/50">
        LEADING SO FAR
      </div>
      <div className="mt-5 flex flex-col gap-3.5">
        {top.map((result, i) => {
          const pct = Math.max(4, Math.min(100, Math.round((result.score / leaderScore) * 100)));
          const emphasis = 1 - i * 0.18;
          return (
            <div key={result.suburb.id} className="flex flex-col gap-1.5">
              <div className="flex items-baseline justify-between">
                <span
                  className="font-serif leading-none"
                  style={{ fontSize: 22 - i * 2, opacity: emphasis }}
                >
                  {result.suburb.name}
                </span>
                <span className="font-mono text-[11px]" style={{ opacity: emphasis }}>
                  {Math.round(result.score)}
                </span>
              </div>
              <span className="h-[7px] rounded-full bg-ink-950/12">
                <span className="block h-[7px] rounded-full bg-ink-900" style={{ width: `${pct}%`, opacity: emphasis }} />
              </span>
            </div>
          );
        })}
      </div>
      <div className="mt-auto pt-7 text-[12.5px] leading-relaxed text-ink-950/55">
        The map keeps updating behind this panel — every answer re-weights the pins live, and
        all {ranking.length} suburbs stay reachable.
      </div>
    </div>
  );
}
