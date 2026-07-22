import { useEffect, useRef, useState } from "react";
import {
  agentChat,
  authSession,
  getAgentStatus,
  getToken,
  logout,
  pinLogin,
  type AgentStatus,
  type AgentStep,
  type PendingTool,
} from "../api/api";

type Msg = {
  role: "user" | "assistant" | "system";
  content: string;
  mode?: string;
  steps?: AgentStep[];
  needsConfirm?: boolean;
};

const QUICK = [
  { label: "list", text: "list" },
  { label: "git status", text: "git status" },
  { label: "git diff", text: "git diff" },
  { label: "read README", text: "read README.md" },
  { label: "search agent", text: "search runAgent" },
  { label: "notify", text: "notify Holly | Test z chatu" },
  { label: "workspace", text: "workspace" },
];

function StepList({ steps }: { steps: AgentStep[] }) {
  const tools = steps.filter((s) => s.kind === "tool" || s.kind === "confirm");
  if (!tools.length) {
    return (
      <details className="mt-2 text-xs text-slate-400">
        <summary className="cursor-pointer">steps ({steps.length})</summary>
        <pre className="mt-1 overflow-auto max-h-40">
          {JSON.stringify(steps, null, 2)}
        </pre>
      </details>
    );
  }
  return (
    <div className="mt-2 space-y-1">
      {tools.map((s, i) => {
        const out = s.output as { ok?: boolean } | undefined;
        const ok = out && "ok" in out ? out.ok : s.kind !== "confirm";
        return (
          <div
            key={i}
            className="text-xs rounded-lg border border-slate-700/50 px-2 py-1 flex gap-2 items-start"
          >
            <span
              className={
                s.kind === "confirm"
                  ? "text-amber-400"
                  : ok === false
                    ? "text-red-400"
                    : "text-holly-neon-green"
              }
            >
              {s.kind === "confirm" ? "⏳" : ok === false ? "✗" : "✓"}
            </span>
            <div className="min-w-0 flex-1">
              <div className="font-mono text-slate-300">{s.name}</div>
              {s.input != null && (
                <div className="text-slate-500 truncate">
                  {typeof s.input === "string"
                    ? s.input
                    : JSON.stringify(s.input).slice(0, 120)}
                </div>
              )}
            </div>
          </div>
        );
      })}
      <details className="text-xs text-slate-500">
        <summary className="cursor-pointer">raw ({steps.length})</summary>
        <pre className="mt-1 overflow-auto max-h-32">
          {JSON.stringify(steps, null, 2)}
        </pre>
      </details>
    </div>
  );
}

