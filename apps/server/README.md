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
| GET | `/agent/status` | Ollama + workspace status |
| POST | `/agent/chat` | Agent message `{ message, history? }` |

## Agent (M1.5)

- **Auth:** `POST /auth/pin-login` → Bearer token; required for `POST /agent/chat`.
- Tools: `fs_list`, `fs_read`, `fs_write`, `fs_search`, `git_status`, `git_diff`, `shell_exec`.
- `fs_write` and non-readonly shell need `confirm: true` (+ optional `pending` tool).
- Ollama up → multi-step tool loop; down → heuristic commands.
- Voice features deferred.

## Env

See `.env.example`.
