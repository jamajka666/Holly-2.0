# Holly 2.0

Osobní AI asistent s prvky kyberbezpečnosti. Cíl: rychle zprovoznit užitečné MVP, které mi pomáhá při vývoji ShadowGuardu a dalších nástrojů.

## Stack
- **Web (MVP):** React + Vite + TypeScript (`apps/web`)
- **Později:** Node/Express backend (SSE/WebSocket pro Alerts), Android TWA, PWA offline

## Design
Temné UI (černá/šedá + akcenty červená/oranžová/zelená), eDEX/hacker vibe, hex/cf vzor.

## Principy
- Všechen kód pod mou kontrolou (žádný vendor lock-in).
- Modulární milníky (M3.6 Audit Logs, M3.7 Alerts Engine, M3.8 UI Bootstrap).
- PWA základy a postupné rozšiřování.

## Krátkodobé cíle MVP
1) **M3.8 – UI Bootstrap:** layout, router (Dashboard/Alerts/Vault/Settings), dark mode, základ komponent.  
2) **M3.7 – Alerts Engine:** SSE mock → seznam alertů, filtry, detail.  
3) **M3.6 – Audit Logs:** záznamy akcí + jednoduché vyhledávání.  
4) **PWA minimum:** manifest + service worker + offline fallback.

## Standardy kódu
- TS strict, ESLint + Prettier.
- Struktura webu: `apps/web/src/{pages,components,hooks,store,services,styles}`
- Stav: Zustand/Redux Toolkit (podle potřeby jednoduchosti).
- API volání jen přes `services/`, ne z komponent.

## Copilot – jak pomáhat
- Navrhuj malé PR-ready změny (50–150 řádků), s popisem „co a proč“.
- Pokud je více cest, navrhni 2–3 varianty s trade-offy.
- Drž se temného UI, logiku nemíchej do UI.

