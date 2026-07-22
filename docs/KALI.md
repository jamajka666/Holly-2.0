# Holly ↔ Kali Linux bridge

Holly **does not** run as root on Kali and **never** exposes a free remote shell.
It opens an **SSH session with a dedicated key** and runs only **whitelisted profiles**.

## Recommended setup

1. **Kali as a VM** on this PC (QEMU/KVM, VirtualBox, or VMware).
2. Snapshot the VM before lab work.
3. Host-only / NAT network so the guest is not wide open to the internet unless you intend it.
4. Create a service user (default `kali`) with SSH key auth only.

### SSH key (only for Holly)

```sh
ssh-keygen -t ed25519 -f ~/.ssh/holly_kali_ed25519 -C "holly-kali-bridge" -N ""
ssh-copy-id -i ~/.ssh/holly_kali_ed25519.pub kali@<KALI_IP>
# test
ssh -i ~/.ssh/holly_kali_ed25519 -o BatchMode=yes kali@<KALI_IP> true
```

### Core env (`apps/server/.env`)

```env
KALI_ENABLED=true
KALI_SSH_HOST=192.168.122.50
KALI_SSH_PORT=22
KALI_SSH_USER=kali
KALI_SSH_KEY=~/.ssh/holly_kali_ed25519
KALI_SSH_STRICT_HOSTKEY=accept-new
```

Restart `@holly/server` after editing env.

## Profiles

| Profile | Risk | Confirm | Purpose |
|---------|------|---------|---------|
| `sysinfo` | low | no | uname, ip, os-release |
| `whoami` | low | no | remote identity |
| `ping` | medium | yes | `ping -c 4` one host |
| `nmap_ping_scan` | medium | yes | `nmap -sn` host or /24–/32 |
| `nmap_top_ports` | high | yes | top 20 TCP, **single host** |

Args are validated (no shell metacharacters). Extra nmap flags from the user are **rejected**.

## API (session required)

| Method | Path | Notes |
|--------|------|-------|
| GET | `/kali/status` | config + profiles + active jobs |
| GET | `/kali/ping` | SSH connectivity |
| POST | `/kali/run` | `{ profile, args?, confirm? }` |
| POST | `/kali/abort` | kill-switch (`jobId` optional = all) |
| GET | `/kali/history` | last runs (in-memory) |

## Agent / chat

```
kali status
kali run sysinfo
kali run ping 1.1.1.1
```

Medium/high profiles ask for **Confirm** in the UI.

## UI

Sidebar → **Kali** (`/kali`): status, ping, run profile, abort all.

## Safety rules

- No `POST /kali/exec` free shell.
- No automatic exploit frameworks.
- Prefer lab targets / private ranges you own.
- Keep the repo **private**; do not commit private keys.
- Voice will never auto-run high-risk Kali profiles without confirm (when voice lands).

## Troubleshooting

| Symptom | Check |
|---------|--------|
| `not configured` | `KALI_SSH_HOST` + `KALI_ENABLED` |
| `SSH key missing` | path in `KALI_SSH_KEY` |
| ping fails | VM up, IP, `sshd`, authorized_keys, firewall |
| nmap message | install `nmap` inside Kali guest |
