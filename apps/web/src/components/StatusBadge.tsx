export function StatusBadge({state}:{state:"online"|"offline"|"error"}) {
  const map = {
    online: { txt:"ONLINE", cls:"text-holly-neon-green border-holly-neon-green/40 shadow-neon-green" },
    offline: { txt:"OFFLINE", cls:"text-slate-400 border-slate-600/60" },
    error: { txt:"ALERT", cls:"text-holly-neon-red border-holly-neon-red/40 shadow-neon-red" },
  } as const;
  const s = map[state];
  return <span className={`px-2 py-1 rounded-lg border text-xs ${s.cls}`}>{s.txt}</span>;
}
