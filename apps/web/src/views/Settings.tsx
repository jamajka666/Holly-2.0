import { getProfiles, applyProfile, bootTheme } from "../theme/tokens";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  authSession,
  desktopNotify,
  desktopOpenUrl,
  getPolicyStatus,
  getToken,
  type PolicyStatus,
} from "../api/api";

export default function Settings() {
  const [profile, setProfile] = useState<string>("holly");
  const [policy, setPolicy] = useState<PolicyStatus | null>(null);
  const [authed, setAuthed] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    setProfile(bootTheme());
    getPolicyStatus()
      .then(setPolicy)
      .catch((e) => setErr(String(e)));
    if (getToken()) {
      authSession()
        .then((s) => setAuthed(s.authenticated))
        .catch(() => setAuthed(false));
    }
  }, []);

  const profiles = getProfiles();

  async function testNotify() {
    setMsg("");
    setErr("");
    try {
      const r = await desktopNotify("Holly 2.0", "Test notifikace z Settings");
      setMsg(r.ok ? "notify-send OK" : `notify: ${r.error}`);
    } catch (e) {
      setErr(String(e));
    }
  }

  async function testOpen() {
    setMsg("");
    setErr("");
    try {
      const r = await desktopOpenUrl("https://github.com/jamajka666/Holly-2.0");
      setMsg(r.ok ? "xdg-open OK" : `open: ${r.error}`);
    } catch (e) {
      setErr(String(e));
    }
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="card">
        <h3 className="text-sm tracking-widest text-slate-400">APPEARANCE</h3>
        <div className="mt-3 space-y-2">
          <label className="flex items-center gap-3 flex-wrap">
            <span>Theme profile</span>
            <select
              value={profile}
              onChange={(e) => {
                setProfile(e.target.value);
                applyProfile(e.target.value as "holly" | "shadowguard");
              }}
              className="px-3 py-2 rounded-xl bg-[color:var(--mut)] border border-slate-800/60"
            >
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="card">
        <h3 className="text-sm tracking-widest text-slate-400">SECURITY</h3>
        <ul className="mt-3 text-sm space-y-2">
          <li className="flex justify-between gap-2">
            <span>Session</span>
            <span className={authed ? "text-holly-neon-green" : "text-slate-400"}>
              {authed ? "owner active" : "none"}
            </span>
          </li>
          <li className="text-xs text-slate-400">
            {policy?.pin?.note ??
              "PIN se nastavuje přes OWNER_PIN v .env a restart Core."}
          </li>
          <li className="text-xs text-slate-400">
            Voice: {policy?.voice?.status ?? "deferred"} (čeká na mikrofon)
          </li>
          <li className="text-xs text-slate-400">
            Kali: {policy?.kali?.status ?? "planned"} ({policy?.kali?.mode})
          </li>
        </ul>
        <Link to="/chat" className="btn-primary text-xs mt-3 inline-block">
          {authed ? "Agent chat" : "PIN login (Agent)"}
        </Link>
      </div>

      <div className="card">
        <h3 className="text-sm tracking-widest text-slate-400">POLICY / TOOLS</h3>
        {!policy && <p className="mt-3 text-sm text-slate-400">Načítám…</p>}
        {policy && (
          <div className="mt-3 text-sm space-y-2">
            <p className="text-xs text-slate-400">{policy.note}</p>
            <div>
              <div className="text-xs tracking-widest text-slate-500 mb-1">
                SHELL ALLOWLIST
              </div>
              <div className="font-mono text-xs text-holly-neon-green break-all">
                {policy.shellAllowlist.join(", ")}
              </div>
            </div>
            {policy.workspaceRoots && (
              <div>
                <div className="text-xs tracking-widest text-slate-500 mb-1">
                  WORKSPACE
                </div>
                <div className="font-mono text-xs break-all">
                  {policy.workspaceRoots.join(", ")}
                </div>
              </div>
            )}
            {policy.desktop && (
              <div className="text-xs text-slate-400">
                Desktop: open={String(policy.desktop.openUrl)} notify=
                {String(policy.desktop.notify)} clipboard=
                {String(policy.desktop.clipboard)}
              </div>
            )}
            {policy.confirmRequired && (
              <div className="text-xs text-amber-200/80">
                Confirm: {policy.confirmRequired.join(" · ")}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="card">
        <h3 className="text-sm tracking-widest text-slate-400">PC CONTROL (M3)</h3>
        <p className="mt-2 text-xs text-slate-400">
          Vyžaduje owner session (přihlášení na Agent).
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            className="btn-primary text-xs"
            disabled={!authed}
            onClick={() => void testNotify()}
          >
            Test notify
          </button>
          <button
            type="button"
            className="btn text-xs"
            disabled={!authed}
            onClick={() => void testOpen()}
          >
            Open repo URL
          </button>
        </div>
        {msg && <p className="mt-2 text-xs text-holly-neon-green">{msg}</p>}
        {err && <p className="mt-2 text-xs text-red-300">{err}</p>}
        <p className="mt-3 text-xs text-slate-500">
          Z chatu: <code>notify Title | body</code>,{" "}
          <code>open https://…</code>, <code>clipboard get/set</code>
        </p>
      </div>
    </div>
  );
}
