import { useEffect, useMemo, useState } from "react";
import StatTile from "../components/StatTile";
import { StatusBadge } from "../components/StatusBadge";
import { useToast } from "../lib/toast";
import { getAlerts, getHealth, getLatencyMs, type AlertItem } from "../api/api";

function countByType(items: AlertItem[]) {
  const c: Record<string, number> = {};
  for (const it of items) c[it.type] = (c[it.type] ?? 0) + 1;
  return c;
}

export default function Dashboard() {
  const t = useToast();

  const [apiOk, setApiOk] = useState<boolean | null>(null);
  const [latency, setLatency] = useState<number | null>(null);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [err, setErr] = useState<string>("");

  const counts = useMemo(() => countByType(alerts), [alerts]);
  const alertsHint = useMemo(() => {
    const crit = counts.CRIT ?? counts.CRITICAL ?? 0;
    const warn = counts.WARN ?? 0;
    const info = counts.INFO ?? 0;
    const parts = [
      crit ? `${crit} critical` : null,
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
        const [health, ms, a] = await Promise.all([
          getHealth(),
          getLatencyMs(),
          getAlerts(),
        ]);
        if (!alive) return;
        setApiOk(!!health.ok);
        setLatency(ms);
        setAlerts(a.items ?? []);
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
          label="Alerts (24h)"
          value={String(alerts.length)}
          hint={alertsHint}
        />
        <StatTile label="Devices" value="5" hint="3 online, 2 offline" />
        <StatTile
          label="Latency"
          value={latency === null ? "…" : `${latency} ms`}
          hint="avg API RTT"
        />
        <StatTile label="Auth failures" value="0" hint="since last login" />
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
            <span>Worker</span>
            <span className="text-holly-neon-green">OK</span>
          </li>
          <li className="flex justify-between">
            <span>Voice</span>
            <span className="text-slate-300">Idle</span>
          </li>
        </ul>

        {err && (
          <div className="mt-3 text-xs text-red-300 break-words">{err}</div>
        )}
      </div>

      <div className="md:col-span-3 card">
        <h3 className="text-sm tracking-widest text-slate-400 mb-2">
          RECENT ACTIVITY
        </h3>
        <div className="grid md:grid-cols-3 gap-3">
          {["Login accepted", "Device BV5300 paired", "Vault unlocked"].map(
            (s, i) => (
              <div
                key={i}
                className="rounded-xl border border-slate-800/60 p-3 bg-holly-mut/60"
              >
                {s}
              </div>
            ),
          )}
          <div>
            <button
              className="btn-primary mt-3"
              onClick={() =>
                t.push({
                  message: "Test toast",
                  variant: "success",
                  title: "Test",
                })
              }
            >
              Test toast
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
