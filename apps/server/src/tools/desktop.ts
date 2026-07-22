import { spawn } from "node:child_process";
import { addAudit } from "../lib/audit.js";

function run(
  bin: string,
  args: string[],
  opts: { input?: string; timeoutMs?: number } = {},
): Promise<{ code: number | null; stdout: string; stderr: string; missing?: boolean }> {
  return new Promise((resolve) => {
    const child = spawn(bin, args, {
      stdio: opts.input != null ? ["pipe", "pipe", "pipe"] : ["ignore", "pipe", "pipe"],
      env: process.env,
    });
    let stdout = "";
    let stderr = "";
    const t = setTimeout(() => child.kill("SIGTERM"), opts.timeoutMs ?? 8000);
    child.stdout?.on("data", (d: Buffer) => {
      if (stdout.length < 32_000) stdout += d.toString("utf8");
    });
    child.stderr?.on("data", (d: Buffer) => {
      if (stderr.length < 8_000) stderr += d.toString("utf8");
    });
    if (opts.input != null && child.stdin) {
      child.stdin.write(opts.input);
      child.stdin.end();
    }
    child.on("error", (err: NodeJS.ErrnoException) => {
      clearTimeout(t);
      if (err.code === "ENOENT") {
        resolve({ code: 127, stdout: "", stderr: `${bin} not found`, missing: true });
        return;
      }
      resolve({ code: 1, stdout: "", stderr: String(err) });
    });
    child.on("close", (code) => {
      clearTimeout(t);
      resolve({ code, stdout, stderr });
    });
  });
}

const URL_RE = /^https?:\/\/[^\s]+$/i;

export async function openUrl(url: string) {
  const u = url.trim();
  if (!URL_RE.test(u)) {
    addAudit("TOOL_OPEN_URL_DENY", "owner", { url: u.slice(0, 120), reason: "invalid_url" });
    return { ok: false as const, error: "only http(s) URLs allowed" };
  }
  // block obvious local file / dangerous schemes already via regex
  const r = await run("xdg-open", [u]);
  addAudit("TOOL_OPEN_URL", "owner", { url: u.slice(0, 200), code: r.code, missing: r.missing });
  if (r.missing) return { ok: false as const, error: "xdg-open not available" };
  if (r.code !== 0) {
    return { ok: false as const, error: r.stderr || `xdg-open exit ${r.code}` };
  }
  return { ok: true as const, url: u };
}

export async function desktopNotify(title: string, body = "") {
  const t = title.trim().slice(0, 80) || "Holly";
  const b = body.trim().slice(0, 400);
  const r = await run("notify-send", ["--app-name=Holly 2.0", t, b]);
  addAudit("TOOL_NOTIFY", "owner", { title: t, code: r.code, missing: r.missing });
  if (r.missing) return { ok: false as const, error: "notify-send not available" };
  if (r.code !== 0) {
    return { ok: false as const, error: r.stderr || `notify-send exit ${r.code}` };
  }
  return { ok: true as const, title: t, body: b };
}

async function clipGetBackend(): Promise<
  | { ok: true; text: string; backend: string }
  | { ok: false; error: string }
> {
  // Wayland
  let r = await run("wl-paste", ["--no-newline"]);
  if (!r.missing && r.code === 0) {
    return { ok: true, text: r.stdout, backend: "wl-paste" };
  }
  // X11
  r = await run("xclip", ["-selection", "clipboard", "-o"]);
  if (!r.missing && r.code === 0) {
    return { ok: true, text: r.stdout, backend: "xclip" };
  }
  r = await run("xsel", ["--clipboard", "--output"]);
  if (!r.missing && r.code === 0) {
    return { ok: true, text: r.stdout, backend: "xsel" };
  }
  return {
    ok: false,
    error: "no clipboard tool (install wl-clipboard or xclip)",
  };
}

async function clipSetBackend(
  text: string,
): Promise<{ ok: true; backend: string } | { ok: false; error: string }> {
  let r = await run("wl-copy", [], { input: text });
  if (!r.missing && r.code === 0) return { ok: true, backend: "wl-copy" };
  r = await run("xclip", ["-selection", "clipboard"], { input: text });
  if (!r.missing && r.code === 0) return { ok: true, backend: "xclip" };
  r = await run("xsel", ["--clipboard", "--input"], { input: text });
  if (!r.missing && r.code === 0) return { ok: true, backend: "xsel" };
  return {
    ok: false,
    error: "no clipboard tool (install wl-clipboard or xclip)",
  };
}

export async function clipboardGet() {
  const r = await clipGetBackend();
  addAudit("TOOL_CLIPBOARD_GET", "owner", {
    ok: r.ok,
    backend: r.ok ? r.backend : undefined,
    bytes: r.ok ? r.text.length : 0,
  });
  if (!r.ok) return { ok: false as const, error: r.error };
  return {
    ok: true as const,
    text: r.text.slice(0, 16_000),
    truncated: r.text.length > 16_000,
    backend: r.backend,
  };
}

export async function clipboardSet(text: string) {
  if (text.length > 32_000) {
    return { ok: false as const, error: "text too long (max 32k)" };
  }
  const r = await clipSetBackend(text);
  addAudit("TOOL_CLIPBOARD_SET", "owner", {
    ok: r.ok,
    backend: r.ok ? r.backend : undefined,
    bytes: text.length,
  });
  if (!r.ok) return { ok: false as const, error: r.error };
  return { ok: true as const, backend: r.backend, bytes: text.length };
}

export async function desktopCapabilities() {
  const which = async (bin: string) => {
    const r = await run("which", [bin]);
    return r.code === 0 && !!r.stdout.trim();
  };
  return {
    openUrl: await which("xdg-open"),
    notify: await which("notify-send"),
    clipboard:
      (await which("wl-copy")) ||
      (await which("xclip")) ||
      (await which("xsel")),
  };
}
