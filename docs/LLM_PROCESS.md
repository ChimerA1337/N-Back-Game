# AI process record — implementation draft

This is a factual record of the AI assistance in this workspace, not a claim of the student's personal authorship or verification. Add your own subsequent work and observations before submission.

## Tool and context

Codex was used as the coding assistant, with shell/file tools and official web documentation. The exact underlying model identifier was not exposed in the working context. Inputs included the supplied Lab B:1 assignment, `AGENTS.md`, `package.json`, existing starter code, and the generated `SPEC.md`, `STYLE.md`, and `CONTEXT.md`.

The assistant read the Expo SDK 58 documentation before implementing Expo APIs, including the [SDK reference](https://docs.expo.dev/versions/v58.0.0/), [speech](https://docs.expo.dev/versions/v58.0.0/sdk/speech/), [SecureStore](https://docs.expo.dev/versions/v58.0.0/sdk/securestore/), and [Expo Router navigation](https://docs.expo.dev/router/basics/navigation/). React Native Animated and AppState documentation was also consulted.

## Representative prompts and outputs

1. After providing the assignment, the student asked: “create a SPEC.md, STYLE.md and a CONTEXT.md for me”. The assistant created root context files describing requirements, MVVM responsibilities, visual conventions, and the course/AI workflow. Full-marks features were documented as a future target, and implementation choices such as the scoring formula were identified as proposals.
2. The next instruction was: “oneshot the basic requirements”. The assistant replaced the starter screens with Home and Game views, implemented a pure TypeScript sequence generator and GameEngine, added a React ViewModel for lifecycle/audio coordination, persistent high-score storage, match feedback, and 14 domain tests. It marked optional persistent settings and score history as future work.

## Corrections made during implementation

- The first implementation read engine and animation refs during render. The current React lint rules rejected this. The assistant moved the Animated.Value into lazy state and published game snapshots/stimuli from event handlers rather than reading the mutable engine in rendering.
- Review found that the background handler cleared the startup flag before checking whether preparation had been active. The handler now captures that state before stopping, and asynchronous startup work is invalidated by a generation token. Error paths also clear the preparing indicator.
- Type checking exposed starter web CSS declaration and tab ref incompatibilities. CSS declarations were added, and the unused starter web tab wrapper was adjusted to omit its incompatible ref. The starter web color-scheme hydration hook was updated to satisfy current React lint rules.

## Verification and remaining student work

The assistant ran the unit tests, lint, type checking, and export checks described in `TEST_REPORT.md`. These checks do not replace device testing. No physical-device speech, accessibility, persistence, or interaction results were fabricated.

The application code, automated tests, these context files, and this draft process record were AI-assisted. The student must review and understand them, perform the outstanding manual checks, record personal changes, and write a reflection based on their actual experience. Do not state that any AI-generated section was written personally unless it was subsequently rewritten by the student.

## Full-mark implementation session

Third representative prompt (2 November 2026): the student supplied the complete assignment and asked: “read the md files and docs in this project … oneshot the requirements for higher lever requirements”. Codex read the project context and existing implementation, consulted SDK 58 SecureStore, Speech, SQLite, Expo Router, and React Native window-dimension documentation, and extended the app to the full-mark target.

AI-assisted additions: persistent editable settings, configurable independent dual sequences, named SQLite round records, sortable history, portrait/landscape and tablet configuration, responsive game columns, database idempotency and name guards, three additional automated tests, and updated documentation. Existing basic-game logic and accessibility behavior were retained. No student-authored implementation or manual verification is claimed.

Corrections during this session: TypeScript rejected `null` for FlatList's empty component; it was changed to `undefined`. Lint exposed an unnecessary retry dependency and import ordering; the history request state and import order were corrected. Review removed flex growth from vertically stacked match buttons and restricted landscape column flex to the horizontal layout to avoid collapsing content in a ScrollView. SQLite browser support required WebAssembly assets and cross-origin isolation headers, which were added following the SDK documentation. These were tooling/review corrections; no claim is made that a unit test caught a new gameplay defect.

The student still needs to review every line, carry out native device checks, and write the personal reflection. Documentation is a factual AI process record, not evidence of personal understanding or final course acceptance.
