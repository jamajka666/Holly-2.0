import { spawn, type ChildProcess } from "node:child_process";
import fs from "node:fs";
import { addAudit } from "../lib/audit.js";
import { kaliConfigured, loadKaliConfig, type KaliConfig } from "./config.js";
import { getProfile, listProfiles } from "./profiles.js";

export type KaliRunResult =
  | {
      ok: true;
      profile: string;
      command: string;
      code: number | null;
      stdout: string;
      stderr: string;
      timedOut: boolean;
      aborted: boolean;
      durationMs: number;
    }
  | {
      ok: false;
      error: string;
      profile?: string;
      needsConfirm?: boolean;
      configured?: boolean;
      reachable?: boolean;
    };

type ActiveJob = {
  id: string;
  profile: string;
  startedAt: number;
  child: ChildProcess;
};

const active = new Map<string, ActiveJob>();
const history: Array<Record<string, unknown>> = [];
const MAX_HISTORY = 30;
const MAX_OUT = 48_000;

function pushHistory(row: Record<string, unknown>) {
  history.unshift(row);
  if (history.length > MAX_HISTORY) history.length = MAX_HISTORY;
}

function sshBaseArgs(cfg: KaliConfig): string[] {
  return [
    "-p",
    String(cfg.port),
    "-i",
    cfg.identityFile,
    "-o",
    "BatchMode=yes",
    "-o",
    `ConnectTimeout=${cfg.connectTimeoutSec}`,
    "-o",
    `StrictHostKeyChecking=${cfg.strictHostKey}`,
    "-o",
    "IdentitiesOnly=yes",
    "-o",
    "PasswordAuthentication=no",
    `${cfg.user}@${cfg.host}`,
  ];
}

export function kaliStatus() {
  const cfg = loadKaliConfig();
  const keyExists = fs.existsSync(cfg.identityFile);
  return {
    ok: true as const,
    configured: kaliConfigured(cfg),
    enabled: cfg.enabled,
    host: cfg.host || null,
    port: cfg.port,
    user: cfg.user,
    identityFile: cfg.identityFile,
    keyExists,
    strictHostKey: cfg.strictHostKey,
    profiles: listProfiles(),
    activeJobs: [...active.values()].map((j) => ({
      id: j.id,
      profile: j.profile,
      startedAt: j.startedAt,
    })),
    recent: history.slice(0, 10),
  };
}

/** SSH connectivity probe (remote `true`). */
export async function kaliPing(): Promise<{
  ok: boolean;
  reachable: boolean;
  error?: string;
  latencyMs?: number;
}> {
  const cfg = loadKaliConfig();
  if (!kaliConfigured(cfg)) {
    return {
      ok: false,
      reachable: false,
      error: "Kali not configured (set KALI_SSH_HOST and KALI_ENABLED)",
    };
  }
  if (!fs.existsSync(cfg.identityFile)) {
    return {
      ok: false,
      reachable: false,
      error: `SSH key missing: ${cfg.identityFile}`,
    };
  }

  const t0 = Date.now();
  const result = await runSsh(cfg, "true", Math.min(cfg.commandTimeoutMs, 15_000));
  const latencyMs = Date.now() - t0;
  if (!result.ok) {
    addAudit("KALI_PING", "owner", {
      reachable: false,
      latencyMs,
      error: result.error,
    });
    return { ok: false, reachable: false, error: result.error, latencyMs };
  }
  addAudit("KALI_PING", "owner", {
    reachable: result.code === 0,
    latencyMs,
    code: result.code,
  });
  if (result.code !== 0) {
    return {
      ok: false,
      reachable: false,
      error: result.stderr || `ssh exit ${result.code}`,
      latencyMs,
    };
  }
  return { ok: true, reachable: true, latencyMs };
}

type SshExecOk = {
  ok: true;
  code: number | null;
  stdout: string;
  stderr: string;
  timedOut: boolean;
  aborted: boolean;
  jobId: string;
};
type SshExecFail = { ok: false; error: string };

