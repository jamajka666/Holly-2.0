const API = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ||
  "http://127.0.0.1:4000";

export type AlertItem = {
  id: string;
  type: string;
  message: string;
  ts: number;
};
export type AlertsResponse = { items: AlertItem[]; total: number };
export type Health = { ok: boolean; service: string; time: string; version?: string };

export async function getHealth(): Promise<Health> {
  const res = await fetch(`${API}/health`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Health failed: ${res.status}`);
  return res.json();
}

export async function getLatencyMs(): Promise<number> {
  const t0 = performance.now();
  const res = await fetch(`${API}/health`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Latency probe failed: ${res.status}`);
  await res.text();
  return Math.round(performance.now() - t0);
}

export async function getAlerts(): Promise<AlertsResponse> {
  const res = await fetch(`${API}/alerts`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Alerts failed: ${res.status}`);
  return res.json();
}

export { API };
