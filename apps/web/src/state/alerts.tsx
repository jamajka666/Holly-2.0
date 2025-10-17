import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

export type Alert = { id:string; level:"info"|"warning"|"error"; message:string; ts:number; };
type Ctx = {
  items: Alert[];
  unread: number;
  push: (a:Alert)=>void;
  markAllRead: ()=>void;
  clear: ()=>void;
};
const AlertsCtx = createContext<Ctx|null>(null);
const LS_KEY = "holly.alerts.v2";

export function AlertsProvider({children}:{children:React.ReactNode}){
  const [items, setItems] = useState<Alert[]>(()=>{
    try { return JSON.parse(localStorage.getItem(LS_KEY)||"[]"); } catch { return []; }
  });
  const [unread, setUnread] = useState<number>(()=>{
    try { const saved = JSON.parse(localStorage.getItem(LS_KEY)||"[]"); return Array.isArray(saved) ? saved.length : 0; } catch { return 0; }
  });

  useEffect(()=>{ try {
    const capped = items.slice(0, 500);
    localStorage.setItem(LS_KEY, JSON.stringify(capped));
  } catch{} },[items]);

  const push = (a:Alert)=>{ setItems(prev => [a, ...prev].slice(0,500)); setUnread(u=>u+1); };
  const markAllRead = ()=> setUnread(0);
  const clear = ()=> { setItems([]); setUnread(0); };

  const value = useMemo(()=>({items, unread, push, markAllRead, clear}),[items, unread]);
  return <AlertsCtx.Provider value={value}>{children}</AlertsCtx.Provider>;
}
export function useAlerts(){
  const ctx = useContext(AlertsCtx);
  if(!ctx) throw new Error("useAlerts must be used inside AlertsProvider");
  return ctx;
}
