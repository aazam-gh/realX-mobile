# Repository Guidelines

## Project Structure & Module Organization
Keep the experience layered by purpose: `app/` is the Expo Router entry point and hosts route groups (e.g. `(tabs)`), `components/` holds reusable UI pieces, `constants/`, `context/`, and `utils/` store shared configuration, providers, and helpers, and `assets/` keeps fonts/images referenced from `app` or `expo-asset`. Firebase cloud code lives in `functions/`, localization lives in `src/localization/`, and the native scaffolds remain under `android/`, `ios/`, and static web files under `public/`.

## Build, Test, and Development Commands
- `npm run start` → boots `expo start` for the Metro server and dev client.
- `npm run android` / `npm run ios` → compile/run on a device/emulator for the respective platform via `expo run`.
- `npm run reset-project` → reinitializes caches and runtime assets via `scripts/reset-project.js` when packages or native code desync.
- `npm run lint` → runs `expo lint` (ESLint + TypeScript checks configured in `eslint.config.js`).

## Coding Style & Naming Conventions
Source files use TypeScript with two-space indentation and semicolons, following the `eslint-config-expo/flat` baseline. Keep React components in PascalCase, place view files under `app/` (kebab-case route folders for layout groups), and keep helpers inside `utils/` or `src/localization/` with descriptive camelCase exports. Reuse `constants/` for environment-specific values, and import fonts/assets via relative paths (e.g., `require('../assets/fonts/...')`). Run `npm run lint` before committing to catch formatting and typing issues.

## Testing Guidelines
The project does not yet ship a formal test suite, so enforce stability through linting plus manual smoke checks. When you add tests (e.g., `functions/src/foo.test.ts` or `components/__tests__/Button.test.tsx`), use the `*.test.ts[x]` naming pattern and keep them beside the code they validate. Run `npm run lint` after edits, and document any manual test steps in your PR.

## Commit & Pull Request Guidelines
Commits follow short, imperative phrases (`fix`, `add`, `update`). Pair each change with a PR summary that explains the outcome, testing performed, and any linked issue/board ticket. Include screenshots or recordings for UI work, mention `firebase` migrations if relevant, and keep PR descriptions focused on behavior rather than implementation details.

## Security & Configuration Tips
`firebase.json`, `GoogleService-Info.plist`, and `google-services.json` frame backend settings; update them together when changing service endpoints or API keys. Do not commit new secrets—manage runtime keys with EAS secrets or environment files that stay out of version control. When adding native dependencies, rerun `npm install` and `pod install` locally, then confirm the `reset-project` script cleans caches before sharing branches.

## Firebase Query Hygiene
Favor targeted reads: always scope queries with `where`, `orderBy`, and `limit`, then mirror the same indexes in Firestore so snapshots return minimal data. When listening to collections/documents, unsubscribe once the component unmounts or use `onSnapshot` with explicit cleanup (see `app/_layout.tsx`), and avoid unbounded fan-outs in cloud functions by filtering before iteration. Document costly queries when you add them so reviewers can verify indexes and execution contests.
