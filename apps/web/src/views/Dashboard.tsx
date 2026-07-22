import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import StatTile from "../components/StatTile";
import { StatusBadge } from "../components/StatusBadge";
import { useToast } from "../lib/toast";
import {
  authSession,
  getAgentStatus,
  getAlerts,
  getAuditRecent,
  getHealth,
  getLatencyMs,
  getToken,
  type AgentStatus,
  type AlertItem,
  type AuditEvent,
} from "../api/api";

function countByType(items: AlertItem[]) {
  const c: Record<string, number> = {};
  for (const it of items) c[it.type] = (c[it.type] ?? 0) + 1;
  return c;
}

function fmtTs(ts: number) {
  // audit uses seconds
  const ms = ts < 1e12 ? ts * 1000 : ts;
  try {
    return new Date(ms).toLocaleString();
  } catch {
    return String(ts);
  }
}

export default function Dashboard() {
  const t = useToast();

  const [apiOk, setApiOk] = useState<boolean | null>(null);
  const [latency, setLatency] = useState<number | null>(null);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [audit, setAudit] = useState<AuditEvent[]>([]);
  const [agent, setAgent] = useState<AgentStatus | null>(null);
  const [authed, setAuthed] = useState(false);
  const [err, setErr] = useState("");

  const counts = useMemo(() => countByType(alerts), [alerts]);
  const alertsHint = useMemo(() => {
    const crit = counts.CRIT ?? counts.CRITICAL ?? counts.ERROR ?? 0;
    const warn = counts.WARN ?? 0;
    const info = counts.INFO ?? 0;
    const parts = [
      crit ? `${crit} error` : null,
      warn ? `${warn} warning` : null,
      info ? `${info} info` : null,
    ].filter(Boolean);
    return parts.length ? parts.join(", ") : "no alerts";
  }, [counts]);

  useEffect(() => {
    let alive = true;

    async function tick() {
      try {
        setErr("");
        const [health, ms, a, st] = await Promise.all([
          getHealth(),
          getLatencyMs(),
          getAlerts(),
          getAgentStatus(),
        ]);
        if (!alive) return;
        setApiOk(!!health.ok);
        setLatency(ms);
        setAlerts(a.items ?? []);
        setAgent(st);

        if (getToken()) {
          const sess = await authSession();
          if (!alive) return;
          setAuthed(sess.authenticated);
          if (sess.authenticated) {
            const items = await getAuditRecent(30);
            if (!alive) return;
            setAudit(items);
          } else {
            setAudit([]);
          }
        } else {
          setAuthed(false);
          setAudit([]);
        }
      } catch (e) {
        if (!alive) return;
        setApiOk(false);
        setErr(String(e));
      }
    }

    tick();
    const id = window.setInterval(tick, 5000);
    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, []);

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <div className="md:col-span-2 grid gap-4 md:grid-cols-2">
        <StatTile
          label="Alerts"
          value={String(alerts.length)}
          hint={alertsHint}
        />
        <StatTile
          label="Audit events"
          value={authed ? String(audit.length) : "—"}
          hint={authed ? "last poll" : "login on Agent for audit"}
        />
        <StatTile
          label="Latency"
          value={latency === null ? "…" : `${latency} ms`}
          hint="avg API RTT"
        />
        <StatTile
          label="Agent mode"
          value={agent?.mode ?? "…"}
          hint={
            agent
              ? `ollama ${agent.ollama ? "up" : "down"} · voice deferred`
              : "…"
          }
        />
      </div>

      <div className="card">
        <div className="flex items-center justify-between">
          <h3 className="text-sm tracking-widest text-slate-400">SYSTEM</h3>
          <StatusBadge state={apiOk === false ? "offline" : "online"} />
        </div>

        <ul className="mt-3 text-sm space-y-2">
          <li className="flex justify-between">
            <span>API</span>
            <span
              className={
                apiOk === false ? "text-red-400" : "text-holly-neon-green"
              }
            >
              {apiOk === false ? "DOWN" : "OK"}
            </span>
          </li>
          <li className="flex justify-between">
            <span>Session</span>
            <span
              className={
                authed ? "text-holly-neon-green" : "text-slate-400"
              }
            >
              {authed ? "OWNER" : "none"}
            </span>
          </li>
          <li className="flex justify-between">
            <span>Voice</span>
            <span className="text-slate-400">deferred</span>
          </li>
          <li className="flex justify-between">
            <span>Kali</span>
            <span className="text-slate-400">planned</span>
          </li>
        </ul>

        {err && (
          <div className="mt-3 text-xs text-red-300 break-words">{err}</div>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          <Link to="/chat" className="btn-primary text-xs">
            Open Agent
          </Link>
          <Link to="/settings" className="btn text-xs">
            Settings
          </Link>
        </div>
      </div>

      <div className="md:col-span-3 card">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm tracking-widest text-slate-400">
            AUDIT FEED
          </h3>
          <button
            type="button"
            className="btn text-xs"
            onClick={() =>
              t.push({
                message: "Dashboard poll every 5s",
                variant: "info",
                title: "Holly",
              })
            }
          >
            Test toast
          </button>
        </div>

        {!authed && (
          <p className="text-sm text-slate-400">
            Přihlas se PIN na stránce{" "}
            <Link className="text-holly-neon-green underline" to="/chat">
              Agent
            </Link>
            , audit log je chráněný session.
          </p>
        )}

        {authed && audit.length === 0 && (
          <p className="text-sm text-slate-400">Zatím žádné události.</p>
        )}

        {authed && audit.length > 0 && (
          <div className="space-y-2 max-h-80 overflow-auto">
            {audit.map((e) => (
              <div
                key={e.id}
                className="rounded-xl border border-slate-800/60 p-3 bg-holly-mut/60 text-sm"
              >
                <div className="flex justify-between gap-2 flex-wrap">
                  <span className="font-mono text-holly-neon-green">
                    {e.event}
                  </span>
                  <span className="text-xs text-slate-500">{fmtTs(e.ts)}</span>
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  user: {e.user_id ?? "—"}
                  {e.meta && Object.keys(e.meta).length > 0 && (
                    <span className="ml-2 font-mono break-all">
                      {JSON.stringify(e.meta).slice(0, 160)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
