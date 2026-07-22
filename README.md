# Holly 2.0

Personal **owner-only** AI assistant: cyberpunk UI, local Core API, roadmap toward full agent + voice biometrics + Kali VM bridge.

> See [VISION.md](./VISION.md) and [SECURITY.md](./SECURITY.md).

## Stack

| Package | Path | Role |
|---------|------|------|
| `@holly/web` | `apps/web` | Vite + React PWA UI |
| `@holly/server` | `apps/server` | Express Core API (health, alerts, auth PIN, audit, policy) |

**Package manager:** npm workspaces (Node ≥ 20).

## Quick start

```sh
export PATH="$HOME/.nvm/versions/node/v24.18.0/bin:$PATH"  # if needed
cd ~/Holly-2.0
npm install
cp apps/server/.env.example apps/server/.env   # edit OWNER_PIN
npm run dev:server   # http://127.0.0.1:4000
npm run dev:web      # Vite dev server
```

Web expects API via `VITE_API_URL` (see `apps/web/.env.example`).

## Design

Dark UI (black/grey + neon red/orange/green), eDEX / hacker vibe. Reference art in `assets/` and `pic/`.

## Current status (2026-07)

- **Unified monorepo** — one server (`@holly/server`), one web app.
- **Not yet:** agent tool loop, speaker ID, Kali bridge (planned milestones).
- **Related lab:** `~/lab-stt` (Whisper STT) — not vendored here yet.
- **Archive:** `assets/archive/Holly-2.0-fail.png` from old `Projects/Holly2` folder.

## Scripts

```sh
npm run dev:server
npm run dev:web
npm run build
npm run typecheck
```

## License / privacy

Private personal project. Do not publish builds that embed shell/Kali credentials.
