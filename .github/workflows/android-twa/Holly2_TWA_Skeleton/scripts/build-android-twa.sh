#!/usr/bin/env bash
set -euo pipefail

# --- Nastavení cesty k TWA modulu ---
ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
MOD_REL="android-twa/Holly2_TWA_Skeleton"
MOD="$ROOT/$MOD_REL"

if [ ! -d "$MOD" ]; then
  echo "ERROR: Nenalezen modul: $MOD_REL (hledám v $ROOT)" >&2
  exit 1
fi

cd "$MOD"

# --- Wrapper (pokud chybí) ---
if [ ! -f "./gradlew" ]; then
  if command -v gradle >/dev/null 2>&1; then
    echo "gradlew nenalezen -> generuji wrapper (Gradle 8.9)…"
    gradle wrapper --gradle-version 8.9 --distribution-type bin
  else
    echo "ERROR: chybí gradlew i gradle CLI. Nainstaluj gradle nebo commitni wrapper." >&2
    exit 2
  fi
fi
chmod +x ./gradlew

# --- Build type (debug | release) ---
BUILD_TYPE="${1:-debug}"
BUILD_UPPER="$(tr '[:lower:]' '[:upper:]' <<< "${BUILD_TYPE:0:1}")${BUILD_TYPE:1}"
TASK=":app:assemble${BUILD_UPPER}"

echo "==> Spouštím build: $TASK"
./gradlew $TASK

# --- Najdi výsledné APK ---
APK_DEFAULT="app/build/outputs/apk/${BUILD_TYPE}/app-${BUILD_TYPE}.apk"
APK_PATH="$APK_DEFAULT"
if [ ! -f "$APK_DEFAULT" ]; then
  APK_PATH="$(ls app/build/outputs/apk/**/app-*.apk 2>/dev/null | head -n1 || true)"
fi

if [ -z "${APK_PATH:-}" ] || [ ! -f "$APK_PATH" ]; then
  echo "ERROR: APK se nepodařilo najít. Zkontroluj výstupy v app/build/outputs/apk/." >&2
  exit 3
fi

echo "==> Hotové APK: $APK_PATH"

# --- Volitelná instalace přes ADB ---
if command -v adb >/dev/null 2>&1; then
  if adb get-state >/dev/null 2>&1; then
    PKG="app.netlify.holly2_pro.twa"
    echo "==> Zařízení detekováno – instaluji…"
    adb uninstall "$PKG" >/dev/null 2>&1 || true
    adb install -r "$APK_PATH"
    echo "==> Instalace dokončena."
  else
    echo "ADB: žádné zařízení. Pro instalaci připoj telefon a spusť:"
    echo "adb install -r \"$MOD/$APK_PATH\""
  fi
else
  echo "ADB není nainstalované. APK najdeš zde: $MOD/$APK_PATH"
fi
