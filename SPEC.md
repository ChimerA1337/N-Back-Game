# N-Back App Specification

## Purpose and scope

Build an individual submission for Lab B:1, HI1033 / CM2023, dated 25 October 2026. The app trains working memory by asking the player to identify stimuli that match exactly n events earlier.

Chosen platform: cross-platform TypeScript with React Native and Expo. The existing project uses Expo SDK 58 and Expo Router. Support iOS and Android; web is optional.

Target full marks: implement dual n-back and all four optional features: persistent settings, database-backed score history, responsive layouts, and accessibility. This document describes intended behavior, not completed functionality.

Current implementation scope: full-mark target, including dual n-back, persistent settings, SQLite score history, responsive layouts, and accessible controls. Automated checks are recorded in `docs/TEST_REPORT.md`; native device checks remain required.

## Screens

### Home

- Show the highest saved score, or an empty state when none exists.
- Let the player select visual, auditory, or dual stimuli.
- Display current mode, n, event duration, and events per round.
- Provide controls to start a round and open Settings and Score History.

### Game

- Provide an explicit Start control; entering the screen does not start speech or the timer.
- Show a square 3×3 visual grid by default, with exactly one highlighted cell per event in visual and dual modes.
- Speak one letter per event in auditory and dual modes.
- Show current event / total events and correct match responses so far.
- Provide a Visual Match button and/or Audio Match button according to mode. Dual mode tracks the two channels independently.
- Give brief, gentle animated feedback on an incorrect accepted press; use text or an icon as well as color.
- Show the final score and hits, misses, false alarms, and correct rejections. Allow saving under a name and starting a new round.
- Leaving an active round cancels it without saving an incomplete score.

### Settings

- Persist mode, n, event duration, events per round, grid size, and letter count.
- Proposed defaults: visual mode, n = 2, 2,500 ms per event, 30 events, 3×3 grid, 8 letters.
- Proposed limits: n 1–5; duration 1,000–5,000 ms; events 10–100 with events greater than n; grid 3×3 or 5×5; letter count 4–8.
- Use a fixed, distinct spoken-letter set: C, H, K, L, Q, R, S, Y. Use English pronunciation consistently and manually verify intelligibility on devices.
- Validate stored settings and fall back to defaults if missing or invalid. Snapshot settings when a round starts; changes apply to the next round.

### Score History

- Save completed rounds under a trimmed, nonempty player name, limited to 30 characters.
- Store scores in a local SQLite database.
- List name, score, date, mode, and n; retain other round settings and scoring counts for interpretation.
- Sort by name, score, and date using database queries with deterministic tie breakers.
- Show clear empty and storage-error states; prevent duplicate saves of one round.

## Sequence generation

- Implement generation in application code, independently of UI and platform APIs.
- Generate independent visual and auditory streams for dual mode.
- The first n events are warm-up events: they have no valid n-back comparison, cannot count as matches, and cannot accept responses.
- For each channel, choose a target match count near 30% of the eligible events, rounded to a feasible integer within 20–40%. The proposed settings always allow such a count.
- Randomly select eligible match positions. At each match position, repeat the stimulus exactly n steps earlier. At each other eligible position, exclude that stimulus to prevent accidental extra matches.
- Measure match rate over eligible events only: total events minus n.
- Inject a random-number source so tests can reproduce sequences.

## Lifecycle and responses

- State machine: idle → running on Start; running → finished after the final event's full duration. Restart creates a fresh round. Leaving or backgrounding an active game cancels the round and returns it to idle.
- Display the first event immediately after Start. At each boundary, settle unanswered channels for the outgoing event, advance the sequence, reset per-channel response guards, update the HUD, and output the new stimuli.
- Ignore presses when idle, finished, during warm-up, or after that channel has already accepted a press for the current event.
- A valid matching press is a hit; an accepted nonmatching press is a false alarm. At event expiry, an unanswered match is a miss; an unanswered nonmatch is a correct rejection.
- Settle each eligible event/channel exactly once, including the final event. Guard against stale timer callbacks after cancellation or restart.
- Own and clean up the round timer and speech on finish, cancellation, navigation away, and component disposal.

## Scoring

Proposed formula: `max(0, 100 × hits − 50 × falseAlarms − 50 × misses)`.

Hits reward active recognition; missed targets and incorrect guesses receive equal penalties to discourage tapping every event. Correct rejections are reported but add no points. Warm-up events never affect scoring. Dual mode sums both channels. Store mode and settings with each score because raw scores across round lengths and modes are not directly comparable.

## Audio, layout, and accessibility

- Use expo-speech for speech and check voice availability. Initialize audio support once per game lifecycle; start speaking only after the player's Start gesture.
- If no usable voice exists, show an accessible explanation and offer visual mode. Do not silently run an auditory round without sound.
- Stop previous speech before the next event and on cleanup.
- Support portrait and landscape on phones and tablets. Keep the grid square and all controls reachable within safe areas; allow scrolling where needed.
- Match buttons must have at least 48×48 logical-pixel touch targets, descriptive accessibility labels, and visible enabled/disabled states.
- Respect reduced-motion preferences, readable text scaling, and adequate contrast. Do not announce every timer update to screen readers.

## Verification and acceptance

Automated tests must cover sequence generation, enforced match rate, the first-n guarantee, double-press prevention, and scoring. Also test lifecycle guards, independent dual-channel responses, final-event settlement, and cancellation where practical. Tests must be runnable from the submitted project and pass.

Manually verify speech and the unavailable-voice fallback, settings across restart, score saving and all sort orders, navigation cleanup, background cancellation, wrong-press animation, and phone/tablet portrait/landscape layouts on iOS and Android. Record actual results and any unavailable devices; do not claim checks that were not run.

Run lint and TypeScript checks before completion. Attach a test report describing cases and actual results.

## Submission

1. Full, documented project with clear MVVM responsibilities and runnable tests.
2. Approximately one-page LLM process document: tools, attached context files, 2–3 real representative prompts and their outputs, and actual AI mistakes corrected.
3. Test report and test files.
4. Approximately half-page personal reflection: one surprise and one change for next time.

Submit at least one day before the scheduled presentation. The student must understand and explain every submitted line, including AI-generated code. Prepare to trace generation, ticks, guards, scoring, cleanup, audio, persistence, navigation, state subscriptions, and one live test. Opening oral question: which parts were written personally and which were AI-generated?
