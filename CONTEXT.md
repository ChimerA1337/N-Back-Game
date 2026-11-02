# Course and AI Working Context

## Read at the start of a session

Read `AGENTS.md`, `SPEC.md`, `STYLE.md`, and this file before changing the app. `SPEC.md` defines behavior; `STYLE.md` defines architecture and presentation; this file records course constraints and workflow. The assignment is the authority for assessed requirements. Proposed defaults and formulas in these files are project decisions, not quotations from the lab.

## Course context

- Lab B:1: Building a Native N-Back Mobile App, HI1033 / CM2023, Jonas Willén, 25 October 2026.
- Individual work. Pass B:1 before continuing to B:2 and B:3.
- Selected platform: TypeScript / React Native / Expo for iOS and Android. Stay with this platform.
- Target full marks through dual n-back plus persistent settings, SQLite score history, responsive layouts, and accessibility.
- Use MVVM (MVC is accepted by the lab); do not build a single god-class.
- The lab's suggested “single-file preferred, no external libraries beyond the platform SDK” context example conflicts with its architecture requirement and Expo module hints. It is not adopted as a project constraint. Keep responsibilities separated and dependencies minimal; use the specifically recommended Expo modules where needed.

## Existing project and implementation workflow

- At document creation, `package.json` declares Expo `~58.0.22`, TypeScript, React Native, and Expo Router. A `package-lock.json` is present; no Bun lockfile was found. Recheck installed versions before implementation.
- These files are specifications only. Do not assume a feature, test, or manual check has already been completed.
- Before writing code using Expo, EAS, or React Native APIs, read the current Expo major version and fetch its matching docs: `https://docs.expo.dev/versions/v58.0.0/` for the current project.
- For other Expo topics, start at `https://docs.expo.dev/llms.txt` and follow the relevant documentation. Do not rely on remembered APIs.
- Use Expo Router with screens in `src/app/`; keep non-route code elsewhere.
- Install dependencies through `npx expo install <package>` to resolve compatible versions. If the project adopts Bun, use `bunx` as required by `AGENTS.md`.
- Intended modules: expo-speech for spoken letters, expo-sqlite for score history, and a compatible settings store such as AsyncStorage or expo-secure-store. Confirm documentation and compatibility before choosing APIs or installing packages.
- Do not hand-edit generated `ios/` or `android/` directories. Follow `AGENTS.md` for native configuration and development builds.
- Before declaring completion, run `npx expo lint`, `npx tsc --noEmit`, and the project's unit-test command. If tooling or checks fail, report the actual failure and whether it predates the change.

## AI collaboration and evidence

AI may help plan, implement, document, debug, and test, but the student must review and understand every submitted line. Prefer small, explainable changes with clear reasons. Never invent personal contributions, reflections, bugs, prompts, test results, or device verification.

Keep a factual process log in `docs/` as work progresses. Record tool/model when known, the task, representative prompt, output used, human edits, and mistakes discovered. Record that these initial context files were AI-assisted from the supplied assignment. The final LLM process document should use 2–3 real prompts from that record.

For testing, record commands, cases, results, and relevant environment/device details. Separate automated checks from manual checks. Include at least three assessed test categories; the specification targets all five.

The student writes the final personal reflection from their own experience. AI can help edit it but must not fabricate experiences. Prepare for the oral examination by locating each responsibility in code and running a meaningful test live.

## Scope boundaries

No account system, remote server, cloud leaderboard, analytics, monetization, or medical claims are required. Keep data local. Do not expand scope at the expense of a complete, tested, explainable implementation.
