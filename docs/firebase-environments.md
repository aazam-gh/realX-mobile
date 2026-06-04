# Firebase Environments

Use separate Firebase projects for development and production.

- `dev`: `realx-dev` by default. Replace this alias in `.firebaserc` if the created dev project uses a different project ID.
- `prod`: `reelx-backend`.
- `default`: points to `dev` so local Firebase CLI commands do not target production by accident.

## Mobile App Variants

Expo config is selected by `APP_VARIANT` in `app.config.js`.

- Development: `APP_VARIANT=development`, app name `realX Dev`, iOS bundle ID `com.reelx.app.dev`, Android package `com.reelx.app.dev`.
- Production: `APP_VARIANT=production`, app name `realX`, iOS bundle ID `com.reelx.app`, Android package `com.reelx.app`.

Local commands default to dev:

```bash
npm run start
npm run ios
npm run android
```

Production local runs must be explicit:

```bash
npm run start:prod
npm run ios:prod
npm run android:prod
```

EAS profiles set `APP_VARIANT` directly. Keep production native Firebase files at the repo root. Put dev Firebase native files in `firebase/dev/`:

- `firebase/dev/GoogleService-Info.plist`
- `firebase/dev/google-services.json`

## Dev Project Setup

Create or select the dev project, then update aliases in both child repos if the ID differs from `realx-dev`:

```bash
firebase use --add
firebase use dev
```

Enable Firestore, Auth, Storage, Functions, App Check, and any Hosting target needed for mobile links. Register dev iOS and Android apps with the dev identifiers above.

## Deploy Safety

Deploy rules, indexes, and Functions to `dev` first:

```bash
firebase deploy --project dev
cd functions && npm run deploy:dev
```

Production deploys must be explicit:

```bash
firebase deploy --project prod
cd functions && npm run deploy:prod
```

For mobile Functions that access Storage, set `FIREBASE_STORAGE_BUCKET` for each project if the default bucket name is not the project ID or `<project-id>.appspot.com`.

## Data And Side Effects

Do not clone raw production Firestore, Auth, or Storage into dev for routine testing. Use the sanitized refresh workflow in `realX-web/functions/scripts/sanitized-firestore-refresh.js` and prefer synthetic Auth users mapped to sanitized Firestore profiles.

Do not copy private verification documents into dev unless they are replaced with fixtures. Disable or gate real email, SMS, push, and payment side effects in dev Functions before testing those flows.
