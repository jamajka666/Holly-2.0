/**
 * Owner-only security policy (Milestone 0 baseline).
 * High-risk actions must never run without verification layers:
 * session/PIN → speaker ID (M2) → explicit confirm for destructive ops.
 */

export type RiskLevel = "low" | "medium" | "high";

export type PolicyDecision =
  | { allowed: true; risk: RiskLevel }
  | { allowed: false; risk: RiskLevel; reason: string };

const HIGH_RISK_PATTERNS = [
  /rm\s+-rf/i,
  /mkfs/i,
  /dd\s+if=/i,
  /:(){ :\|:& };:/,
  /shutdown|reboot|poweroff/i,
  /iptables|ufw\s+disable/i,
];

/** Shell commands allowed without extra confirm (host). */
export const SHELL_ALLOWLIST = [
  "ls",
  "pwd",
  "whoami",
  "date",
  "uname",
  "df",
  "free",
  "cat",
  "head",
  "tail",
  "wc",
  "git",
  "node",
  "npm",
  "rg",
  "find",
  "echo",
  "which",
  "file",
];

/** Shell bins considered read-only (no confirm required). */
export const SHELL_READONLY = new Set([
  "ls",
  "pwd",
  "whoami",
  "date",
  "uname",
  "df",
  "free",
  "cat",
  "head",
  "tail",
  "wc",
  "rg",
  "find",
  "which",
  "file",
  "echo",
]);

export function shellNeedsConfirm(cmd: string): boolean {
  const bin = cmd.trim().split(/\s+/)[0]?.replace(/^.*\//, "") ?? "";
  if (bin === "git") {
    // only read-only git subcommands free
    const sub = cmd.trim().split(/\s+/)[1] || "";
    return !["status", "diff", "log", "show", "branch", "rev-parse"].includes(sub);
  }
  if (bin === "npm" || bin === "node") return true;
  return !SHELL_READONLY.has(bin);
}

export function classifyShellCommand(cmd: string): PolicyDecision {
  const trimmed = cmd.trim();
  if (!trimmed) return { allowed: false, risk: "low", reason: "empty command" };

  for (const re of HIGH_RISK_PATTERNS) {
    if (re.test(trimmed)) {
      return {
        allowed: false,
        risk: "high",
        reason: "high-risk pattern blocked (requires explicit multi-factor confirm)",
      };
    }
  }

  const bin = trimmed.split(/\s+/)[0]?.replace(/^.*\//, "") ?? "";
  if (!SHELL_ALLOWLIST.includes(bin)) {
    return {
      allowed: false,
      risk: "medium",
      reason: `binary "${bin}" not on allowlist`,
    };
  }

  return { allowed: true, risk: "low" };
}

export function ownerOnlyNote(): string {
  return "Holly executes commands only for the enrolled owner after verification.";
}
