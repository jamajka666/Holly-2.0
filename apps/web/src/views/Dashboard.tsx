import StatTile from "../components/StatTile";
import { StatusBadge } from "../components/StatusBadge";
import { useToast } from "../lib/toast";

export default function Dashboard(){
  const t = useToast();
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <div className="md:col-span-2 grid gap-4 md:grid-cols-2">
        <StatTile label="Alerts (24h)" value="3" hint="1 critical, 2 info" />
        <StatTile label="Devices" value="5" hint="3 online, 2 offline" />
        <StatTile label="Latency" value="42 ms" hint="avg API RTT" />
        <StatTile label="Auth failures" value="0" hint="since last login" />
      </div>
      <div className="card">
        <div className="flex items-center justify-between">
          <h3 className="text-sm tracking-widest text-slate-400">SYSTEM</h3>
          <StatusBadge state="online" />
        </div>
        <ul className="mt-3 text-sm space-y-2">
          <li className="flex justify-between"><span>API</span><span className="text-holly-neon-green">OK</span></li>
          <li className="flex justify-between"><span>Worker</span><span className="text-holly-neon-green">OK</span></li>
          <li className="flex justify-between"><span>Voice</span><span className="text-slate-300">Idle</span></li>
        </ul>
      </div>
      <div className="md:col-span-3 card">
        <h3 className="text-sm tracking-widest text-slate-400 mb-2">RECENT ACTIVITY</h3>
        <div className="grid md:grid-cols-3 gap-3">
          { ["Login accepted","Device BV5300 paired","Vault unlocked"].map((s,i)=>(
            <div key={i} className="rounded-xl border border-slate-800/60 p-3 bg-holly-mut/60">{s}</div>
          )) }
          <div>
            <button className="btn-primary mt-3" onClick={()=>t.push({message:"Test toast", variant:"success", title:"Test"})}>Test toast</button>
          </div>
        </div>
      </div>
    </div>
  );
}
