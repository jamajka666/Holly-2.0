# Holly 2.0 Pro — Android TWA Shell

Toto je minimální Android projekt pro **Trusted Web Activity (TWA)**, který spouští URL:
**https://hollyasist.trickle.host/**.

## Jak buildit
1) V kořeni projektu spusť vygenerování Gradle Wrapperu:
```bash
gradle wrapper
```
*(Pokud používáš Android Studio, wrapper se nastaví automaticky při prvním syncu.)*

2) Build debug APK:
```bash
./gradlew :app:assembleDebug
```

3) Nainstaluj na zařízení:
```bash
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

## Změna URL
- Otevři `app/src/main/AndroidManifest.xml` a změň hodnotu metadat
  `android.support.customtabs.trusted.DEFAULT_URL` na vlastní HTTPS doménu.
- Pro **TWA** v produkci je potřeba mít na doméně JSON `assetlinks.json` s prokazováním vlastnictví.
  (Později ti dodám přesný soubor i návod.)

## Poznámky
- Ikony jsou dočasné (adaptive icon). Můžeš nahradit `@drawable/ic_logo_fg` za vlastní SVG/PNG.
- Min SDK je 24, target 35.
