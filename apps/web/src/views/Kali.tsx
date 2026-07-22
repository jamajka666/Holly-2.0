import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  authSession,
  getToken,
  kaliAbort,
  kaliPing,
  kaliRun,
  kaliStatus,
  type KaliStatus,
} from "../api/api";

export default function Kali() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [status, setStatus] = useState<KaliStatus | null>(null);
  const [ping, setPing] = useState<{
    reachable?: boolean;
    latencyMs?: number;
    error?: string;
  } | null>(null);
  const [profile, setProfile] = useState("sysinfo");
  const [argHost, setArgHost] = useState("127.0.0.1");
  const [output, setOutput] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [pendingConfirm, setPendingConfirm] = useState(false);

  const refresh = useCallback(async () => {
    if (!getToken()) {
      setAuthed(false);
      return;
    }
    const sess = await authSession();
    setAuthed(sess.authenticated);
    if (!sess.authenticated) return;
    const st = await kaliStatus();
    setStatus(st);
    if (st.profiles?.length && !st.profiles.find((p) => p.id === profile)) {
      setProfile(st.profiles[0]!.id);
    }
  }, [profile]);

  useEffect(() => {
    refresh().catch((e) => setErr(String(e)));
  }, [refresh]);

  async function doPing() {
    setErr("");
    setBusy(true);
    try {
      const r = await kaliPing();
      setPing(r);
    } catch (e) {
      setErr(String(e));
    } finally {
      setBusy(false);
    }
  }

  function selectedMeta() {
    return status?.profiles?.find((p) => p.id === profile);
  }

  function buildArgs(): Record<string, string> {
    const meta = selectedMeta();
    const args: Record<string, string> = {};
    if (!meta) return args;
    for (const a of meta.args) {
      if (a.name === "host" || a.name === "target") {
        args[a.name] = argHost.trim();
      }
    }
    return args;
  }

  async function run(confirm = false) {
    setErr("");
    setBusy(true);
    setOutput("");
    try {
      const meta = selectedMeta();
      if (meta?.needsConfirm && !confirm) {
        setPendingConfirm(true);
        setOutput(
          `Profil **${profile}** vyžaduje potvrzení (risk: ${meta.risk}). Stiskni Potvrdit.`,
        );
        setBusy(false);
        return;
      }
      const r = await kaliRun(profile, buildArgs(), confirm);
      if (!r.ok && r.needsConfirm) {
        setPendingConfirm(true);
        setOutput(r.error || "needs confirm");
      } else if (!r.ok) {
        setPendingConfirm(false);
        setErr(r.error || "run failed");
        setOutput(JSON.stringify(r, null, 2));
      } else {
        setPendingConfirm(false);
        setOutput(
          [
            `profile: ${r.profile}`,
            `code: ${r.code} · ${r.durationMs}ms`,
            r.timedOut ? "TIMED OUT" : "",
            r.aborted ? "ABORTED" : "",
            "--- stdout ---",
            r.stdout || "(empty)",
            r.stderr ? "--- stderr ---\n" + r.stderr : "",
          ]
            .filter(Boolean)
            .join("\n"),
        );
        await refresh();
      }
    } catch (e) {
      setErr(String(e));
    } finally {
      setBusy(false);
    }
  }

  async function abortAll() {
    setBusy(true);
    try {
      const r = await kaliAbort();
      setOutput(`Kill-switch: killed ${r.killed?.join(", ") || "(none)"}`);
      await refresh();
    } catch (e) {
      setErr(String(e));
    } finally {
      setBusy(false);
    }
  }

  if (authed === null) {
    return <div className="text-sm text-slate-400 p-4">Kontrola session…</div>;
  }

  if (!authed) {
    return (
      <div className="card max-w-lg p-6 space-y-3">
        <h1 className="text-lg tracking-widest glow">
          KALI <span className="text-holly-neon-green">BRIDGE</span>
        </h1>
        <p className="text-sm text-slate-400">
          Kali endpointy vyžadují owner session.
        </p>
        <Link to="/chat" className="btn-primary text-xs inline-block">
          PIN login (Agent)
        </Link>
      </div>
    );
  }

  const meta = selectedMeta();
  const needsHost =
    meta?.args?.some((a) => a.name === "host" || a.name === "target") ?? false;

  return (
    <div className="grid gap-4 max-w-5xl">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-lg tracking-widest glow">
          KALI <span className="text-holly-neon-green">BRIDGE</span>
        </h1>
        <div className="text-xs text-slate-400">
          free shell:{" "}
          <span className="text-holly-neon-green">disabled</span>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="card space-y-2 text-sm">
          <h3 className="text-xs tracking-widest text-slate-400">STATUS</h3>
          <div className="flex justify-between">
            <span>Configured</span>
            <span
              className={
                status?.configured
                  ? "text-holly-neon-green"
                  : "text-amber-300"
              }
            >
              {status ? String(status.configured) : "…"}
            </span>
          </div>
          <div className="flex justify-between gap-2">
            <span>Target</span>
            <span className="font-mono text-xs truncate">
              {status?.user}@{status?.host || "—"}:{status?.port}
            </span>
          </div>
          <div className="flex justify-between">
            <span>SSH key</span>
            <span
              className={
                status?.keyExists ? "text-holly-neon-green" : "text-red-400"
              }
            >
              {status?.keyExists ? "found" : "missing"}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Reachable</span>
            <span
              className={
                ping?.reachable
                  ? "text-holly-neon-green"
                  : ping
                    ? "text-red-400"
                    : "text-slate-400"
              }
            >
              {ping
                ? ping.reachable
                  ? `yes (${ping.latencyMs}ms)`
                  : ping.error || "no"
                : "—"}
            </span>
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            <button
              type="button"
              className="btn-primary text-xs"
              disabled={busy}
              onClick={() => void doPing()}
            >
              SSH ping
            </button>
            <button
              type="button"
              className="btn text-xs"
              disabled={busy}
              onClick={() => void refresh()}
            >
              Refresh
            </button>
            <button
              type="button"
              className="btn text-xs border-red-500/40 text-red-300"
              disabled={busy}
              onClick={() => void abortAll()}
            >
              Kill all jobs
            </button>
          </div>
          {!status?.configured && (
            <p className="text-xs text-amber-200/80 pt-2">
              Nastav <code>KALI_SSH_HOST</code> v <code>apps/server/.env</code> — viz{" "}
              <code>docs/KALI.md</code>.
            </p>
          )}
          {status?.identityFile && (
            <p className="text-[10px] text-slate-500 font-mono break-all">
              key: {status.identityFile}
            </p>
          )}
        </div>

        <div className="card space-y-3 text-sm">
          <h3 className="text-xs tracking-widest text-slate-400">RUN PROFILE</h3>
          <label className="block space-y-1">
            <span className="text-xs text-slate-500">Profile</span>
            <select
              className="w-full px-3 py-2 rounded-xl bg-[color:var(--mut)] border border-slate-800/60"
              value={profile}
              onChange={(e) => {
                setProfile(e.target.value);
                setPendingConfirm(false);
              }}
            >
              {(status?.profiles || []).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.id} · {p.risk}
                  {p.needsConfirm ? " · confirm" : ""}
                </option>
              ))}
            </select>
          </label>
          {meta && (
            <p className="text-xs text-slate-400">{meta.description}</p>
          )}
          {needsHost && (
            <label className="block space-y-1">
              <span className="text-xs text-slate-500">host / target</span>
              <input
                className="w-full px-3 py-2 rounded-xl bg-holly-panel border border-slate-700/60 text-sm font-mono"
                value={argHost}
                onChange={(e) => setArgHost(e.target.value)}
                placeholder="127.0.0.1 or 192.168.1.0/24"
              />
            </label>
          )}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="btn-primary text-xs"
              disabled={busy || !status?.configured}
              onClick={() => void run(false)}
            >
              Run
            </button>
            {pendingConfirm && (
              <button
                type="button"
                className="btn-primary text-xs bg-amber-600/30 border-amber-400/50"
                disabled={busy}
                onClick={() => void run(true)}
              >
                Potvrdit
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="text-xs tracking-widest text-slate-400 mb-2">OUTPUT</h3>
        {err && <p className="text-xs text-red-300 mb-2">{err}</p>}
        <pre className="text-xs font-mono whitespace-pre-wrap max-h-96 overflow-auto text-slate-300">
          {output || (busy ? "…" : "—")}
        </pre>
      </div>

      {status?.recent && status.recent.length > 0 && (
        <div className="card">
          <h3 className="text-xs tracking-widest text-slate-400 mb-2">
            RECENT (in-memory)
          </h3>
          <pre className="text-[10px] font-mono overflow-auto max-h-40 text-slate-500">
            {JSON.stringify(status.recent, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
