export default function StatTile({label, value, hint}:{label:string; value:string; hint?:string}) {
  return (
    <div className="card">
      <div className="text-sm uppercase tracking-widest text-slate-400">{label}</div>
      <div className="mt-1 text-2xl glow">{value}</div>
      {hint && <div className="text-xs text-slate-500 mt-1">{hint}</div>}
    </div>
  );
}
