import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { addAudit } from "../lib/audit.js";
import { listWorkspaceRoots, resolveSafePath } from "./fs.js";

export type SearchHit = {
  path: string;
  line: number;
  text: string;
};

const MAX_HITS = 40;
const MAX_FILE_SIZE = 256_000;
const SKIP_DIRS = new Set([
  "node_modules",
  ".git",
  "dist",
  "build",
  ".vite",
  "coverage",
]);

function hasRg(): Promise<boolean> {
  return new Promise((resolve) => {
    const c = spawn("rg", ["--version"], { stdio: "ignore" });
    c.on("error", () => resolve(false));
    c.on("close", (code) => resolve(code === 0));
  });
}

async function searchWithRg(
  query: string,
  root: string,
): Promise<SearchHit[]> {
  return new Promise((resolve) => {
    const hits: SearchHit[] = [];
    const args = [
      "--line-number",
      "--no-heading",
      "--color",
      "never",
      "--max-count",
      "5",
      "-g",
      "!node_modules",
      "-g",
      "!.git",
      "-g",
      "!dist",
      "-i",
      query,
      root,
    ];
    const child = spawn("rg", args, { stdio: ["ignore", "pipe", "pipe"] });
    let buf = "";
    child.stdout?.on("data", (d: Buffer) => {
      buf += d.toString("utf8");
    });
    child.on("close", () => {
      for (const line of buf.split("\n")) {
        if (!line || hits.length >= MAX_HITS) break;
        // path:line:text
        const m = line.match(/^(.*?):(\d+):(.*)$/);
        if (!m) continue;
        hits.push({
          path: m[1]!,
          line: Number(m[2]),
          text: m[3]!.slice(0, 200),
        });
      }
      resolve(hits);
    });
    child.on("error", () => resolve([]));
  });
}

async function walkSearch(
  dir: string,
  query: string,
  hits: SearchHit[],
  root: string,
): Promise<void> {
  if (hits.length >= MAX_HITS) return;
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }
  const q = query.toLowerCase();
  for (const e of entries) {
    if (hits.length >= MAX_HITS) return;
    if (e.name.startsWith(".") && e.name !== ".env.example") {
      if (e.isDirectory() && e.name !== ".github") continue;
    }
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (SKIP_DIRS.has(e.name)) continue;
      await walkSearch(full, query, hits, root);
    } else if (e.isFile()) {
      try {
        const st = await fs.stat(full);
        if (st.size > MAX_FILE_SIZE) continue;
        if (!/\.(ts|tsx|js|jsx|md|json|cjs|mjs|css|yml|yaml|txt|sh)$/i.test(e.name)) {
          continue;
        }
        const content = await fs.readFile(full, "utf8");
        const lines = content.split("\n");
        for (let i = 0; i < lines.length; i++) {
          if (hits.length >= MAX_HITS) break;
          if (lines[i]!.toLowerCase().includes(q)) {
            hits.push({
              path: path.relative(root, full) || full,
              line: i + 1,
              text: lines[i]!.slice(0, 200),
            });
          }
        }
      } catch {
        /* skip */
      }
    }
  }
}

export async function fsSearch(
  query: string,
  relPath = ".",
): Promise<
  | { ok: true; query: string; engine: "rg" | "walk"; hits: SearchHit[] }
  | { ok: false; error: string }
> {
  const q = query.trim();
  if (!q || q.length < 2) {
    return { ok: false, error: "query too short (min 2 chars)" };
  }
  if (q.length > 120) {
    return { ok: false, error: "query too long" };
  }

  const safe = resolveSafePath(relPath);
  if (!safe.ok) {
    addAudit("TOOL_FS_SEARCH_DENY", "owner", { query: q, reason: safe.reason });
    return { ok: false, error: safe.reason };
  }

  const useRg = await hasRg();
  let hits: SearchHit[];
  let engine: "rg" | "walk";
  if (useRg) {
    engine = "rg";
    hits = await searchWithRg(q, safe.abs);
  } else {
    engine = "walk";
    hits = [];
    await walkSearch(safe.abs, q, hits, listWorkspaceRoots()[0] || safe.abs);
  }

  addAudit("TOOL_FS_SEARCH", "owner", {
    query: q,
    engine,
    hits: hits.length,
    path: safe.abs,
  });
  return { ok: true, query: q, engine, hits };
}
