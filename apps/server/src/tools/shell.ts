import { spawn } from "node:child_process";
import { classifyShellCommand } from "../lib/security.js";
import { addAudit } from "../lib/audit.js";
import { listWorkspaceRoots } from "./fs.js";

export type ShellResult =
  | {
      ok: true;
      command: string;
      code: number | null;
      stdout: string;
      stderr: string;
      timedOut: boolean;
    }
  | { ok: false; error: string; risk?: string };

const DEFAULT_TIMEOUT_MS = 15_000;
const MAX_OUTPUT = 32_000;

export async function shellExec(
  command: string,
  opts: { timeoutMs?: number; cwd?: string } = {},
): Promise<ShellResult> {
  const decision = classifyShellCommand(command);
  if (!decision.allowed) {
    addAudit("TOOL_SHELL_DENY", "owner", {
      command,
      reason: decision.reason,
      risk: decision.risk,
    });
    return { ok: false, error: decision.reason, risk: decision.risk };
  }

  const roots = listWorkspaceRoots();
  const cwd = opts.cwd && roots.some((r) => opts.cwd!.startsWith(r))
    ? opts.cwd
    : roots[0] || process.cwd();
  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  addAudit("TOOL_SHELL_START", "owner", { command, cwd });

  return new Promise((resolve) => {
    const child = spawn("bash", ["-lc", command], {
      cwd,
      env: {
        PATH: process.env.PATH,
        HOME: process.env.HOME,
        USER: process.env.USER,
        LANG: process.env.LANG,
      },
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    let timedOut = false;

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGTERM");
      setTimeout(() => child.kill("SIGKILL"), 1000);
    }, timeoutMs);

    child.stdout?.on("data", (d: Buffer) => {
      if (stdout.length < MAX_OUTPUT) stdout += d.toString("utf8");
    });
    child.stderr?.on("data", (d: Buffer) => {
      if (stderr.length < MAX_OUTPUT) stderr += d.toString("utf8");
    });

    child.on("close", (code) => {
      clearTimeout(timer);
      if (stdout.length >= MAX_OUTPUT) stdout += "\n…[truncated]";
      if (stderr.length >= MAX_OUTPUT) stderr += "\n…[truncated]";
      addAudit("TOOL_SHELL_DONE", "owner", {
        command,
        code,
        timedOut,
        stdoutBytes: stdout.length,
        stderrBytes: stderr.length,
      });
      resolve({
        ok: true,
        command,
        code,
        stdout,
        stderr,
        timedOut,
      });
    });

    child.on("error", (err) => {
      clearTimeout(timer);
      addAudit("TOOL_SHELL_ERROR", "owner", { command, error: String(err) });
      resolve({ ok: false, error: String(err) });
    });
  });
}
