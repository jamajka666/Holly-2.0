# Holly 2.0

Osobní AI asistent s prvky kyberbezpečnosti. Cíl: rychle zprovoznit užitečné MVP, které mi pomáhá při vývoji ShadowGuardu a dalších nástrojů.

## Stack

## Design
Temné UI (černá/šedá + akcenty červená/oranžová/zelená), eDEX/hacker vibe, hex/cf vzor.

## Principy

## Krátkodobé cíle MVP
1) **M3.8 – UI Bootstrap:** layout, router (Dashboard/Alerts/Vault/Settings), dark mode, základ komponent.  
2) **M3.7 – Alerts Engine:** SSE mock → seznam alertů, filtry, detail.  
3) **M3.6 – Audit Logs:** záznamy akcí + jednoduché vyhledávání.  
4) **PWA minimum:** manifest + service worker + offline fallback.

## Standardy kódu


## CI Quick-fix

- Špatná cesta k artefaktu (dist/, APK)

### Jak spustit lokálně
```sh
npm ci
npm -w @holly/web run build
cd apps/android-twa && ./gradlew :app:assembleDebug
```

### CI artefakty
Najdeš v Actions → poslední run → Artifacts
## TypeScript Quick-fix: Missing Dependencies

Pokud build selže na chybě `Cannot find module 'react-router-dom'`, spusť:

```sh
npm install -w apps/web react-router-dom
```

nebo přidej do `apps/web/package.json`:

```json
"react-router-dom": "^6.22.3"
```