export default function Chat() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [pin, setPin] = useState("");
  const [status, setStatus] = useState<AgentStatus | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>([
    {
      role: "system",
      content:
        "Holly agent M1.5 — text only (hlas odložen). Po PIN: list, git status, search …, write path <<< text (confirm).",
    },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [pending, setPending] = useState<PendingTool | null>(null);
  const lastUserMsg = useRef("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getAgentStatus()
      .then(setStatus)
      .catch((e) => setErr(String(e)));
    if (!getToken()) {
      setAuthed(false);
      return;
    }
    authSession()
      .then((s) => setAuthed(s.authenticated))
      .catch(() => setAuthed(false));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, busy, pending]);

  async function doLogin(e?: React.FormEvent) {
    e?.preventDefault();
    setErr("");
    try {
      await pinLogin(pin);
      setAuthed(true);
      setPin("");
      setMsgs((m) => [
        ...m,
        { role: "system", content: "Přihlášení OK — owner session aktivní." },
      ]);
    } catch (ex) {
      setErr(String(ex));
      setAuthed(false);
    }
  }

  async function doLogout() {
    await logout();
    setAuthed(false);
    setPending(null);
    setMsgs((m) => [
      ...m,
      { role: "system", content: "Odhlášeno. Pro agenta zadej znovu PIN." },
    ]);
  }

  async function sendText(text: string, opts?: { confirm?: boolean }) {
    if (!text.trim() || busy) return;
    setErr("");
    setBusy(true);
    if (!opts?.confirm) {
      lastUserMsg.current = text.trim();
      setMsgs((m) => [...m, { role: "user", content: text.trim() }]);
      setInput("");
    } else {
      setMsgs((m) => [
        ...m,
        { role: "user", content: "✓ Potvrzuji akci" },
      ]);
    }

    const history = msgs
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

    try {
      const res = await agentChat(
        opts?.confirm ? lastUserMsg.current || "confirm" : text.trim(),
        history,
        {
          confirm: opts?.confirm,
          pending: opts?.confirm ? pending : null,
        },
      );
      setMsgs((m) => [
        ...m,
        {
          role: "assistant",
          content: res.reply,
          mode: res.mode,
          steps: res.steps,
          needsConfirm: res.needsConfirm,
        },
      ]);
      if (res.needsConfirm && res.pending) {
        setPending(res.pending);
      } else {
        setPending(null);
      }
      getAgentStatus().then(setStatus).catch(() => {});
    } catch (e) {
      const msg = String(e);
      setErr(msg);
      if (msg.includes("Session") || msg.includes("401")) setAuthed(false);
      setMsgs((m) => [
        ...m,
        { role: "assistant", content: `Chyba: ${msg}` },
      ]);
    } finally {
      setBusy(false);
    }
  }

  if (authed === null) {
    return <div className="text-sm text-slate-400 p-4">Kontrola session…</div>;
  }

  if (!authed) {
    return (
      <div className="max-w-md mx-auto card p-6 space-y-4">
        <h1 className="text-lg tracking-widest glow">
          OWNER <span className="text-holly-neon-green">PIN</span>
        </h1>
        <p className="text-sm text-slate-400">
          Agent endpointy vyžadují owner session. Výchozí dev PIN je v{" "}
          <code className="text-holly-neon-green">OWNER_PIN</code> (default{" "}
          <code>0000</code>).
        </p>
        {status && (
          <p className="text-xs text-slate-500">
            Core mode: {status.mode} · ollama {status.ollama ? "up" : "down"} ·
            voice: {status.voice ?? "deferred"}
          </p>
        )}
        <form onSubmit={doLogin} className="flex gap-2">
          <input
            type="password"
            inputMode="numeric"
            autoComplete="current-password"
            className="flex-1 rounded-xl border border-slate-700/60 bg-holly-panel px-3 py-2 text-sm"
            placeholder="PIN"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
          />
          <button type="submit" className="btn-primary" disabled={pin.length < 4}>
            Unlock
          </button>
        </form>
        {err && <div className="text-xs text-red-300">{err}</div>}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-4xl mx-auto gap-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h1 className="text-lg tracking-widest glow">
          AGENT <span className="text-holly-neon-green">CHAT</span>
        </h1>
        <div className="text-xs text-slate-400 flex gap-3 flex-wrap items-center">
          <span>
            mode:{" "}
            <span className="text-holly-neon-green">{status?.mode ?? "…"}</span>
          </span>
          <span>
            ollama:{" "}
            <span
              className={
                status?.ollama ? "text-holly-neon-green" : "text-red-400"
              }
            >
              {status ? (status.ollama ? "up" : "down") : "…"}
            </span>
          </span>
          <button type="button" className="btn text-xs" onClick={() => void doLogout()}>
            Logout
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {QUICK.map((q) => (
          <button
            key={q.label}
            type="button"
            className="btn text-xs"
            disabled={busy}
            onClick={() => void sendText(q.text)}
          >
            {q.label}
          </button>
        ))}
      </div>

      <div className="card flex-1 overflow-auto space-y-3 p-3">
        {msgs.map((m, i) => (
          <div
            key={i}
            className={
              "rounded-xl border px-3 py-2 text-sm whitespace-pre-wrap " +
              (m.role === "user"
                ? "border-holly-neon-green/30 bg-holly-mut/40 ml-8"
                : m.role === "system"
                  ? "border-slate-700/60 text-slate-400"
                  : "border-slate-700/60 bg-holly-panel/80 mr-8")
            }
          >
            <div className="text-[10px] tracking-widest text-slate-500 mb-1">
              {m.role.toUpperCase()}
              {m.mode ? ` · ${m.mode}` : ""}
            </div>
            {m.content}
            {m.steps && m.steps.length > 0 && <StepList steps={m.steps} />}
          </div>
        ))}
        {busy && (
          <div className="text-xs text-slate-400 animate-pulse">
            Holly přemýšlí…
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {pending && (
        <div className="rounded-xl border border-amber-500/40 bg-amber-950/30 px-3 py-2 flex flex-wrap items-center gap-3 justify-between">
          <div className="text-sm text-amber-100">
            Čeká potvrzení:{" "}
            <span className="font-mono text-amber-300">{pending.name}</span>
            <div className="text-xs text-amber-200/70 truncate max-w-xl">
              {JSON.stringify(pending.args).slice(0, 160)}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              className="btn text-xs"
              disabled={busy}
              onClick={() => setPending(null)}
            >
              Zrušit
            </button>
            <button
              type="button"
              className="btn-primary text-xs"
              disabled={busy}
              onClick={() => void sendText(lastUserMsg.current || "confirm", { confirm: true })}
            >
              Potvrdit
            </button>
          </div>
        </div>
      )}

      {err && <div className="text-xs text-red-300 break-words">{err}</div>}

      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void sendText(input);
        }}
      >
        <input
          className="flex-1 rounded-xl border border-slate-700/60 bg-holly-panel px-3 py-2 text-sm outline-none focus:border-holly-neon-green/50"
          placeholder="Napiš příkaz nebo otázku…"
          value={input}
          disabled={busy}
          onChange={(e) => setInput(e.target.value)}
        />
        <button
          type="submit"
          className="btn-primary"
          disabled={busy || !input.trim()}
        >
          Send
        </button>
      </form>
    </div>
  );
}
