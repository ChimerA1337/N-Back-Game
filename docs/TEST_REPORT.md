# Test report — N-Back full-mark target

## Automated results

Verification environment: Node 26.12.1 in the development workspace. Command: `npm test`. Result: 17 tests passed, 0 failed. Tests import production TypeScript through Node's built-in type stripping.

| Area | Cases | Result |
| --- | --- | --- |
| Sequence generation | Correct length, valid cells/letters, seeded reproducibility | Pass |
| Match-rate enforcement | Exactly rounded 30% of eligible events, 20–40% bounds, 100 seeds × n values 1–5 | Pass |
| Dual sequences | Each stream has its own expected target count | Pass |
| Settings validation | Supported bounds, corrupted settings fallback, detached snapshots | Pass |
| Configurable rounds | All offered round lengths × n values, 5×5 bounds, reduced letter set, match rates | Pass |
| SQLite SQL | Actual in-memory SQLite: parameterized names, duplicate round IDs, six sort directions, sort whitelist, name bounds | Pass |
| Input validation | Reject insufficient distinct stimuli, count ≤ n, invalid n | Pass |
| First-n guarantee | Repeated warm-up values never match or accept responses; no scoring during warm-up | Pass |
| Lifecycle guards | Presses ignored before start and after finish; repeated final tick is harmless | Pass |
| Double-press prevention | Duplicate hit/false alarm ignored synchronously; guard resets on next event | Pass |
| Dual controls | Each channel has an independent guard; inactive channel ignored | Pass |
| Silent events | Misses and correct rejections counted on expiry, including final event | Pass |
| Final event | Remains playable until final advance; accepted hit is not also a miss | Pass |
| Cancellation | Cancel resets state; later engine advance/press does nothing; restart begins at event 1 | Pass |
| State ownership | Mutating a snapshot cannot bypass the engine guard or change counts | Pass |
| Score formula | Hit rewards, equal miss/false-alarm penalties, zero floor | Pass |

The duplicate-hit test would fail if the `responded[channel]` guard were removed: the second press would return `hit` and increase the hit count to 2. The generator tests would fail if non-target positions were allowed to accidentally equal their n-back comparison.

`npm run lint` and `npm run typecheck` also pass for the full-mark changes. Web bundling passed with `npx expo export --platform web --output-dir /tmp/nback-higher-web`, including the SQLite WebAssembly asset and worker. Native JavaScript/Hermes bundling passed for both iOS and Android with `npx expo export --platform ios --platform android --output-dir /tmp/nback-higher-native`. Exports validate bundling, not interactive behavior, native compilation, or installation.

## Full-mark manual acceptance checklist (not yet run)

- Change every setting, save, restart the app, and confirm values on Home and the next Game. Check 1-back and 5-back, 3×3 and 5×5, shortest/longest durations and rounds.
- Save completed rounds under different names, check all history sort directions, relaunch, and verify records persist. Confirm repeated save taps create only one row. Test empty and storage-error states.
- Test independent dual responses with sound on both platforms, missing-voice fallback, reduced motion, screen-reader labels, and 48+ point match controls.
- Rotate mid-round and test phone/tablet layouts with large text; verify grid stays square, controls remain reachable, and safe areas are respected.

## Limits and manual checks still required

Domain tests do not render React components or exercise native speech, actual timers, navigation, or SecureStore. SQLite tests execute the shared production schema, insert statement, and sorted queries through Node SQLite; they do not exercise the native expo-sqlite adapter. No physical device or simulator session was used for the results above. Run and record the following yourself on iOS and Android before submission:

- Open all three modes; verify each visual event highlights exactly one cell and auditory events speak the expected letters.
- Confirm speech begins only after Start. Test an iPhone with silent mode off and a device without an English voice.
- Confirm the HUD uses the saved duration and event count, begins with event 1, ends after the final event's full duration, and counts accepted hits.
- Verify warm-up/idle/finished controls are disabled and repeated tapping records one response per channel/event.
- Make a wrong guess and confirm the gentle opacity pulse and text feedback. Enable reduced motion and check the text cue remains.
- Leave mid-round through the return control, native back button, and iOS back gesture; confirm there is no later speech/tick. Background the app during audio preparation and during a round; confirm cancellation.
- Finish a round, return home, and restart the app to verify the best score persists. Try a lower score and verify it cannot replace the best.
- Check controls, grid shape, safe areas, large text, and screen-reader labels on phone and tablet. Rotation is enabled; test portrait and landscape on phones and tablets, plus large text.

No claim is made that a unit test caught a gameplay defect during this implementation. Lint did catch invalid ref reads during render, which were corrected by publishing observable state from event handlers and effects.
