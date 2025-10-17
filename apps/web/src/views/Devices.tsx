import { useEffect, useMemo, useState } from "react";
import { useToast } from "../lib/toast";
import { apiListDevices, apiPingDevice, apiDeviceReboot, apiDevicePair, apiDeviceUnpair } from "../lib/api";
import { StatusBadge } from "../components/StatusBadge";
import Drawer from "../components/Drawer";
import DeviceDetail from "./DeviceDetail";

type Row = { id:string; name:string; kind:string; state:"online"|"offline"; paired?:boolean; selected?:boolean };

export default function Devices(){
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string|null>(null);
  const { push: toast } = useToast();

  async function load(){
    setLoading(true);
    try {
      const list = await apiListDevices();
      setRows(list.map(d => ({...d, paired: true, selected:false })));
    } catch (e:any) {
      toast({message:`Devices error: ${e?.message||"unknown"}`, variant:"error"});
    } finally { setLoading(false); }
  }
  useEffect(()=>{ load(); },[]);

  function updateRow(id:string, patch:Partial<Row>){
    setRows(prev => prev.map(r => r.id===id ? {...r, ...patch} : r));
  }

  const openRow = rows.find(r => r.id===openId) || null;
  const selected = useMemo(()=> rows.filter(r=>r.selected), [rows]);

  async function act(id:string, kind:"ping"|"reboot"|"pair"|"unpair"){
    try{
      if (kind==="ping") { await apiPingDevice(id); toast({message:"Ping sent", variant:"success"}); }
      if (kind==="reboot") { await apiDeviceReboot(id); toast({message:"Reboot requested", variant:"warning"}); }
      if (kind==="pair") { await apiDevicePair(id); toast({message:"Paired", variant:"success"}); updateRow(id, { paired: true }); }
      if (kind==="unpair") { await apiDeviceUnpair(id); toast({message:"Unpaired", variant:"info"}); updateRow(id, { paired: false }); }
    } catch(e:any){
      toast({message:`Action failed: ${e?.message||"unknown"}`, variant:"error"});
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg glow">Connected devices</h2>
        <div className="flex items-center gap-2">
          <div className="text-sm opacity-60">Selected: {selected.length}</div>
          <button className="btn" onClick={load} disabled={loading}>{loading?"Loading…":"Refresh"}</button>
        </div>
      </div>

      <div className="card">
        <table className="w-full text-sm">
          <thead className="text-slate-400">
            <tr><th className="text-left">Name</th><th className="text-left">Type</th><th>Status</th><th>Paired</th><th className="text-right">Actions</th></tr>
          </thead>
          <tbody>
            {rows.map(r=>(
              <tr key={r.id} className="border-t border-slate-800/60">
                <td className="py-2">{r.name}</td>
                <td>{r.kind}</td>
                <td className="text-center"><StatusBadge state={r.state}/></td>
                <td className="text-center">{r.paired ? "Yes" : "No"}</td>
                <td className="text-right">
                  <div className="inline-flex gap-2">
                    <button className="btn" onClick={()=>act(r.id,"ping")}>Ping</button>
                    <button className="btn" onClick={()=>act(r.id,"reboot")}>Reboot</button>
                    {r.paired
                      ? <button className="btn" onClick={()=>act(r.id,"unpair")}>Unpair</button>
                      : <button className="btn" onClick={()=>act(r.id,"pair")}>Pair</button>}
                    <button className="btn" onClick={()=>setOpenId(r.id)}>Details</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Drawer open={!!openRow} onClose={()=>setOpenId(null)} title={openRow?.name}>
        {openRow && <DeviceDetail device={openRow} onChanged={(p)=>{ updateRow(openRow.id, p); }} />}
      </Drawer>
    </div>
  );
}

