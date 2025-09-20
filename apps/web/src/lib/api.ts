/** API base (DEV/PROD agnostické):
 *  - ""        -> použije se "/api"
 *  - "/api"    -> použije se "/api"
 *  - "http://…"-> použije se "http://…/api"
 */
export const API_BASE = (import.meta.env.VITE_ALERTS_API || "").trim();
function buildApiPrefix(base: string) {
  if (!base) return "/api";
  const b = base.replace(/\/+$/, "");
  return b.endsWith("/api") ? b : (b + "/api");
}
export const API_PREFIX = buildApiPrefix(API_BASE);
export function apiUrl(path: string) {
  const p = path.startsWith("/") ? path : "/" + path;
  return API_PREFIX + p;
}

// VAPID public key (Base64URL, začne "B...")
export const VAPID_PUBLIC = (import.meta.env.VITE_VAPID_PUBLIC_KEY || "").trim();

// pro DevTools
;(globalThis as any).__API_BASE = API_BASE;
;(globalThis as any).__API_PREFIX = API_PREFIX;
;(globalThis as any).__VAPID = VAPID_PUBLIC;

// ---------- helpers ----------
async function parseJsonOrThrow(r: Response, ctx: string) {
  const ct = r.headers.get("content-type") || "";
  if (r.ok && ct.includes("application/json")) return r.json();
  const text = await r.text();
  throw new Error(`${ctx}: ${r.status} ${text?.slice(0,200)}`);
}
function urlBase64ToUint8Array(base64Url: string) {
  const s = (base64Url || "").trim();
  if (!s) throw new Error("VAPID public key chybí (VITE_VAPID_PUBLIC_KEY)");
  const pad = "=".repeat((4 - (s.length % 4)) % 4);
  const b64 = (s + pad).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const out = new Uint8Array(raw.length);
  for (let i=0;i<raw.length;i++) out[i] = raw.charCodeAt(i);
  if (out.length !== 65 || out[0] !== 4) throw new Error("VAPID public key není platný RAW ECDSA P-256 (65B, první bajt 0x04).");
  return out;
}

// ---------- typy ----------
export type Alert = {
  id: number; title: string; message: string;
  cron: string | null; at: string | null; active: boolean;
  createdAt?: string; updatedAt?: string;
};

// ---------- REST ----------
export async function listAlerts(): Promise<Alert[]> {
  const r = await fetch(apiUrl("/alerts"));
  return parseJsonOrThrow(r, "listAlerts");
}
export async function createAlert(body: Partial<Alert>): Promise<Alert> {
  const r = await fetch(apiUrl("/alerts"), {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return parseJsonOrThrow(r, "createAlert");
}
export async function updateAlert(id: number, body: Partial<Alert>): Promise<Alert> {
  const r = await fetch(apiUrl(`/alerts/${id}`), {
    method: "PATCH", headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return parseJsonOrThrow(r, "updateAlert");
}
export async function deleteAlert(id: number): Promise<boolean> {
  const r = await fetch(apiUrl(`/alerts/${id}`), { method: "DELETE" });
  if (!r.ok) throw new Error(`deleteAlert: ${r.status}`);
  return true;
}
// ---------- Push subscribe ----------
export async function pushSubscribe(vapidPublicKey?: string) {
  const key = (vapidPublicKey || VAPID_PUBLIC || "").trim();
  if (!key) throw new Error("VAPID public key chybí (VITE_VAPID_PUBLIC_KEY)");
  const reg = await navigator.serviceWorker.ready;
  const prev = await reg.pushManager.getSubscription();
  if (prev) { try { await prev.unsubscribe(); } catch {} }
  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(key),
  });
  const r = await fetch(apiUrl("/subscriptions"), {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify(sub),
  });
  return parseJsonOrThrow(r, "pushSubscribe");
}
