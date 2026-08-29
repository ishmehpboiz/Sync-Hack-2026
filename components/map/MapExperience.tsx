"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import type { MapRef } from "react-map-gl/maplibre";
import { AnimatePresence } from "framer-motion";
import { Toaster } from "sonner";

import { MapCanvas, SYDNEY_CENTER } from "./MapCanvas";
import { HeatmapLayer } from "./HeatmapLayer";
import { SuburbBlooms, type SuburbAggregate } from "./SuburbBlooms";
import { EventPin } from "./EventPin";
import { IdentityBar } from "@/components/overlay/IdentityBar";
import { Breadcrumb } from "@/components/overlay/Breadcrumb";
import { FilterBar } from "@/components/overlay/FilterBar";
import { LegendZoomLadder } from "@/components/overlay/LegendZoomLadder";
import { QuizEntryCta } from "@/components/overlay/QuizEntryCta";
import { CheckinTicker } from "@/components/overlay/CheckinTicker";
import { SuburbHeroDrawer } from "@/components/drawers/SuburbHeroDrawer";
import { EventDetailDrawer } from "@/components/drawers/EventDetailDrawer";
import { QuizOverlay } from "@/components/quiz/QuizOverlay";
import { OnboardingOverlay } from "@/components/onboarding/OnboardingOverlay";

import { useEventsAndSuburbs } from "@/hooks/useEventsAndSuburbs";
import { useLiveActivity } from "@/hooks/useLiveActivity";
import { useQuizState } from "@/hooks/useQuizState";
import { computeMatchScore, opacityForMatch } from "@/lib/eventMatch";
import { getBuzz } from "@/lib/buzzScore";
import { toSuburbVibeVector, type EventCategory, type ViewState } from "@/lib/types";

const CITY_ZOOM = SYDNEY_CENTER.zoom;
const SUBURB_ZOOM = 13.6;
const EVENT_ZOOM = 15.8;
const FLY_DURATION = 1800;

function isTonight(startTime: string | null): boolean {
  if (!startTime) return false;
  const start = new Date(startTime);
  const now = new Date();
  return start.toDateString() === now.toDateString();
}

