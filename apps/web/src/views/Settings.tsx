import { getProfiles, applyProfile, bootTheme } from "../theme/tokens";
import { useEffect, useState } from "react";

export default function Settings(){
  const [profile, setProfile] = useState<string>("holly");
  useEffect(()=>{ setProfile(bootTheme()); },[]);
  const profiles = getProfiles();
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="card">
        <h3 className="text-sm tracking-widest text-slate-400">APPEARANCE</h3>
        <div className="mt-3 space-y-2">
          <label className="flex items-center gap-3">
            <span>Theme profile</span>
            <select
              value={profile}
              onChange={(e)=>{ setProfile(e.target.value); applyProfile(e.target.value as any); }}
              className="px-3 py-2 rounded-xl bg-[color:var(--mut)] border border-slate-800/60"
            >
              {profiles.map(p=><option key={p.id} value={p.id}>{p.label}</option>)}
            </select>
          </label>
          <label className="flex items-center gap-3">
            <input type="checkbox" defaultChecked className="accent-[color:var(--neon-2)]" />
            Neon accents
          </label>
          <label className="flex items-center gap-3">
            <input type="checkbox" defaultChecked className="accent-[color:var(--neon-2)]" />
            Scanlines
          </label>
        </div>
      </div>
      <div className="card">
        <h3 className="text-sm tracking-widest text-slate-400">VOICE</h3>
        <div className="mt-3">
          <button className="btn-primary">Calibrate voice (placeholder)</button>
        </div>
      </div>
    </div>
  );
}
