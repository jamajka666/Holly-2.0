const API =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ||
  "http://127.0.0.1:4000";

const TOKEN_KEY = "holly.session.token";

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

function authHeaders(json = false): HeadersInit {
  const h: Record<string, string> = {};
  if (json) h["Content-Type"] = "application/json";
  const t = getToken();
  if (t) h.Authorization = `Bearer ${t}`;
  return h;
}

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

export type PendingTool = {
  name: string;
  args: Record<string, unknown>;
};

export type AgentChatResponse = {
  ok: boolean;
  reply: string;
  mode: "ollama" | "heuristic";
  model?: string;
  steps: AgentStep[];
  needsConfirm?: boolean;
  pending?: PendingTool | null;
  error?: string;
};

export type AgentStatus = {
  ok: boolean;
  ollama: boolean;
  model: string;
  mode: string;
  workspaceRoots: string[];
  authRequired?: boolean;
  voice?: string;
};

export async function getAgentStatus(): Promise<AgentStatus> {
  const res = await fetch(`${API}/agent/status`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Agent status failed: ${res.status}`);
  return res.json();
}

export async function pinLogin(pin: string, userId = "owner") {
  const res = await fetch(`${API}/auth/pin-login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pin, userId }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || `Login failed: ${res.status}`);
  }
  setToken(data.token);
  return data as { success: true; token: string; expiresAt: number };
}

export async function logout() {
  try {
    await fetch(`${API}/auth/logout`, {
      method: "POST",
      headers: authHeaders(),
    });
  } finally {
    setToken(null);
  }
}

export async function authSession(): Promise<{ authenticated: boolean; userId?: string }> {
  const t = getToken();
  if (!t) return { authenticated: false };
  const res = await fetch(`${API}/auth/session`, {
    headers: authHeaders(),
    cache: "no-store",
  });
  if (!res.ok) {
    setToken(null);
    return { authenticated: false };
  }
  const data = await res.json();
  return { authenticated: !!data.authenticated, userId: data.userId };
}

export async function agentChat(
  message: string,
  history: { role: "user" | "assistant"; content: string }[] = [],
  opts: { confirm?: boolean; pending?: PendingTool | null } = {},
): Promise<AgentChatResponse> {
  const res = await fetch(`${API}/agent/chat`, {
    method: "POST",
    headers: authHeaders(true),
    body: JSON.stringify({
      message,
      history,
      confirm: opts.confirm,
      pending: opts.pending ?? null,
    }),
  });
  if (res.status === 401) {
    setToken(null);
    throw new Error("Session vypršela — přihlas se PIN kódem.");
  }
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Agent chat failed: ${res.status} ${err}`);
  }
  return res.json();
}

export type AuditEvent = {
  id: number;
  ts: number;
  user_id: string | null;
  event: string;
  meta: Record<string, unknown>;
};

export async function getAuditRecent(limit = 40): Promise<AuditEvent[]> {
  const res = await fetch(`${API}/audit/recent?limit=${limit}`, {
    headers: authHeaders(),
    cache: "no-store",
  });
  if (res.status === 401) {
    setToken(null);
    throw new Error("unauthorized");
  }
  if (!res.ok) throw new Error(`Audit failed: ${res.status}`);
  const data = await res.json();
  return data.items ?? [];
}

export type PolicyStatus = {
  ownerOnly: boolean;
  note: string;
  shellAllowlist: string[];
  shellReadonly?: string[];
  workspaceRoots?: string[];
  tools?: Record<string, string[]>;
  desktop?: { openUrl: boolean; notify: boolean; clipboard: boolean };
  confirmRequired?: string[];
  voice?: { status?: string };
  kali?: { status?: string; mode?: string };
  pin?: { source?: string; changeableAtRuntime?: boolean; note?: string };
};

export async function getPolicyStatus(): Promise<PolicyStatus> {
  const res = await fetch(`${API}/policy/status`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Policy failed: ${res.status}`);
  return res.json();
}

export async function desktopNotify(title: string, body = "") {
  const res = await fetch(`${API}/desktop/notify`, {
    method: "POST",
    headers: authHeaders(true),
    body: JSON.stringify({ title, body }),
  });
  if (res.status === 401) {
    setToken(null);
    throw new Error("unauthorized");
  }
  return res.json();
}

export async function desktopOpenUrl(url: string) {
  const res = await fetch(`${API}/desktop/open-url`, {
    method: "POST",
    headers: authHeaders(true),
    body: JSON.stringify({ url }),
  });
  if (res.status === 401) {
    setToken(null);
    throw new Error("unauthorized");
  }
  return res.json();
}

export async function desktopCapabilities() {
  const res = await fetch(`${API}/desktop/capabilities`, {
    headers: authHeaders(),
    cache: "no-store",
  });
  if (res.status === 401) {
    setToken(null);
    throw new Error("unauthorized");
  }
  if (!res.ok) throw new Error(`Desktop caps failed: ${res.status}`);
  return res.json() as Promise<{
    ok: boolean;
    openUrl: boolean;
    notify: boolean;
    clipboard: boolean;
  }>;
}

export { API };