export function MapExperience() {
  const mapRef = useRef<MapRef>(null);
  const { events, suburbs, loading } = useEventsAndSuburbs();
  const { checkins, going, buzzScores, checkIn, markGoing } = useLiveActivity();
  const suburbVibeVectors = useMemo(() => suburbs.map(toSuburbVibeVector), [suburbs]);
  const quiz = useQuizState(suburbVibeVectors);

  const [view, setView] = useState<ViewState>("city");
  const [selectedSuburbId, setSelectedSuburbId] = useState<string | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [activeCategories, setActiveCategories] = useState<Set<EventCategory>>(new Set());
  const [accessibilityOnly, setAccessibilityOnly] = useState(false);
  const [tonightOnly, setTonightOnly] = useState(false);
  const [, setZoom] = useState(CITY_ZOOM);

  const passesFilters = useCallback(
    (event: (typeof events)[number]) => {
      if (activeCategories.size > 0 && !activeCategories.has(event.category)) return false;
      if (accessibilityOnly && !event.wheelchair_accessible && !event.sensory_friendly && !event.multilingual)
        return false;
      if (tonightOnly && !isTonight(event.start_time)) return false;
      return true;
    },
    [activeCategories, accessibilityOnly, tonightOnly]
  );

  // Category/access/tonight filters actually hide non-matching events (see
  // filteredEvents below) rather than just dimming them — dimming is
  // reserved for the softer, non-exclusionary quiz-vibe-match signal.
  const eventOpacity = useCallback(
    (event: (typeof events)[number]) =>
      quiz.quizAnswers ? opacityForMatch(computeMatchScore(event, quiz.quizAnswers)) : 1,
    [quiz.quizAnswers]
  );

  const filteredEvents = useMemo(() => events.filter(passesFilters), [events, passesFilters]);

  const flyTo = useCallback((longitude: number, latitude: number, zoom: number) => {
    mapRef.current?.flyTo({ center: [longitude, latitude], zoom, duration: FLY_DURATION });
  }, []);

  const goCity = useCallback(() => {
    setView("city");
    setSelectedSuburbId(null);
    setSelectedEventId(null);
    flyTo(SYDNEY_CENTER.longitude, SYDNEY_CENTER.latitude, CITY_ZOOM);
  }, [flyTo]);

  const goSuburb = useCallback(
    (suburbId: string) => {
      const suburb = suburbs.find((s) => s.id === suburbId);
      if (!suburb) return;
      setSelectedSuburbId(suburbId);
      setSelectedEventId(null);
      setView("suburb");
      flyTo(suburb.centroid_lng, suburb.centroid_lat, SUBURB_ZOOM);
    },
    [suburbs, flyTo]
  );

  const goEvent = useCallback(
    (eventId: string) => {
      const event = events.find((e) => e.id === eventId);
      if (!event) return;
      setSelectedEventId(eventId);
      setView("event");
      flyTo(event.lng, event.lat, EVENT_ZOOM);
    },
    [events, flyTo]
  );

  // Closing the event drawer drops back to whichever view makes sense —
  // the suburb it came from, or city if it was opened without one — without
  // re-flying the camera, since it's already framed correctly.
  const closeEvent = useCallback(() => {
    setSelectedEventId(null);
    setView(selectedSuburbId ? "suburb" : "city");
  }, [selectedSuburbId]);

  const goQuiz = useCallback(() => setView("quiz"), []);

  const handleQuizSubmit = useCallback(() => {
    const result = quiz.submit();
    if (result) goSuburb(result.suburb.id);
    else setView("city");
  }, [quiz, goSuburb]);

  const eventsInSuburb = useMemo(
    () => filteredEvents.filter((e) => e.suburb_id === selectedSuburbId),
    [filteredEvents, selectedSuburbId]
  );

  const selectedSuburb = useMemo(
    () => suburbs.find((s) => s.id === selectedSuburbId) ?? null,
    [suburbs, selectedSuburbId]
  );
  const selectedEvent = useMemo(
    () => events.find((e) => e.id === selectedEventId) ?? null,
    [events, selectedEventId]
  );

  const suburbAggregates = useMemo(() => {
    const map = new Map<string, SuburbAggregate>();
    let maxBuzz = 0;
    const raw = new Map<string, { eventCount: number; hereNow: number; buzz: number }>();
    for (const suburb of suburbs) {
      const suburbEvents = filteredEvents.filter((e) => e.suburb_id === suburb.id);
      let hereNow = 0;
      let buzz = 0;
      for (const e of suburbEvents) {
        const b = getBuzz(buzzScores, e.id);
        hereNow += b.checkinCount;
        buzz += b.buzzScore;
      }
      raw.set(suburb.id, { eventCount: suburbEvents.length, hereNow, buzz });
      if (buzz > maxBuzz) maxBuzz = buzz;
    }
    for (const [id, agg] of raw) {
      map.set(id, { ...agg, buzz: maxBuzz > 0 ? agg.buzz / maxBuzz : 0 });
    }
    return map;
  }, [suburbs, filteredEvents, buzzScores]);

  const categoryCounts = useMemo(() => {
    const counts = new Map<EventCategory, number>();
    for (const e of events) counts.set(e.category, (counts.get(e.category) ?? 0) + 1);
    return Array.from(counts.entries()).map(([category, count]) => ({ category, count }));
  }, [events]);

  const totalHereNow = useMemo(
    () => filteredEvents.reduce((sum, e) => sum + getBuzz(buzzScores, e.id).checkinCount, 0),
    [filteredEvents, buzzScores]
  );

  const quizSummary = useMemo(() => {
    const a = quiz.quizAnswers;
    if (!a) return null;
    const energyLabel = a.energy === "high" ? "High energy" : a.energy === "low" ? "Low key" : "Medium energy";
    const socialLabel = a.social.replace("_", " ");
    const vibes = a.vibePreferences.join(" + ");
    return [energyLabel, socialLabel, vibes].filter(Boolean).join(" · ");
  }, [quiz.quizAnswers]);

  const rankOfSelectedSuburb = useMemo(() => {
    if (!selectedSuburbId) return 1;
    const idx = quiz.liveRanking.findIndex((r) => r.suburb.id === selectedSuburbId);
    return idx >= 0 ? idx + 1 : 1;
  }, [selectedSuburbId, quiz.liveRanking]);

  return (
    <div className="relative h-full w-full bg-ink-5">
      <Toaster position="bottom-center" theme="light" />

      <MapCanvas ref={mapRef} onZoomChange={setZoom}>
        <HeatmapLayer events={filteredEvents} buzzScores={buzzScores} />

        {view === "city" && (
          <SuburbBlooms suburbs={suburbs} aggregates={suburbAggregates} onSelect={goSuburb} />
        )}

        {(view === "suburb" || view === "event") &&
          eventsInSuburb.map((event) => (
            <EventPin
              key={event.id}
              event={event}
              buzz={getBuzz(buzzScores, event.id)}
              opacity={eventOpacity(event)}
              selected={event.id === selectedEventId}
              onSelect={goEvent}
            />
          ))}
      </MapCanvas>

      {loading && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="font-mono text-xs tracking-[0.14em] text-ink-950/50">LOADING SYDNEY…</span>
        </div>
      )}

      {view === "city" && <IdentityBar eventCount={filteredEvents.length} hereNow={totalHereNow} />}

      {(view === "suburb" || view === "event") && selectedSuburb && (
        <Breadcrumb
          suburbName={selectedSuburb.name}
          eventCount={eventsInSuburb.length}
          hereNow={eventsInSuburb.reduce((sum, e) => sum + getBuzz(buzzScores, e.id).checkinCount, 0)}
          onBack={goCity}
          onSuburbClick={() => goSuburb(selectedSuburb.id)}
        />
      )}

      <FilterBar
        categories={categoryCounts}
        totalCount={events.length}
        activeCategories={activeCategories}
        accessibilityOnly={accessibilityOnly}
        tonightOnly={tonightOnly}
        onToggleCategory={(c) =>
          setActiveCategories((prev) => {
            const next = new Set(prev);
            next.has(c) ? next.delete(c) : next.add(c);
            return next;
          })
        }
        onClearCategories={() => setActiveCategories(new Set())}
        onToggleAccessibility={() => setAccessibilityOnly((v) => !v)}
        onToggleTonight={() => setTonightOnly((v) => !v)}
      />

      <LegendZoomLadder view={view} />

      <QuizEntryCta view={view} quizSummary={quizSummary} onStartQuiz={goQuiz} />

      <CheckinTicker checkins={checkins} events={events} visible={view === "event"} />

      <AnimatePresence>
        {view === "suburb" && selectedSuburb && (
          <SuburbHeroDrawer
            key="suburb-drawer"
            suburb={selectedSuburb}
            matchScore={
              quiz.quizAnswers
                ? Math.round(
                    quiz.liveRanking.find((r) => r.suburb.id === selectedSuburb.id)?.score ?? 0
                  )
                : null
            }
            rank={rankOfSelectedSuburb}
            totalSuburbs={suburbs.length}
            events={eventsInSuburb}
            buzzScores={buzzScores}
            onEventClick={goEvent}
            onNext={() => {
              const idx = suburbs.findIndex((s) => s.id === selectedSuburb.id);
              const next = suburbs[(idx + 1) % suburbs.length];
              if (next) goSuburb(next.id);
            }}
          />
        )}

        {view === "event" && selectedEvent && (
          <EventDetailDrawer
            key="event-drawer"
            event={selectedEvent}
            buzz={getBuzz(buzzScores, selectedEvent.id)}
            checkins={checkins}
            going={going}
            quizAnswers={quiz.quizAnswers}
            rank={eventsInSuburb.findIndex((e) => e.id === selectedEvent.id) + 1}
            totalInSuburb={eventsInSuburb.length}
            onCheckIn={checkIn}
            onGoing={markGoing}
            onClose={closeEvent}
          />
        )}
      </AnimatePresence>

      {view === "quiz" && (
        <QuizOverlay
          draft={quiz.draft}
          liveRanking={quiz.liveRanking}
          setEnergy={quiz.setEnergy}
          setSocial={quiz.setSocial}
          setTimeBudget={quiz.setTimeBudget}
          toggleVibe={quiz.toggleVibe}
          onSubmit={handleQuizSubmit}
          onSkip={goCity}
        />
      )}

      <OnboardingOverlay />
    </div>
  );
}
