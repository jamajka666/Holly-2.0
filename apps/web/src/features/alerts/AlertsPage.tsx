import React, { useEffect, useRef, useState } from "react";
import { listAlerts, createAlert, deleteAlert, updateAlert, pushSubscribe, apiUrl, VAPID_PUBLIC } from "../../lib/api";
import CronHelp from "../../components/CronHelp";

const CRON_PRESETS = [
  { label: "@minutely (každou minutu)", value: "@minutely" },
  { label: "@every5m (každých 5 min)", value: "@every5m" },
  { label: "@every15m (každých 15 min)", value: "@every15m" },
  { label: "@hourly (každou hodinu, v X:00)", value: "@hourly" },
  { label: "@daily (každý den 00:00)", value: "@daily" },
  { label: "@weekly (každé pondělí 00:00)", value: "@weekly" },
  { label: "@monthly (1. den v měsíci 00:00)", value: "@monthly" },
  { label: "@yearly (1.1. 00:00)", value: "@yearly" },
];

type Alert = {
  id: number;
  title: string;
  message: string;
  cron: string | null;
  at: string | null;
  active: boolean;
};

export default function AlertsPage() {
  console.log("[M3.7] AlertsPage mount");

  const [items, setItems] = useState<Alert[]>([]);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [mode, setMode] = useState<"once" | "cron">("once");
  const [at, setAt] = useState("");
  const [cron, setCron] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [sseOn, setSseOn] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const esRef = useRef<EventSource | null>(null);

  async function refresh() {
    try { setItems(await listAlerts()); }
    catch (e: any) { setErr(e?.message || String(e)); }
  }

  async function checkPush() {
    try {
      if (!("serviceWorker" in navigator)) return;
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      setSubscribed(!!sub);
    } catch {}
  }

  useEffect(() => {
    refresh(); checkPush();
    const onFocus = () => { checkPush(); };
    const onVis = () => { if (document.visibilityState === "visible") checkPush(); };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVis);
      esRef.current?.close();
    };
  }, []);

  // ✅ SSE: parsuj jen event 'alert' (JSON). 'hello' a 'ping' ignoruj.
  useEffect(() => {
    if (subscribed) { // když běží Push, SSE fallback vypneme
      if (esRef.current) { esRef.current.close(); esRef.current = null; }
      setSseOn(false);
      return;
    }
    const es = new EventSource(apiUrl("/alerts/stream"));
    esRef.current = es;

    es.onopen = () => setSseOn(true);
    es.onerror = () => setSseOn(false);

    const onAlert = (ev: MessageEvent) => {
      try {
        const data = JSON.parse(ev.data || "{}");
        const title = data?.title || "Alert";
        const body = data?.message || "";
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification(title, { body });
        } else {
          setErr(`SSE: ${title} – ${body}`);
          setTimeout(() => setErr(null), 4000);
        }
      } catch {
        // špatný payload – ignoruj (žádné console.error)
      }
    };
    const onHello = (_ev: MessageEvent) => { /* ignore */ };
    const onPing  = (_ev: MessageEvent) => { /* ignore */ };

    es.addEventListener("alert", onAlert);
    es.addEventListener("hello", onHello);
    es.addEventListener("ping", onPing);

    return () => {
      es.removeEventListener("alert", onAlert);
      es.removeEventListener("hello", onHello);
      es.removeEventListener("ping", onPing);
      es.close();
      setSseOn(false);
    };
  }, [subscribed]);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    try {
      const payload: any = { title, message };
      if (mode === "once") payload.at = at || null; else payload.cron = cron || null;
      const created = await createAlert(payload);
      setTitle(""); setMessage(""); setAt(""); setCron(""); setMode("once");
      setItems([created, ...items]);
    } catch (e: any) {
      setErr(e?.message || String(e));
    }
  }

  async function onDelete(id: number) {
    setErr(null);
    try { await deleteAlert(id); setItems(items.filter(i => i.id !== id)); }
    catch (e: any) { setErr(e?.message || String(e)); }
  }

  async function toggleActive(a: Alert) {
    setErr(null);
    try { const updated = await updateAlert(a.id, { active: !a.active }); setItems(items.map(i => i.id === a.id ? updated : i)); }
    catch (e: any) { setErr(e?.message || String(e)); }
  }

  async function ensurePush() {
    setErr(null);
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") { setErr("Oznámení nepovolena (Notifications)."); return; }
      await pushSubscribe(VAPID_PUBLIC);
      await checkPush();
    } catch (e: any) { setErr(e?.message || String(e)); }
  }

  async function unsubscribePush() {
    setErr(null);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) await sub.unsubscribe();
      await checkPush();
    } catch (e: any) { setErr(e?.message || String(e)); }
  }

  return (
    <div className="min-h-dvh bg-gradient-to-b from-black via-slate-950 to-black">
      <div className="p-6 max-w-3xl mx-auto text-zinc-100">
        <h1 className="text-2xl font-bold mb-4">⚡ Alerts Engine (M3.7)</h1>

        <div className="mb-3 flex gap-2 items-center flex-wrap">
          {!subscribed ? (
            <button onClick={ensurePush} className="px-3 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-900/30">
              Povolit Push notifikace
            </button>
          ) : (
            <>
              <span className="px-3 py-2 rounded-2xl bg-emerald-800/60 shadow-inner">Push aktivní</span>
              <button onClick={unsubscribePush} className="px-3 py-2 rounded-2xl bg-rose-700 hover:bg-rose-600">Odhlásit Push</button>
            </>
          )}
          {sseOn && <span className="px-3 py-2 rounded-2xl bg-fuchsia-700/60 shadow-inner">SSE aktivní</span>}
          <button onClick={refresh} className="px-3 py-2 rounded-2xl bg-slate-800 hover:bg-slate-700">Obnovit</button>
        </div>

        {err && <div className="mb-3 rounded-xl border border-red-800 bg-red-900/30 p-3 text-sm">{err}</div>}

        <form onSubmit={onCreate} className="grid gap-3 bg-slate-900/60 p-4 rounded-2xl border border-emerald-700/30 shadow-xl shadow-emerald-900/10">
          <div className="grid gap-1">
            <label className="text-sm text-zinc-400">Název</label>
            <input value={title} onChange={(e)=>setTitle(e.target.value)} required className="bg-black/40 rounded p-2 outline-none" />
          </div>
          <div className="grid gap-1">
            <label className="text-sm text-zinc-400">Zpráva</label>
            <input value={message} onChange={(e)=>setMessage(e.target.value)} required className="bg-black/40 rounded p-2 outline-none" />
          </div>

          <div className="flex gap-4 items-center">
            <label className="flex items-center gap-2">
              <input type="radio" checked={mode==="once"} onChange={()=>setMode("once")} />
              Jednorázový
            </label>
            <label className="flex items-center gap-2">
              <input type="radio" checked={mode==="cron"} onChange={()=>setMode("cron")} />
              Opakovaný (CRON)
            </label>
          </div>

          {mode === "once" ? (
            <div className="grid gap-1">
              <label className="text-sm text-zinc-400">Čas (local)</label>
              <input type="datetime-local" value={at} onChange={(e)=>setAt(e.target.value)} required className="bg-black/40 rounded p-2 outline-none" />
            </div>
          ) : (
            <div className="grid gap-3">
              <div className="grid gap-1">
                <label className="text-sm text-zinc-400">CRON výraz</label>
                <input placeholder="např. */5 * * * * nebo @every5m"
                       value={cron} onChange={(e)=>setCron(e.target.value)} required
                       className="bg-black/40 rounded p-2 outline-none" />
              </div>
              <div className="flex gap-2 items-center">
                <select className="bg-black/40 rounded p-2"
                        onChange={(e)=>{ if(e.target.value){ setCron(e.target.value); e.currentTarget.selectedIndex = 0; } }}>
                  <option value="">➕ vybrat preset…</option>
                  {CRON_PRESETS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
                <span className="text-xs text-zinc-500">Server kontroluje výraz i presety.</span>
              </div>
              <CronHelp />
            </div>
          )}

          <button type="submit" className="mt-2 px-4 py-2 rounded-2xl bg-red-700 hover:bg-red-600 shadow-lg shadow-red-900/20">+ Přidat alert</button>
        </form>

        <div className="mt-6 grid gap-2">
          {items.map(a => (
            <div key={a.id} className="flex items-center justify-between bg-slate-900/50 border border-zinc-700/40 rounded-2xl p-3">
              <div>
                <div className="font-semibold">{a.title} {!a.active && <span className="text-xs text-zinc-400">(neaktivní)</span>}</div>
                <div className="text-sm text-zinc-400">{a.message}</div>
                <div className="text-xs text-zinc-500">
                  {a.cron ? <>CRON: <code>{a.cron}</code></> : a.at ? <>Kdy: {a.at}</> : null}
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={()=>toggleActive(a)} className="px-3 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600">{a.active ? "Deaktivovat" : "Aktivovat"}</button>
                <button onClick={()=>onDelete(a.id)} className="px-3 py-2 rounded-xl bg-zinc-700 hover:bg-zinc-600">Smazat</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
