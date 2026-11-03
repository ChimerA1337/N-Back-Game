# N-Back

Implementation in TypeScript, React Native, and Expo SDK 58. Extensively used the AI Agent Codex to write the project.

## Run

Use Node 22.18+ (Node 26 was used for verification).

```bash
npm ci
npm start
```

Open on an iOS/Android development build or a compatible Expo Go version. Speech and SecureStore are Expo modules; a development build is required when your installed client does not include compatible native modules. For a browser preview, use `npm run web`. On physical iPhones, disable silent mode to hear speech.

## Play

Choose Visual, Auditory, or Dual on Home, then open the game and press Start. Defaults are 30 events at 2.5 seconds each, with n = 2. Open Settings to persist mode, n, duration, round length, grid size, and letter count. Tap the relevant Match button when the current position/letter equals the one from n events earlier. Dual streams have independent buttons. The first n events are warm-up, and each channel accepts at most one response per event.

Hits earn 100 points; misses and false alarms cost 50 each. Scores cannot become negative. Completed rounds automatically update the local high score. Enter a name to save a completed round to SQLite. Open Score history to sort by name, score, or date; tap the same sort again to reverse it. Leaving or backgrounding an active round cancels it without saving.

## Check

```bash
npm test
npm run lint
npm run typecheck
```

The tests use Node's built-in runner and TypeScript stripping, with no test framework dependency. See [test report](docs/TEST_REPORT.md) for automated results and manual checks still needed.

## Code map

- `src/domain/game.ts`: sequence generator, pure GameEngine, score formula, validated settings.
- `src/viewmodels/use-game.ts`: React state, timers, speech, focus/background cleanup.
- `src/repositories/high-score.ts`: asynchronous persistent high score (SecureStore on native, localStorage on web).
- `src/app/index.tsx`, `src/app/game.tsx`: Home and Game views; views own navigation.
- `src/components/match-button.tsx`: accessible match control and gentle incorrect-response animation.
- `tests/game.test.mjs`: domain and lifecycle-rule tests.

Additional code:

- `src/app/settings.tsx` and `src/viewmodels/use-settings.ts`: editable persistent settings.
- `src/app/history.tsx` and `src/viewmodels/use-history.ts`: sorted score history.
- `src/repositories/settings.ts`: SecureStore settings on native; localStorage on web.
- `src/repositories/scores.ts`: asynchronous SQLite connection and parameterized writes.
- `src/domain/score-storage.ts`: shared SQL and name validation, exercised against real SQLite in tests.

Rotation and tablet support are enabled. Landscape uses two columns where space and text size permit; smaller layouts scroll. The grid stays square. Native speech, rotation, and storage still require manual device verification. SQLite browser support requires cross-origin isolation: Metro sets the headers locally and the Router plugin configures EAS Hosting. Other hosts must supply COOP/COEP headers too. See the [Expo SQLite setup](https://docs.expo.dev/versions/v58.0.0/sdk/sqlite/).