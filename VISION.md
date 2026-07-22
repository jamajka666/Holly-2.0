# Holly 2.0 — Vision

Holly is a **personal, owner-only** AI assistant. In the final form she should match a strong coding/planning agent (filesystem, shell, git, multi-step plans) plus **controlled** access to the host PC and a **Kali Linux VM**, with **voice control that only accepts the enrolled owner**.

## Non-goals (now)

- Public multi-user SaaS
- Blind “run anything I say” root shell
- Cloud upload of voice biometrics without explicit opt-in

## Architecture (target)

```
Clients (Web/PWA, Android TWA, mic, CLI)
        │
        ▼
Holly Core (@holly/server) — localhost by default
  · AuthN/AuthZ (session, PIN, later speaker ID)
  · Agent loop (plan → tools → verify → audit)
  · Policy engine (risk tiers, allowlists)
  · Tool bus: fs, shell, git, device, Kali SSH profiles
        │
        ├── Ollama (local LLM) / optional cloud
        ├── Host OS (least privilege)
        └── Kali VM (SSH, tool profiles, kill switch)
```

## Roadmap

| Milestone | Focus |
|-----------|--------|
| **M0** | Single repo truth, unified server, docs, GitHub |
| **M1** | Agent chat + fs/shell tools (allowlisted) |
| **M2** | Owner voice enrollment + speaker verification gate |
| **M3** | PC control + confirmation tiers + vault |
| **M4** | Kali VM bridge (profiles, never free shell from voice) |
| **M5** | Mobile TWA polish + CI green |

## Related local labs (not in monorepo yet)

- `~/lab-stt` — faster-whisper + Ollama STT prototypes (candidate for M2)

## Kali

Runs as a **VM on this PC**. Holly orchestrates over SSH with **whitelisted tool profiles**. High-risk actions always need multi-factor confirm (PIN + UI, later voice re-check).
