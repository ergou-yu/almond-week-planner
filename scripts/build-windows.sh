#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VERSION="0.1.0"
BUILD_DIR="$ROOT_DIR/build/native-windows"
DOWNLOAD_DIR="$ROOT_DIR/public/downloads"
APP_DIR="$BUILD_DIR/app"
ICON_SOURCE="$ROOT_DIR/public/icons/icon-512.png"
ICON_PATH="$BUILD_DIR/icon.png"
ZIP_PATH="$DOWNLOAD_DIR/almond-week-planner-windows-x64-v$VERSION.zip"
ELECTRON_VERSION="$(node -p "require('$ROOT_DIR/node_modules/electron/package.json').version")"

mkdir -p "$BUILD_DIR" "$DOWNLOAD_DIR"
rm -rf "$APP_DIR" "$BUILD_DIR/win-unpacked" "$ZIP_PATH"
mkdir -p "$APP_DIR"

cp "$ROOT_DIR/native/windows/electron/main.js" "$APP_DIR/main.js"
cp "$ROOT_DIR/native/windows/electron/package.json" "$APP_DIR/package.json"
sips -z 512 512 "$ICON_SOURCE" --out "$ICON_PATH" >/dev/null

npx electron-builder \
  --projectDir "$APP_DIR" \
  --config.asar=true \
  --config.productName="Almond Week Planner" \
  --config.appId="app.almondweek.planner.windows" \
  --config.electronVersion="$ELECTRON_VERSION" \
  --config.directories.output="$BUILD_DIR" \
  --config.files="**/*" \
  --config.win.icon="$ICON_PATH" \
  --win dir \
  --x64

find "$BUILD_DIR/win-unpacked/locales" -type f \
  ! -name "en-US.pak" \
  ! -name "zh-CN.pak" \
  ! -name "zh-TW.pak" \
  ! -name "ja.pak" \
  ! -name "ko.pak" \
  -delete
rm -f "$BUILD_DIR/win-unpacked/LICENSES.chromium.html"
rm -f "$BUILD_DIR/win-unpacked/vk_swiftshader.dll" "$BUILD_DIR/win-unpacked/vk_swiftshader_icd.json" "$BUILD_DIR/win-unpacked/vulkan-1.dll"
rm -f "$BUILD_DIR/win-unpacked/d3dcompiler_47.dll"

(cd "$BUILD_DIR/win-unpacked" && zip -9qr "$ZIP_PATH" .)
echo "$ZIP_PATH"
