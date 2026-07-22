import path from "node:path";
import os from "node:os";

export type KaliConfig = {
  enabled: boolean;
  host: string;
  port: number;
  user: string;
  identityFile: string;
  connectTimeoutSec: number;
  commandTimeoutMs: number;
  strictHostKey: "yes" | "accept-new" | "no";
};

function expandHome(p: string): string {
  if (p.startsWith("~/")) return path.join(os.homedir(), p.slice(2));
  return p;
}

/** Load Kali SSH bridge settings from env (no secrets in code). */
export function loadKaliConfig(): KaliConfig {
  const host = (process.env.KALI_SSH_HOST || "").trim();
  const enabledEnv = process.env.KALI_ENABLED;
  const enabled =
    enabledEnv === "true" ||
    (enabledEnv !== "false" && host.length > 0);

  const identityFile = expandHome(
    process.env.KALI_SSH_KEY ||
      path.join(os.homedir(), ".ssh", "holly_kali_ed25519"),
  );

  const strictRaw = (process.env.KALI_SSH_STRICT_HOSTKEY || "accept-new").toLowerCase();
  const strictHostKey: KaliConfig["strictHostKey"] =
    strictRaw === "yes" || strictRaw === "no" || strictRaw === "accept-new"
      ? strictRaw
      : "accept-new";

  return {
    enabled,
    host,
    port: Number(process.env.KALI_SSH_PORT || 22),
    user: process.env.KALI_SSH_USER || "kali",
    identityFile,
    connectTimeoutSec: Number(process.env.KALI_SSH_CONNECT_TIMEOUT || 5),
    commandTimeoutMs: Number(process.env.KALI_SSH_COMMAND_TIMEOUT_MS || 60_000),
    strictHostKey,
  };
}

export function kaliConfigured(cfg: KaliConfig = loadKaliConfig()): boolean {
  return cfg.enabled && !!cfg.host && !!cfg.user;
}