function runSsh(
  cfg: KaliConfig,
  remoteCommand: string,
  timeoutMs: number,
  meta?: { profile?: string },
): Promise<SshExecOk | SshExecFail> {
  return new Promise((resolve) => {
    const jobId = `kali-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
    const args = [...sshBaseArgs(cfg), remoteCommand];
    const child = spawn("ssh", args, {
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env, SSH_AUTH_SOCK: process.env.SSH_AUTH_SOCK },
    });

    active.set(jobId, {
      id: jobId,
      profile: meta?.profile || "raw",
      startedAt: Date.now(),
      child,
    });

    let stdout = "";
    let stderr = "";
    let timedOut = false;
    let aborted = false;

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGTERM");
      setTimeout(() => child.kill("SIGKILL"), 1500);
    }, timeoutMs);

    child.stdout?.on("data", (d: Buffer) => {
      if (stdout.length < MAX_OUT) stdout += d.toString("utf8");
    });
    child.stderr?.on("data", (d: Buffer) => {
      if (stderr.length < MAX_OUT) stderr += d.toString("utf8");
    });

    child.on("error", (err) => {
      clearTimeout(timer);
      active.delete(jobId);
      resolve({ ok: false, error: String(err) });
    });

    child.on("close", (code, signal) => {
      clearTimeout(timer);
      active.delete(jobId);
      if (signal === "SIGTERM" || signal === "SIGKILL") {
        if (!timedOut) aborted = true;
      }
      if (stdout.length >= MAX_OUT) stdout += "\n…[truncated]";
      if (stderr.length >= MAX_OUT) stderr += "\n…[truncated]";
      resolve({
        ok: true,
        code,
        stdout,
        stderr,
        timedOut,
        aborted,
        jobId,
      });
    });
  });
}

export function kaliAbort(jobId?: string): { ok: boolean; killed: string[] } {
  const killed: string[] = [];
  if (jobId) {
    const j = active.get(jobId);
    if (j) {
      j.child.kill("SIGTERM");
      setTimeout(() => j.child.kill("SIGKILL"), 1000);
      killed.push(jobId);
      addAudit("KALI_ABORT", "owner", { jobId });
    }
  } else {
    for (const [id, j] of active) {
      j.child.kill("SIGTERM");
      setTimeout(() => j.child.kill("SIGKILL"), 1000);
      killed.push(id);
    }
    if (killed.length) addAudit("KALI_ABORT_ALL", "owner", { killed });
  }
  return { ok: true, killed };
}

export async function kaliRun(
  profileId: string,
  args: Record<string, string> = {},
  opts: { confirm?: boolean } = {},
): Promise<KaliRunResult> {
  const cfg = loadKaliConfig();
  if (!kaliConfigured(cfg)) {
    return {
      ok: false,
      error: "Kali bridge not configured. See docs/KALI.md",
      configured: false,
    };
  }
  if (!fs.existsSync(cfg.identityFile)) {
    return {
      ok: false,
      error: `SSH private key not found: ${cfg.identityFile}`,
      configured: true,
    };
  }

  const profile = getProfile(profileId);
  if (!profile) {
    return {
      ok: false,
      error: `Unknown profile "${profileId}". Allowed: ${listProfiles()
        .map((p) => p.id)
        .join(", ")}`,
    };
  }

  if (profile.needsConfirm && !opts.confirm) {
    addAudit("KALI_NEEDS_CONFIRM", "owner", { profile: profileId, args });
    return {
      ok: false,
      profile: profileId,
      needsConfirm: true,
      error: `Profile "${profileId}" requires confirm: true`,
    };
  }

  // required args
  for (const a of profile.args) {
    if (a.required && !String(args[a.name] || "").trim()) {
      return {
        ok: false,
        profile: profileId,
        error: `Missing required arg: ${a.name}`,
      };
    }
  }

  let command: string;
  try {
    command = profile.build(args);
  } catch (e) {
    return {
      ok: false,
      profile: profileId,
      error: e instanceof Error ? e.message : String(e),
    };
  }

  addAudit("KALI_RUN_START", "owner", {
    profile: profileId,
    risk: profile.risk,
    args,
  });

  const t0 = Date.now();
  const exec = await runSsh(cfg, command, cfg.commandTimeoutMs, {
    profile: profileId,
  });
  const durationMs = Date.now() - t0;

  if (!exec.ok) {
    addAudit("KALI_RUN_ERROR", "owner", { profile: profileId, error: exec.error });
    pushHistory({
      at: Date.now(),
      profile: profileId,
      ok: false,
      error: exec.error,
    });
    return { ok: false, profile: profileId, error: exec.error };
  }

  const row = {
    at: Date.now(),
    profile: profileId,
    command,
    code: exec.code,
    timedOut: exec.timedOut,
    aborted: exec.aborted,
    durationMs,
    stdoutPreview: exec.stdout.slice(0, 400),
  };
  pushHistory(row);
  addAudit("KALI_RUN_DONE", "owner", {
    profile: profileId,
    code: exec.code,
    timedOut: exec.timedOut,
    aborted: exec.aborted,
    durationMs,
  });

  return {
    ok: true,
    profile: profileId,
    command,
    code: exec.code,
    stdout: exec.stdout,
    stderr: exec.stderr,
    timedOut: exec.timedOut,
    aborted: exec.aborted,
    durationMs,
  };
}

export function kaliHistory() {
  return history.slice(0, MAX_HISTORY);
}
