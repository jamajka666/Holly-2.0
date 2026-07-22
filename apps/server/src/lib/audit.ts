import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export type AuditEvent = {
  id: number;
  ts: number;
  user_id: string | null;
  event: string;
  meta: Record<string, unknown>;
};

type DbShape = { audits: AuditEvent[] };

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, "../../data");
const FILE = path.join(DATA_DIR, "db.json");

function ensureDb(): DbShape {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(FILE)) {
    const empty: DbShape = { audits: [] };
    fs.writeFileSync(FILE, JSON.stringify(empty, null, 2));
    return empty;
  }
  try {
    const raw = JSON.parse(fs.readFileSync(FILE, "utf8")) as DbShape;
    if (!Array.isArray(raw.audits)) return { audits: [] };
    return raw;
  } catch {
    return { audits: [] };
  }
}

function save(db: DbShape) {
  fs.writeFileSync(FILE, JSON.stringify(db, null, 2));
}

const db = ensureDb();
const subscribers = new Set<(e: AuditEvent) => void>();

export function addAudit(
  event: string,
  user_id: string | null = null,
  meta: Record<string, unknown> = {},
): AuditEvent {
  const row: AuditEvent = {
    id: (db.audits.at(-1)?.id || 0) + 1,
    ts: Math.floor(Date.now() / 1000),
    user_id,
    event,
    meta,
  };
  db.audits.push(row);
  if (db.audits.length > 5000) db.audits.splice(0, db.audits.length - 5000);
  save(db);
  for (const send of subscribers) {
    try {
      send(row);
    } catch {
      /* ignore dead subscriber */
    }
  }
  return row;
}

export function recentAudit(limit = 100): AuditEvent[] {
  return [...db.audits].slice(-limit).reverse();
}

export function subscribeAudit(fn: (e: AuditEvent) => void): () => void {
  subscribers.add(fn);
  return () => subscribers.delete(fn);
}
