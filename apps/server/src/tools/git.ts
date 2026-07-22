import { spawn } from "node:child_process";
import { addAudit } from "../lib/audit.js";
import { listWorkspaceRoots } from "./fs.js";

function runGit(
  args: string[],
  cwd: string,
  timeoutMs = 12_000,
): Promise<{ code: number | null; stdout: string; stderr: string }> {
  return new Promise((resolve) => {
    const child = spawn("git", args, {
      cwd,
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env, GIT_PAGER: "cat", GIT_TERMINAL_PROMPT: "0" },
    });
    let stdout = "";
    let stderr = "";
    const t = setTimeout(() => {
      child.kill("SIGTERM");
    }, timeoutMs);
    child.stdout?.on("data", (d: Buffer) => {
      if (stdout.length < 48_000) stdout += d.toString("utf8");
    });
    child.stderr?.on("data", (d: Buffer) => {
      if (stderr.length < 16_000) stderr += d.toString("utf8");
    });
    child.on("close", (code) => {
      clearTimeout(t);
      resolve({ code, stdout, stderr });
    });
    child.on("error", (err) => {
      clearTimeout(t);
      resolve({ code: 1, stdout: "", stderr: String(err) });
    });
  });
}

function repoRoot(): string {
  return listWorkspaceRoots()[0] || process.cwd();
}

export async function gitStatus() {
  const cwd = repoRoot();
  const r = await runGit(["status", "--short", "--branch"], cwd);
  addAudit("TOOL_GIT_STATUS", "owner", { code: r.code });
  if (r.code !== 0) {
    return { ok: false as const, error: r.stderr || "git status failed", cwd };
  }
  return {
    ok: true as const,
    cwd,
    branch: r.stdout.split("\n")[0] || "",
    output: r.stdout,
  };
}

export async function gitDiff(opts: { staged?: boolean; path?: string } = {}) {
  const cwd = repoRoot();
  if (opts.path?.includes("..")) {
    return { ok: false as const, error: "invalid path" };
  }
  const args = ["diff", "-U2"];
  if (opts.staged) args.push("--cached");
  if (opts.path) {
    args.push("--", opts.path);
  }
  const r = await runGit(args, cwd);
  addAudit("TOOL_GIT_DIFF", "owner", {
    code: r.code,
    bytes: r.stdout.length,
    staged: !!opts.staged,
  });
  if (r.code !== 0) {
    return {
      ok: false as const,
      error: r.stderr || "git diff failed",
      cwd,
    };
  }
  return {
    ok: true as const,
    cwd,
    output: (r.stdout || "(no diff)").slice(0, 40_000),
  };
}
