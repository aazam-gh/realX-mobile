# Dev Firebase Native Config

Register separate Firebase apps in the dev project:

- iOS bundle ID: `com.reelx.app.dev`
- Android package: `com.reelx.app.dev`

Download the dev native config files and place them here:

- `firebase/dev/GoogleService-Info.plist`
- `firebase/dev/google-services.json`

These files are ignored by git. The root `GoogleService-Info.plist` and `google-services.json` remain the production native Firebase files.
