# Community Pulse Map — 3-Minute Pitch Video Script

Target: ~450-480 spoken words total (~150-160 wpm). Timings are cumulative.

## Must-mention features (non-negotiable — judges score against these)

1. **Live check-in → realtime pin glow on a second device** — the one thing that can't be faked with a chatbot demo. Must be shown live, two phones, on screen.
2. **Mood quiz → suburb recommendation** — tap-only (never a text form), always skippable, ends in a hero card with a real blurb + camera fly-to.
3. **Live heatmap layer** — city-wide density, cross-fades into pins on zoom. Visual proof of "the city's energy, live."
4. **Real data provenance** — suburb vibe scores from real OpenStreetMap POI density, events from Ticketmaster's live feed + hand-verified venues, not fabricated. This is your answer if a judge asks "how did you calculate that."
5. **Dark "control room" aesthetic** — say explicitly that it's *not* a Maps skin. Judges are told to check this.
6. **Accessibility filter** — wheelchair/sensory-friendly/multilingual tags. Direct callback to the hackathon's own theme prompt — say the theme prompt out loud if time allows.
7. **"No dead ends"** — dimmed, never hidden. One sentence proving the UX philosophy, not just the code.

---

## 0:00–0:20 — Hook (USP, stated as a contrast)

> "Google Maps tells you what's there. It doesn't tell you what fits how you feel right now, or where the city's actual energy is at this exact moment. Community Pulse Map does."

- One sentence. No slide of text — say it over the dark map UI already on screen, pins glowing.

## 0:20–0:50 — User story #1 (the "genuine connection" angle)

> "Meet Mira. She just moved to Sydney, knows nobody, and has a free evening. She doesn't want a list of 200 pins — she wants to know: where should I actually go tonight?"

- Show: onboarding — 3 taps (energy, social, time budget), visible skip option.
- Show: non-matching events dim, nothing disappears — "the map never hits a dead end."
- Land the suburb hero card: real blurb, ranked attractions, camera flies to Newtown/Surry Hills/wherever the quiz lands.

## 0:50–1:50 — THE live demo (this is the money shot — do not rush)

> "But the real story isn't the pins. It's what happens when the city moves."

- Two phones, side by side, both on the live map.
- Tap **Check in** on one phone.
- **On screen, in real time**: the pin glows brighter and the heatmap shifts on the *other* phone — under a second, no refresh, no cut.
- Say while it happens, not after: *"That's a live database write, broadcast to every open client, redrawn on the map — happening right now, between these two devices."*
- If anything stutters: do not narrate the bug. Cut to the backup recording and keep talking over it.

## 1:50–2:25 — Technical complexity (Citadel rubric callback — say this almost verbatim)

> "Under the hood this is multi-client realtime state sync, a live weighted-matching algorithm across two dimensions — events and suburbs — and a native heatmap layer computed from that same live stream. The suburb scores you just saw aren't guesses — they're derived from real OpenStreetMap venue density, and the events are pulled live from Ticketmaster, not staged."

- Say "not staged" — judges assume hackathon demos are faked; explicitly deny it once, briefly.

## 2:25–2:50 — UI/UX pitch (second rubric callback)

> "Every design choice here was deliberate: dark control-room palette, not a Maps skin. Tap-only quiz, never a form. Dimmed, never hidden — no dead ends. And the accessibility filter — wheelchair, sensory-friendly, multilingual — speaks directly to this hackathon's own prompt about serving a range of ability and digital-literacy levels."

- Show the accessibility toggle live for 2 seconds while saying this.

## 2:50–3:00 — Close

> "A map that reshapes itself around how you feel, and shows you where the city is actually alive — updating in real time, right now, across every device watching it."

- End on the live map, pins glowing, not a logo slide.

---

## Backup user story (use only if time allows / cut first if running long)

> "Or picture three uni friends with three free hours and high energy — the live pulse shows them Surry Hills is already buzzing tonight, not just that it exists on a map."

## Delivery notes

- Rehearse the 0:50–1:50 block more than any other — it's the segment that can't be faked, so it's the segment judges will scrutinize hardest.
- Keep the rubric-callback lines (1:50–2:50) close to verbatim — they're phrased to answer the exact judging criteria, not just describe features.
- If running over: cut the backup user story first, then trim the hook, never cut the live two-phone demo.
