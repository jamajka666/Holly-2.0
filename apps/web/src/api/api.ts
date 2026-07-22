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

export type AgentStep = {
  kind: string;
  name?: string;
  input?: unknown;
  output?: unknown;
  text?: string;
};

export type AgentChatResponse = {
  ok: boolean;
  reply: string;
  mode: "ollama" | "heuristic";
  model?: string;
  steps: AgentStep[];
  error?: string;
};

export type AgentStatus = {
  ok: boolean;
  ollama: boolean;
  model: string;
  mode: string;
  workspaceRoots: string[];
};

export async function getAgentStatus(): Promise<AgentStatus> {
  const res = await fetch(`${API}/agent/status`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Agent status failed: ${res.status}`);
  return res.json();
}

export async function agentChat(
  message: string,
  history: { role: "user" | "assistant"; content: string }[] = [],
): Promise<AgentChatResponse> {
  const res = await fetch(`${API}/agent/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, history }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Agent chat failed: ${res.status} ${err}`);
  }
  return res.json();
}

export { API };
