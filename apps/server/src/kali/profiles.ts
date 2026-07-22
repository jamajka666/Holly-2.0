/**
 * Whitelisted Kali tool profiles — never free-form shell from API/chat.
 * Only lab/recon-safe commands with validated arguments.
 */

export type ProfileArgSpec = {
  name: string;
  required?: boolean;
  description: string;
};

export type KaliProfile = {
  id: string;
  title: string;
  description: string;
  risk: "low" | "medium" | "high";
  needsConfirm: boolean;
  args: ProfileArgSpec[];
  /** Build remote command; args already validated. */
  build: (args: Record<string, string>) => string;
};

/** Host/IP: letters, digits, dots, dashes, colons (IPv6), no spaces/metachars. */
export function validateHost(raw: string): string {
  const h = raw.trim();
  if (!h || h.length > 253) throw new Error("invalid host");
  if (!/^[A-Za-z0-9.:-]+$/.test(h)) {
    throw new Error("host contains illegal characters");
  }
  if (h.includes("..") || h.startsWith("-")) {
    throw new Error("invalid host format");
  }
  return h;
}

/** Optional CIDR like 192.168.1.0/24 — only for explicitly allowed profiles. */
export function validateCidrOrHost(raw: string): string {
  const t = raw.trim();
  const m = t.match(/^([A-Za-z0-9.:-]+)(?:\/(\d{1,2}))?$/);
  if (!m) throw new Error("invalid target (host or CIDR)");
  const host = validateHost(m[1]!);
  if (m[2] != null) {
    const bits = Number(m[2]);
    if (bits < 8 || bits > 32) throw new Error("CIDR prefix must be 8–32");
    // only IPv4-looking for CIDR
    if (!/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) {
      throw new Error("CIDR only allowed for IPv4");
    }
    return `${host}/${bits}`;
  }
  return host;
}

export const KALI_PROFILES: Record<string, KaliProfile> = {
  sysinfo: {
    id: "sysinfo",
    title: "System info",
    description: "uname, hostname, id, brief addresses, os-release",
    risk: "low",
    needsConfirm: false,
    args: [],
    build: () =>
      [
        "set -e",
        "echo '=== uname ==='",
        "uname -a",
        "echo '=== hostname ==='",
        "hostname",
        "echo '=== id ==='",
        "id",
        "echo '=== ip ==='",
        "ip -br a 2>/dev/null || ifconfig 2>/dev/null || true",
        "echo '=== os-release ==='",
        "head -20 /etc/os-release 2>/dev/null || true",
      ].join("; "),
  },

  whoami: {
    id: "whoami",
    title: "Who am I",
    description: "Remote user identity",
    risk: "low",
    needsConfirm: false,
    args: [],
    build: () => "whoami; id; pwd",
  },

  ping: {
    id: "ping",
    title: "Ping host",
    description: "ICMP ping -c 4 (lab only)",
    risk: "medium",
    needsConfirm: true,
    args: [
      {
        name: "host",
        required: true,
        description: "Hostname or IP",
      },
    ],
    build: (args) => {
      const host = validateHost(args.host || "");
      return `ping -c 4 -W 2 ${host}`;
    },
  },

  nmap_ping_scan: {
    id: "nmap_ping_scan",
    title: "Nmap host discovery (-sn)",
    description: "No port scan — discovery only, single host or /24–/32",
    risk: "medium",
    needsConfirm: true,
    args: [
      {
        name: "target",
        required: true,
        description: "Host or IPv4 CIDR (/24–/32)",
      },
    ],
    build: (args) => {
      const target = validateCidrOrHost(args.target || "");
      if (target.includes("/")) {
        const bits = Number(target.split("/")[1]);
        if (bits < 24) throw new Error("CIDR broader than /24 not allowed");
      }
      // Fixed flags only — user cannot inject options
      return `command -v nmap >/dev/null && nmap -sn -T3 --max-retries 1 ${target} || echo 'nmap not installed on Kali guest'`;
    },
  },

  nmap_top_ports: {
    id: "nmap_top_ports",
    title: "Nmap top ports (single host)",
    description: "Top 20 TCP ports, single host only (lab)",
    risk: "high",
    needsConfirm: true,
    args: [
      {
        name: "host",
        required: true,
        description: "Single hostname or IP (no CIDR)",
      },
    ],
    build: (args) => {
      const host = validateHost(args.host || "");
      if (host.includes("/")) throw new Error("CIDR not allowed for this profile");
      return `command -v nmap >/dev/null && nmap -T3 --top-ports 20 --open ${host} || echo 'nmap not installed on Kali guest'`;
    },
  },
};

export function listProfiles() {
  return Object.values(KALI_PROFILES).map((p) => ({
    id: p.id,
    title: p.title,
    description: p.description,
    risk: p.risk,
    needsConfirm: p.needsConfirm,
    args: p.args,
  }));
}

export function getProfile(id: string): KaliProfile | null {
  return KALI_PROFILES[id] || null;
}
