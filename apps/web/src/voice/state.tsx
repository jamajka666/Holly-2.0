import React, { createContext, useContext, useMemo, useState } from "react";

export type VoiceLogItem = {
  id: string;
  when: number;
  kind: "heard" | "intent" | "result" | "error";
  text: string;
  meta?: Record<string, any>;
};

type Suggestion = { id: string; label: string; hint?: string; utterance: string };

type Ctx = {
  listening: boolean; setListening: (v:boolean)=>void;
  interim: string; setInterim: (t:string)=>void;
  logs: VoiceLogItem[]; pushLog: (i:Omit<VoiceLogItem,"id"|"when">)=>void; clearLogs: ()=>void;
  getSuggestions: ()=>Suggestion[];
};

const VoiceCtx = createContext<Ctx|null>(null);

export function VoiceProvider({children}:{children:React.ReactNode}){
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [logs, setLogs] = useState<VoiceLogItem[]>([]);

  const pushLog: Ctx["pushLog"] = (i)=> {
    const item: VoiceLogItem = { id: crypto.randomUUID(), when: Date.now(), ...i };
    setLogs(prev => [item, ...prev].slice(0, 200));
  };
  const clearLogs = ()=> setLogs([]);

  // Kontextové návrhy: vycházejí z route + známých entit (devices)
  function getSuggestions(): Suggestion[] {
    const path = location.pathname;
    const out: Suggestion[] = [
      { id:"open-settings", label:"Otevřít Nastavení", utterance:"open settings" },
      { id:"open-devices", label:"Otevřít Zařízení", utterance:"open devices" },
      { id:"status", label:"Status systému", utterance:"status" },
      { id:"dnd-on", label:"Zapnout DND", utterance:"DND on" },
      { id:"theme-sg", label:"Profil ShadowGuard", utterance:"theme shadowguard" },
    ];
    if (path.startsWith("/devices")) {
      // lehký hint na ping
      out.unshift({ id:"ping-sample", label:"Ping BV5300", hint:"pokud existuje", utterance:"ping device BV5300" });
    }
    return out;
  }

  const value = useMemo(()=>({
    listening, setListening,
    interim, setInterim,
    logs, pushLog, clearLogs,
    getSuggestions
  }),[listening, interim, logs]);

  return <VoiceCtx.Provider value={value}>{children}</VoiceCtx.Provider>;
}

export function useVoice(){
  const ctx = useContext(VoiceCtx);
  if(!ctx) throw new Error("useVoice must be used within VoiceProvider");
  return ctx;
}
