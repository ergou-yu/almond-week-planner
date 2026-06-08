# Apple Release Notes

This project ships Apple platform shells that load the production web app at:

```text
https://almond-week-planner.vercel.app/app
```

## macOS

Build signed local test DMGs:

```bash
./scripts/build-macos.sh
```

Outputs:

```text
public/downloads/almond-week-planner-macos-arm64-v0.1.0.dmg
public/downloads/almond-week-planner-macos-x64-v0.1.0.dmg
```

The DMGs are ad-hoc signed. They are suitable for direct testing, but a public notarized release needs an Apple Developer certificate and notarization.

## iOS

Package the Xcode project:

```bash
./scripts/package-ios-project.sh
```

Output:

```text
public/downloads/almond-week-planner-ios-xcode-v0.1.0.zip
```

To submit to TestFlight or the App Store:

1. Open `native/ios/AlmondWeekPlanner.xcodeproj` in Xcode.
2. Set the Apple Developer Team.
3. Register or confirm the bundle id `app.almondweek.planner.ios`.
4. Archive the app in Xcode.
5. Upload it to App Store Connect.
6. Complete privacy, screenshots, age rating, review notes, and submit for review.

An installable iOS IPA cannot be produced here without Apple signing credentials and provisioning.
