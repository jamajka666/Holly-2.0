#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../android-twa/Holly2_TWA_Skeleton"
export ANDROID_SDK_ROOT="${ANDROID_SDK_ROOT:-$HOME/Android/Sdk}"
export ANDROID_HOME="$ANDROID_SDK_ROOT"
export PATH="$ANDROID_SDK_ROOT/platform-tools:$ANDROID_SDK_ROOT/cmdline-tools/latest/bin:$PATH"
./gradlew --stop || true
./gradlew :app:clean
./gradlew :app:assembleDebug --no-build-cache --stacktrace
APK=app/build/outputs/apk/debug/app-debug.apk
echo "APK: $APK"
if command -v adb >/dev/null 2>&1; then
  adb devices -l || true
  adb shell pm uninstall -k --user 0 app.netlify.holly2_pro.twa || true
  adb install -r "$APK" || true
fi
