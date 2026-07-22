import { useEffect, useRef, useState } from "react";
import {
  agentChat,
  getAgentStatus,
  type AgentStatus,
  type AgentStep,
} from "../api/api";

type Msg = {
  role: "user" | "assistant" | "system";
  content: string;
  mode?: string;
  steps?: AgentStep[];
};

export default function Chat() {
  const [status, setStatus] = useState<AgentStatus | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>([
    {
      role: "system",
      content:
        "Holly agent (M1). Bez Ollamy: `list`, `read README.md`, `run ls -la`, `workspace`.",
    },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getAgentStatus()
      .then(setStatus)
      .catch((e) => setErr(String(e)));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, busy]);

  async function send() {
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    setErr("");
    setBusy(true);
    setMsgs((m) => [...m, { role: "user", content: text }]);

    const history = msgs
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

    try {
      const res = await agentChat(text, history);
      setMsgs((m) => [
        ...m,
        {
          role: "assistant",
          content: res.reply,
          mode: res.mode,
          steps: res.steps,
        },
      ]);
      // refresh status (ollama may have come up)
      getAgentStatus().then(setStatus).catch(() => {});
    } catch (e) {
      setErr(String(e));
      setMsgs((m) => [
        ...m,
        { role: "assistant", content: `Chyba: ${String(e)}` },
      ]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-4xl mx-auto gap-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h1 className="text-lg tracking-widest glow">
          AGENT <span className="text-holly-neon-green">CHAT</span>
        </h1>
        <div className="text-xs text-slate-400 flex gap-3 flex-wrap">
          <span>
            mode:{" "}
            <span className="text-holly-neon-green">
              {status?.mode ?? "…"}
            </span>
          </span>
          <span>
            ollama:{" "}
            <span className={status?.ollama ? "text-holly-neon-green" : "text-red-400"}>
              {status ? (status.ollama ? "up" : "down") : "…"}
            </span>
          </span>
          {status?.model && <span>model: {status.model}</span>}
        </div>
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
            {m.steps && m.steps.length > 0 && (
              <details className="mt-2 text-xs text-slate-400">
                <summary className="cursor-pointer">
                  steps ({m.steps.length})
                </summary>
                <pre className="mt-1 overflow-auto max-h-40">
                  {JSON.stringify(m.steps, null, 2)}
                </pre>
              </details>
            )}
          </div>
        ))}
        {busy && (
          <div className="text-xs text-slate-400 animate-pulse">Holly přemýšlí…</div>
        )}
        <div ref={bottomRef} />
      </div>

      {err && <div className="text-xs text-red-300 break-words">{err}</div>}

      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
      >
        <input
          className="flex-1 rounded-xl border border-slate-700/60 bg-holly-panel px-3 py-2 text-sm outline-none focus:border-holly-neon-green/50"
          placeholder="Napiš příkaz nebo otázku…"
          value={input}
          disabled={busy}
          onChange={(e) => setInput(e.target.value)}
        />
        <button type="submit" className="btn-primary" disabled={busy || !input.trim()}>
          Send
        </button>
      </form>
    </div>
  );
}
