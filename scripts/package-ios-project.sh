#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VERSION="0.1.0"
IOS_DIR="$ROOT_DIR/native/ios"
DOWNLOAD_DIR="$ROOT_DIR/public/downloads"
ZIP_PATH="$DOWNLOAD_DIR/almond-week-planner-ios-xcode-v$VERSION.zip"

mkdir -p "$DOWNLOAD_DIR"
sips -z 1024 1024 "$ROOT_DIR/public/icons/icon-512.png" --out "$IOS_DIR/AlmondWeekPlanner/Assets.xcassets/AppIcon.appiconset/icon-1024.png" >/dev/null

if command -v xcodegen >/dev/null 2>&1; then
  (cd "$IOS_DIR" && xcodegen generate)
fi

rm -f "$ZIP_PATH"
(cd "$ROOT_DIR" && zip -qr "$ZIP_PATH" native/ios)
echo "$ZIP_PATH"
