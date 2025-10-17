import { Mic } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useVoiceRouter } from "../voice/router";
import VUMeter from "../voice/VUMeter";
import { useVoice } from "../voice/state";

export default function VoiceButton(){
  const [active, setActive] = useState(false);
  const recRef = useRef<any>(null);
  const { handleWithLogs } = useVoiceRouter() as any;
  const { listening, setListening, setInterim, pushLog } = useVoice();

  // Sync panel listening se stavem tlačítka
  useEffect(()=>{ setListening(active); },[active, setListening]);

  // Wake-key: 'v'
  useEffect(()=>{
    const onKey = (e: KeyboardEvent)=>{
      if (e.key.toLowerCase() === "v" && !e.repeat) { e.preventDefault(); setActive(v=>!v); }
    };
    window.addEventListener("keydown", onKey);
    return ()=> window.removeEventListener("keydown", onKey);
  },[]);

  useEffect(()=>{
    if(!active) { try{ setInterim(""); recRef.current?.stop?.(); }catch{} ; return; }
    // permission check
    navigator.permissions?.query({ name: "microphone" as PermissionName }).then((p:any)=>{
      if (p?.state === "denied") {
        pushLog({ kind:"error", text:"Microphone permission denied" });
      }
    }).catch(()=>{ /* ignore */ });
    const SR = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (SR) {
      const rec = new SR();
      rec.lang = "cs-CZ"; rec.continuous = true; rec.interimResults = true;

      rec.onresult = (e:any) => {
        const res = e.results[e.results.length-1];
        const text = res?.[0]?.transcript || "";
        if (!text) return;
        if (!res.isFinal) {
          setInterim(text);
          pushLog({ kind:"heard", text });
          return;
        }
        setInterim("");
        handleWithLogs(text); // router zaloguje intent/result
      };
      rec.onend = ()=> setActive(false);
      rec.onerror = (ev:any)=> { pushLog({ kind:"error", text: String(ev?.error || "speech error") }); setActive(false); };
      recRef.current = rec; rec.start();
    } else {
      const text = window.prompt("Řekni příkaz:");
      if (text) handleWithLogs(text);
      setActive(false);
    }
    return ()=> { try { recRef.current?.stop?.(); } catch {} };
  },[active, handleWithLogs, pushLog, setInterim]);

  return (
    <div className="flex items-center gap-2">
      <VUMeter active={active||listening}/>
      <button
        className={"btn-primary relative overflow-hidden " + (active ? "shadow-neon-green" : "shadow-neon-cyan")}
        onClick={()=>setActive(v=>!v)}
        aria-pressed={active}
        aria-label="Voice control"
        title="Voice control (V = toggle)"
      >
        <Mic size={16}/>
        <span className="hidden sm:inline">{active? "Listening":"Voice"}</span>
        <span className={"pointer-events-none absolute inset-0 rounded-xl " + (active ? "animate-ping bg-[color:var(--neon-2)]/15" : "bg-transparent")}/>
      </button>
    </div>
  );
}
