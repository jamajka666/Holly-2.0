# 📜 Changelog – Holly 2.0

Všechny podstatné změny v projektu budou dokumentovány v tomto souboru.

Formát je inspirovaný [Keep a Changelog](https://keepachangelog.com/cs-CZ/1.0.0/),
a projekt používá [SemVer](https://semver.org/lang/cz/) (verze `MAJOR.MINOR.PATCH`).

## [Unreleased]
### Přidáno
- Sjednocený monorepo: npm workspaces (`@holly/web`, `@holly/server`)
- Reálný `@holly/server` (health, alerts, auth PIN, audit, policy/shell allowlist)
- **M1 agent:** tools `fs_*` + `shell_exec`, `POST /agent/chat`, UI `/chat`
- **M1.5:** session tokens, chráněný `/agent/chat`, `fs_search`, `git_status`/`git_diff`, confirm pro zápisy/shell
- **M3-lite:** desktop tools (`open_url`, `notify`, clipboard), `/desktop/*`, audit feed na Dashboard, policy v Settings
- **M4 Kali bridge:** SSH profiles (`sysinfo`, `ping`, `nmap_*`), `/kali/*`, UI `/kali`, kill-switch, `docs/KALI.md`
- Heuristický režim bez Ollamy (`list` / `read` / `run` / `search` / `git status` / desktop / `kali …`)
- `VISION.md` + aktualizovaný security model (owner-only, Kali VM)
- Dashboard napojený na Core API (`apps/web/src/api`)
- Archiv `assets/archive/Holly-2.0-fail.png` (z mrtvé složky `Projects/Holly2`)
- Legacy mock server snapshot v `docs/archive/legacy-server`

### Změněno
- Odstraněny prázdné stuby `apps/server` (0 B soubory) a duplicitní `server/`
- Root README přepsán na aktuální stav
- Vite proxy → `127.0.0.1:4000`; výchozí bind Core jen localhost
- CI: Web CI přepnuto na npm workspaces (oprava pnpm cache fail); Android workflowy nepadají na každý push main

### Odstraněno
- Duplicitní `~/Projects/Holly2` (venv + screenshot)
- `src/main.py` placeholder

---

## [0.1.0] – 2025-09-02
### Přidáno
- První import kódu Holly webu do `apps/web`
- `.gitignore` základ pro Node/Vite/Android
- Nastavení repozitáře na GitHubu (privátní)
