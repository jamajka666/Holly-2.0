import { useState } from "react";
import { useToast } from "../lib/toast";
import { apiDevicePair, apiDeviceUnpair, apiDeviceReboot, apiPingDevice } from "../lib/api";
import { useVoiceRouter } from "../voice/router";

type Device = { id:string; name:string; kind:string; state:"online"|"offline"; paired?:boolean };

export default function DeviceDetail({ device, onChanged }:{ device:Device; onChanged:(d:Partial<Device>)=>void }) {
  const { push: toast } = useToast();
  const { handle } = useVoiceRouter();
  const [busy, setBusy] = useState(false);

  async function act(kind:"ping"|"reboot"|"pair"|"unpair"){
    setBusy(true);
    try{
      if (kind==="ping") { await apiPingDevice(device.id); toast({message:"Ping sent", variant:"success"}); }
      if (kind==="reboot") { await apiDeviceReboot(device.id); toast({message:"Reboot requested", variant:"warning"}); }
      if (kind==="pair") { await apiDevicePair(device.id); toast({message:"Paired", variant:"success"}); onChanged({paired:true}); }
      if (kind==="unpair") { await apiDeviceUnpair(device.id); toast({message:"Unpaired", variant:"info"}); onChanged({paired:false}); }
    } catch(e:any){
      toast({message:`Action failed: ${e?.message||"unknown"}`, variant:"error"});
    } finally { setBusy(false); }
  }

  return (
    <div className="space-y-4">
      <section className="card">
        <div className="text-sm text-slate-400">Device</div>
        <div className="text-xl glow">{device.name}</div>
        <div className="text-sm opacity-70">{device.kind} · {device.state} · {device.paired ? "paired":"not paired"}</div>
      </section>

      <section className="card">
        <div className="text-sm text-slate-400 mb-2">Quick actions</div>
        <div className="flex flex-wrap gap-2">
          <button className="btn" disabled={busy} onClick={()=>act("ping")}>Ping</button>
          <button className="btn" disabled={busy} onClick={()=>act("reboot")}>Reboot</button>
          {device.paired
            ? <button className="btn" disabled={busy} onClick={()=>act("unpair")}>Unpair</button>
            : <button className="btn" disabled={busy} onClick={()=>act("pair")}>Pair</button>}
          <button className="btn" onClick={()=>handle(`ping device ${device.name}`)}>Speak: Ping this device</button>
        </div>
      </section>

      <section className="card">
        <div className="text-sm text-slate-400 mb-2">Recent metrics</div>
        <ul className="space-y-1 text-sm">
          <li>CPU: 11–17%</li>
          <li>RAM: 38%</li>
          <li>Temp: 41°C</li>
          <li>Last ping: ~3s</li>
        </ul>
      </section>

      <section className="card">
        <div className="text-sm text-slate-400 mb-2">Notes</div>
        <textarea className="w-full px-3 py-2 rounded-xl bg-[color:var(--mut)] border border-slate-800/60" rows={4} placeholder="Internal notes (local only)…"/>
      </section>
    </div>
  );
}
