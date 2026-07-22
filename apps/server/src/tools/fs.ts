import fs from "node:fs/promises";
import path from "node:path";
import { addAudit } from "../lib/audit.js";

function workspaceRoots(): string[] {
  const raw =
    process.env.WORKSPACE_ROOTS ||
    path.resolve(process.cwd(), "../.."); // monorepo root when run from apps/server
  return raw
    .split(",")
    .map((s) => path.resolve(s.trim()))
    .filter(Boolean);
}

/** Resolve path only if it stays inside an allowed workspace root. */
export function resolveSafePath(userPath: string): {
  ok: true;
  abs: string;
  root: string;
} | { ok: false; reason: string } {
  const roots = workspaceRoots();
  if (!roots.length) return { ok: false, reason: "no WORKSPACE_ROOTS configured" };

  const candidate = path.resolve(
    userPath.startsWith("/") ? userPath : path.join(roots[0]!, userPath),
  );

  for (const root of roots) {
    const rel = path.relative(root, candidate);
    if (rel === "" || (!rel.startsWith("..") && !path.isAbsolute(rel))) {
      return { ok: true, abs: candidate, root };
    }
  }
  return {
    ok: false,
    reason: `path outside workspace roots: ${candidate}`,
  };
}

export async function fsList(relOrAbs: string, maxEntries = 200) {
  const safe = resolveSafePath(relOrAbs || ".");
  if (!safe.ok) {
    addAudit("TOOL_FS_LIST_DENY", "owner", { path: relOrAbs, reason: safe.reason });
    return { ok: false as const, error: safe.reason };
  }
  const entries = await fs.readdir(safe.abs, { withFileTypes: true });
  const items = entries.slice(0, maxEntries).map((e) => ({
    name: e.name,
    type: e.isDirectory() ? "dir" : e.isFile() ? "file" : "other",
  }));
  addAudit("TOOL_FS_LIST", "owner", { path: safe.abs, count: items.length });
  return { ok: true as const, path: safe.abs, items };
}

export async function fsRead(relOrAbs: string, maxBytes = 64_000) {
  const safe = resolveSafePath(relOrAbs);
  if (!safe.ok) {
    addAudit("TOOL_FS_READ_DENY", "owner", { path: relOrAbs, reason: safe.reason });
    return { ok: false as const, error: safe.reason };
  }
  const st = await fs.stat(safe.abs);
  if (!st.isFile()) {
    return { ok: false as const, error: "not a file" };
  }
  if (st.size > maxBytes) {
    const buf = Buffer.alloc(maxBytes);
    const fh = await fs.open(safe.abs, "r");
    try {
      await fh.read(buf, 0, maxBytes, 0);
    } finally {
      await fh.close();
    }
    const content = buf.toString("utf8");
    addAudit("TOOL_FS_READ", "owner", {
      path: safe.abs,
      truncated: true,
      bytes: maxBytes,
    });
    return {
      ok: true as const,
      path: safe.abs,
      content,
      truncated: true,
      size: st.size,
    };
  }
  const content = await fs.readFile(safe.abs, "utf8");
  addAudit("TOOL_FS_READ", "owner", { path: safe.abs, bytes: content.length });
  return {
    ok: true as const,
    path: safe.abs,
    content,
    truncated: false,
    size: st.size,
  };
}

export async function fsWrite(relOrAbs: string, content: string) {
  const safe = resolveSafePath(relOrAbs);
  if (!safe.ok) {
    addAudit("TOOL_FS_WRITE_DENY", "owner", { path: relOrAbs, reason: safe.reason });
    return { ok: false as const, error: safe.reason };
  }
  // Block writes outside repo-ish sensitive paths
  const base = path.basename(safe.abs);
  if (base === ".env" || base.endsWith(".pem") || base.endsWith(".key")) {
    addAudit("TOOL_FS_WRITE_DENY", "owner", { path: safe.abs, reason: "sensitive file" });
    return { ok: false as const, error: "refusing to write sensitive file" };
  }
  await fs.mkdir(path.dirname(safe.abs), { recursive: true });
  await fs.writeFile(safe.abs, content, "utf8");
  addAudit("TOOL_FS_WRITE", "owner", { path: safe.abs, bytes: content.length });
  return { ok: true as const, path: safe.abs, bytes: content.length };
}

export function listWorkspaceRoots() {
  return workspaceRoots();
}
