# Android APK release notes

This project ships the Android app as a Trusted Web Activity that opens the production web app at:

```text
https://almond-week-planner.vercel.app/app
```

## Signing

The release keystore is generated locally in `android-signing/`, which is intentionally ignored by Git. Keep this folder safe. Losing it means future APKs with `app.almondweek.planner` cannot upgrade the installed test package.

The current public certificate SHA-256 fingerprint is published in:

```text
public/.well-known/assetlinks.json
```

## Build target

- App name: `杏花周计划`
- Package name: `app.almondweek.planner`
- Start URL: `/app`
- APK output path for the website download link:

```text
public/downloads/杏花周计划-android-v0.1.0.apk
```

## Expected build flow

1. Build and deploy the web app so `manifest.webmanifest` and `assetlinks.json` are available on the production domain.
2. Generate or reuse the local release keystore in `android-signing/`.
3. Build the Trusted Web Activity Android project with Bubblewrap.
4. Copy the signed release APK to `public/downloads/杏花周计划-android-v0.1.0.apk`.
5. Run `npm run typecheck` and `npm run build`.
6. Deploy the site so the homepage download button serves the APK.
