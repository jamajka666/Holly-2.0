# Holly 2.0 — Security model

## Threat model (summary)

Holly will hold **shell and Kali access**. Compromise means full personal machine risk. Design for:

1. **Single owner** — no multi-tenant trust.
2. **Local-first** — bind `127.0.0.1` unless `ALLOW_LAN=true` on trusted network.
3. **Least privilege** — allowlists, workspace roots, risk tiers.
4. **Auditability** — append-only audit log for auth and tool use.
5. **Private repository** — never publish agent + Kali glue publicly.

## Owner-only voice (target M2+)

| Layer | Behavior |
|-------|----------|
| Speaker verification | Compare embedding to enrolled owner; fail closed |
| Session | Short-lived token after successful voice |
| High-risk | Second factor (PIN / UI confirm) |
| Foreign voice | Log + hard deny, no partial execution |
| Audio privacy | Embeddings/audio stay on disk unless owner opts into cloud |

Voice alone is **not** strong auth (replay, twin). Combine with local device trust + policy.

## Shell policy (baseline in `@holly/server`)

- Default allowlist: read-only / info commands + `git`/`node`/`npm`.
- High-risk patterns (`rm -rf`, `mkfs`, fork bombs, …) always blocked without multi-factor path (not implemented yet → blocked).
- Endpoint: `POST /policy/check-shell`.

## Kali VM

- Separate VM with snapshots.
- Service account SSH key only for Holly.
- Tool profiles (`recon`, `net`, `forensics`) — whitelist binaries/args.
- No exploit auto-run from voice without high-risk confirm.

## Secrets

- Never commit `.env`, keystores, API keys.
- `OWNER_PIN` only in local env (change default `0000`).
- Rotate tokens; prefer short-lived sessions.

## Reporting

This is a personal project. If you find a vulnerability in a shared build, contact the repo owner privately.
