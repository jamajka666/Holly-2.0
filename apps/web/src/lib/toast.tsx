import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

type Toast = {
  id: string;
  title?: string;
  message: string;
  variant?: "info"|"success"|"warning"|"error";
  ttl?: number; // ms
};
type Ctx = {
  push: (t: Omit<Toast,"id">) => void;
  remove: (id: string) => void;
  clear: () => void;
  dnd: boolean; setDnd: (v:boolean)=>void;
};
const ToastCtx = createContext<Ctx|null>(null);

export function ToastProvider({children}:{children:React.ReactNode}) {
  const [items, setItems] = useState<Toast[]>([]);
  const timers = useRef<Record<string, number>>({});
  const [dnd, setDnd] = useState<boolean>(()=>{
    return localStorage.getItem("holly.toast.dnd")==="1";
  });
  useEffect(()=>{ localStorage.setItem("holly.toast.dnd", dnd ? "1" : "0"); }, [dnd]);

  const remove = useCallback((id:string)=>{
    setItems(prev => prev.filter(t => t.id !== id));
    if (timers.current[id]) { clearTimeout(timers.current[id]); delete timers.current[id]; }
  },[]);

  const push = useCallback((t: Omit<Toast,"id">)=>{
  if (dnd) return; // Do-Not-Disturb: skip showing toasts
  const id = Math.random().toString(36).slice(2,9);
    const toast: Toast = { id, ttl: 6000, variant: "info", ...t };
    setItems(prev=>[toast, ...prev].slice(0, 7));
    if (toast.ttl && toast.ttl > 0) {
      timers.current[id] = window.setTimeout(()=> remove(id), toast.ttl);
    }
    // jemný beep (WebAudio)
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.type = "sine"; o.frequency.setValueAtTime(880, ctx.currentTime);
      g.gain.setValueAtTime(0.0001, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.02, ctx.currentTime + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.2);
      o.connect(g).connect(ctx.destination); o.start(); o.stop(ctx.currentTime + 0.22);
    } catch {}
  },[remove]);

  const clear = useCallback(()=> setItems([]), []);

  const value = useMemo(()=>({push, remove, clear, dnd, setDnd}),[push, remove, clear, dnd]);
  return (
    <ToastCtx.Provider value={value}>
      {children}
      <Toaster items={items} remove={remove}/>
    </ToastCtx.Provider>
  );
}

export function useToast(){
  const ctx = useContext(ToastCtx);
  if(!ctx) throw new Error("useToast must be used within <ToastProvider/>");
  return ctx;
}

function Variant({v}:{v:Toast["variant"]}) {
  const map = {
    info: "border-slate-600/60",
    success: "border-holly-neon-green/40 shadow-neon-green",
    warning: "border-orange-400/40",
    error: "border-holly-neon-red/40 shadow-neon-red",
  } as const;
  return <span className={`text-xs px-2 py-0.5 rounded-md border ${map[v||"info"]}`}>{(v||"info").toUpperCase()}</span>;
}

function Toaster({items, remove}:{items:Toast[]; remove:(id:string)=>void}){
  return (
    <div className="fixed right-4 top-16 z-[1000] space-y-2 w-[360px] max-w-[92vw]">
      {items.map(t=>(
        <div key={t.id} className="card p-3 flex items-start gap-3 border border-slate-700/60">
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div className="font-semibold glow">{t.title || "Notification"}</div>
              <Variant v={t.variant}/>
            </div>
            <div className="text-sm mt-1">{t.message}</div>
          </div>
          <button className="btn px-2 py-1" aria-label="Dismiss" onClick={()=>remove(t.id)}>✕</button>
        </div>
      ))}
    </div>
  );
}
