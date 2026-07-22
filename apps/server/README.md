# @holly/server

Holly Core API (unified). Binds to `127.0.0.1` by default.

## Run

```sh
# from repo root
npm install
npm run dev -w @holly/server
```

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Liveness |
| GET | `/alerts` | Recent alerts `{ items, total }` |
| GET | `/api/alerts` | Alerts array (legacy) |
| GET | `/api/alerts/stream` | SSE alert stream |
| POST | `/auth/pin-login` | Owner PIN login |
| GET | `/audit/recent` | Audit log |
| GET | `/audit/stream` | Audit SSE |
| GET | `/policy/status` | Owner-only / allowlist status |
| POST | `/policy/check-shell` | Classify shell command risk |

## Env

See `.env.example`.
