#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VERSION="0.1.0"
APP_DISPLAY_NAME="杏花周计划"
EXECUTABLE_NAME="AlmondWeekPlanner"
SOURCE_DIR="$ROOT_DIR/native/macos/AlmondWeekPlanner"
BUILD_DIR="$ROOT_DIR/build/native-macos"
DOWNLOAD_DIR="$ROOT_DIR/public/downloads"
ICON_SOURCE="$ROOT_DIR/public/icons/icon-512.png"
ICONSET_DIR="$BUILD_DIR/AppIcon.iconset"
ICNS_PATH="$BUILD_DIR/AppIcon.icns"

mkdir -p "$BUILD_DIR" "$DOWNLOAD_DIR" "$ICONSET_DIR"

make_icon() {
  local size="$1"
  local scale="$2"
  local pixels=$((size * scale))
  local suffix="${size}x${size}"
  if [[ "$scale" == "2" ]]; then
    suffix="${suffix}@2x"
  fi
  sips -z "$pixels" "$pixels" "$ICON_SOURCE" --out "$ICONSET_DIR/icon_${suffix}.png" >/dev/null
}

make_icon 16 1
make_icon 16 2
make_icon 32 1
make_icon 32 2
make_icon 128 1
make_icon 128 2
make_icon 256 1
make_icon 256 2
make_icon 512 1
make_icon 512 2
iconutil -c icns "$ICONSET_DIR" -o "$ICNS_PATH"

build_for_arch() {
  local arch="$1"
  local label="$2"
  local target_dir="$BUILD_DIR/$label"
  local app_path="$target_dir/$APP_DISPLAY_NAME.app"
  local dmg_path="$DOWNLOAD_DIR/almond-week-planner-macos-$label-v$VERSION.dmg"

  rm -rf "$target_dir" "$dmg_path"
  mkdir -p "$app_path/Contents/MacOS" "$app_path/Contents/Resources"
  cp "$SOURCE_DIR/Info.plist" "$app_path/Contents/Info.plist"
  cp "$ICNS_PATH" "$app_path/Contents/Resources/AppIcon.icns"

  swiftc \
    -target "$arch-apple-macos11.0" \
    -O \
    -framework Cocoa \
    -framework WebKit \
    "$SOURCE_DIR/main.swift" \
    -o "$app_path/Contents/MacOS/$EXECUTABLE_NAME"

  chmod +x "$app_path/Contents/MacOS/$EXECUTABLE_NAME"
  codesign --force --deep --sign - "$app_path" >/dev/null
  hdiutil create -volname "$APP_DISPLAY_NAME" -srcfolder "$app_path" -ov -format UDZO "$dmg_path" >/dev/null
  echo "$dmg_path"
}

build_for_arch "arm64" "arm64"
build_for_arch "x86_64" "x64"
