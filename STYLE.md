# Architecture and UI Conventions

## Architecture

Use MVVM with small, explicit responsibilities. Prefer understandable code that the student can explain in an oral examination.

- Models: typed settings, stimuli, round state, score records, and pure scoring rules.
- Domain services/classes: sequence generator and game engine. The engine owns transitions, event settlement, and response guards; it must be testable without rendering React components.
- ViewModels: React hooks that expose observable state and user actions, coordinate the engine, timers, audio, and repositories, and dispose resources. React function components and hooks are appropriate; do not introduce classes just for appearance.
- Views: route screens and reusable components render state and call actions. Screens own navigation; ViewModels do not navigate.
- Repositories/services: isolate SQLite, settings storage, and speech behind small interfaces. Keep platform APIs out of pure domain logic.

Suggested organization:

```text
src/
  app/                 # Expo Router screens and layouts only
  components/          # Grid, match button, HUD, settings controls
  models/              # Shared domain types
  domain/              # SequenceGenerator, GameEngine, scoring
  viewmodels/          # Game, settings, and history hooks
  services/            # Speech and timer adapters
  repositories/        # Settings and score persistence
  theme/               # Shared colors, spacing, typography
tests/                 # Domain and lifecycle tests
docs/                  # Process log, test report, reflection
```

Adapt this layout to existing code without keeping duplicate implementations. Keep dependencies directed from UI to ViewModels to domain/services; domain code must not import UI.

## TypeScript and state

- Use strict types and descriptive names such as `currentEventIndex`, `registerMatch`, and `generateSequence`.
- Distinguish zero-based indexes from displayed event numbers. Store durations with an explicit unit, such as `eventDurationMs`.
- Model lifecycle and stimulus modes with union types. Avoid `any`, unexplained numbers, and redundant derived state.
- Keep one authoritative round state. Do not use a stale React closure as the authority for response guards or event settlement.
- Inject randomness and scheduling where tests need control.
- Use asynchronous storage methods and parameterized SQL. Whitelist sort columns and directions rather than interpolating arbitrary input.
- Handle loading and failure states explicitly. Validate data at storage boundaries.

## Documentation

Document public domain operations, invariants, the scoring formula, match-rate denominator, and cleanup ownership. Explain why a non-obvious decision exists rather than narrating every line. Keep comments accurate when behavior changes.

## Visual style

Aim for a calm, focused training interface with a dark background, one primary accent, and clear text hierarchy. Dark is the standard appearance regardless of system preference. Use shared theme tokens instead of scattered colors and spacing values.

- Prioritize the stimulus grid and large match controls on the game screen.
- Keep HUD labels short and stable: Event, Correct, Visual Match, Audio Match.
- Use a consistent spacing scale, for example 4, 8, 12, 16, 24, and 32 logical pixels.
- Constrain content width on tablets; adapt the grid and controls to available space in landscape.
- Use gentle color/scale feedback for an incorrect guess, with a text/icon cue. Avoid shaking, flashing, punitive language, or sound effects that compete with spoken letters.
- Honor safe areas, text scaling, reduced motion, and at least 48×48 touch targets. Never rely on color alone.
- Keep interface copy supportive and literal, such as “No match this time” or “Round complete.”

## Testing conventions

Test externally observable behavior and invariants. Use seeded or injected randomness and controlled timers; avoid flaky statistical tests. Include assertions that would fail if the duplicate-response guard or accidental-match exclusion were removed. Keep domain tests independent of speech, SQLite, and rendering; use focused integration/manual checks for those adapters.
