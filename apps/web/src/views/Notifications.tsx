import { useMemo, useState } from "react";
import { useAlerts } from "../state/alerts";
import { useToast } from "../lib/toast";

function download(filename:string, content:string, mime="application/json"){ 
  const blob = new Blob([content], {type:mime});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = filename; a.click();
  setTimeout(()=> URL.revokeObjectURL(url), 1000);
}

export default function Notifications(){
  const { items, markAllRead, clear } = useAlerts();
  const [q, setQ] = useState(""); // text filter
  const [level, setLevel] = useState<""|"info"|"warning"|"error">("");
  const { dnd, setDnd } = useToast();

  const filtered = useMemo(()=>{
    return items.filter(a=>{
      if (level && a.level !== level) return false;
      if (q && !(`${a.level} ${a.message}`.toLowerCase().includes(q.toLowerCase()))) return false;
      return true;
    });
  },[items, q, level]);

  const exportJSON = ()=> download("alerts.json", JSON.stringify(filtered, null, 2));
  const exportCSV = ()=>{
    const header = "id,level,ts,message\n";
    const rows = filtered.map(a=>[
      JSON.stringify(a.id), a.level, a.ts, JSON.stringify(a.message)
    ].join(",")).join("\n");
    download("alerts.csv", header + rows, "text/csv");
  };

  return (
    <div className="card">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-3">
        <h2 className="text-lg glow">Notifications</h2>
        <div className="flex flex-wrap items-center gap-2">
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search…" className="px-3 py-2 rounded-xl bg-holly-mut border border-slate-800/60"/>
          <select value={level} onChange={e=>setLevel(e.target.value as any)} className="px-3 py-2 rounded-xl bg-holly-mut border border-slate-800/60">
            <option value="">All</option><option value="info">Info</option><option value="warning">Warning</option><option value="error">Error</option>
          </select>
          <label className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-700/60">
            <input type="checkbox" checked={dnd} onChange={e=>setDnd(e.target.checked)} className="accent-holly-neon-green"/>
            Do Not Disturb
          </label>
          <button className="btn" onClick={exportJSON}>Export JSON</button>
          <button className="btn" onClick={exportCSV}>Export CSV</button>
          <button className="btn" onClick={markAllRead}>Mark all read</button>
          <button className="btn" onClick={clear}>Clear</button>
        </div>
      </div>
      <ul className="space-y-2 text-sm">
        {filtered.slice(0, 200).map(a=> (
          <li key={a.id} className="rounded-xl border border-slate-800/60 p-3 bg-holly-mut/60">
            <div className="flex items-center justify-between gap-2">
              <div className="text-xs opacity-70">{new Date(a.ts).toLocaleString()}</div>
              <div className="font-semibold">{a.level.toUpperCase()}</div>
            </div>
            <div className="mt-2">{a.message}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
 
