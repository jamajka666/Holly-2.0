# Holly 2.0

Holly 2.0 is a personal AI assistant with cybersecurity features. The goal is to quickly set up a useful MVP that assists in the development of ShadowGuard and other tools.

## Project Structure
- **apps/web:** The web application built with React, Vite, and TypeScript.
- **apps/web/src/components:** Contains reusable components like Header and Sidebar.
- **apps/web/src/pages:** Contains the main pages: Dashboard, Alerts, Vault, and Settings.
- **apps/web/src/store:** Contains the Zustand store for managing UI state.
- **apps/web/src/styles:** Contains the main CSS styles for the application.

## Stack
- **Frontend:** React + Vite + TypeScript
- **Backend (Future):** Node/Express for alerts, Android TWA, PWA offline capabilities.

## Design
- Dark UI (black/gray with red/orange/green accents), eDEX/hacker vibe, hex/cf pattern.

## Principles
- All code under personal control (no vendor lock-in).
- Modular milestones (M3.6 Audit Logs, M3.7 Alerts Engine, M3.8 UI Bootstrap).
- PWA foundations with gradual expansion.

## Short-term MVP Goals
1. **M3.8 – UI Bootstrap:** Layout, router (Dashboard/Alerts/Vault/Settings), dark mode, basic components.
2. **M3.7 – Alerts Engine:** SSE mock → alert list, filters, details.
3. **M3.6 – Audit Logs:** Action logs + simple search.
4. **PWA Minimum:** Manifest + service worker + offline fallback.

## Code Standards
- TypeScript strict mode, ESLint + Prettier.
- Web structure: `apps/web/src/{pages,components,hooks,store,styles}`
- State management: Zustand/Redux Toolkit (based on simplicity needs).
- API calls only through `services/`, not from components.

## How to Contribute
- Propose small PR-ready changes (50–150 lines) with a description of "what and why."
- If there are multiple approaches, suggest 2-3 options with trade-offs.
- Adhere to dark UI principles; keep logic separate from UI.