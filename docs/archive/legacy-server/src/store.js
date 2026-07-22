import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FILE = path.join(__dirname, "../data/db.json");

function load() {
  try { return JSON.parse(fs.readFileSync(FILE, "utf8")); }
  
}
function save(db) { fs.writeFileSync(FILE, JSON.stringify(db, null, 2)); }

const db = load();

export function addAudit(event, user_id = null, meta = {}) {
  const row = { id: (db.audits.at(-1)?.id || 0) + 1, ts: Math.floor(Date.now()/1000), user_id, event, meta };
  db.audits.push(row);
  if (db.audits.length > 5000) db.audits.splice(0, db.audits.length - 5000);
  save(db);
  return row;
}
export function recentAudit(limit = 100) {
  return [...db.audits].slice(-limit).reverse();
}
