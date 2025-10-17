import { useEffect, useState } from "react";

const COMMANDS = [
  { id: "open-settings", label: "Open Settings", action: ()=>window.location.assign("/settings") },
  { id: "open-devices", label: "Open Devices", action: ()=>window.location.assign("/devices") },
];

export default function CommandPalette(){
  const [open, setOpen] = useState(false);
  useEffect(()=>{
    const onKey = (e: KeyboardEvent)=>{
      if((e.ctrlKey || e.metaKey) && e.key.toLowerCase()==="k"){ e.preventDefault(); setOpen(v=>!v); }
    };
    window.addEventListener("keydown", onKey);
    return ()=> window.removeEventListener("keydown", onKey);
  },[]);
  return (
    <>
      <input
        aria-label="Command palette"
        onFocus={()=>setOpen(true)}
        onBlur={()=>setTimeout(()=>setOpen(false),150)}
        placeholder="⌘/Ctrl+K  Search commands…"
        className="px-4 py-2 rounded-xl bg-holly-mut border border-slate-800/60 w-[320px] max-w-[52vw]"
      />
      {open && (
        <div className="absolute z-50 mt-2 w-[420px] max-w-[90vw] bg-holly-panel border border-slate-800/60 rounded-2xl p-2 shadow-neon-cyan">
          {COMMANDS.map(c=>(
            <button key={c.id} onMouseDown={(e)=>{e.preventDefault(); c.action();}}
              className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-800/50">
              {c.label}
            </button>
          ))}
        </div>
      )}
    </>
  )
}
