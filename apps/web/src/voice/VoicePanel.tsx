import { useEffect, useState } from "react";
import VUMeter from "./VUMeter";
import { useVoice } from "./state";
import { useVoiceRouter } from "./router";

export default function VoicePanel(){
  const { listening, setListening, interim, logs, clearLogs, getSuggestions } = useVoice();
  const { handle } = useVoiceRouter();
  const [open, setOpen] = useState(false);

  // Klávesová zkratka: Ctrl+Shift+V
  useEffect(()=>{
    const onKey = (e: KeyboardEvent)=>{
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase()==="v") {
        e.preventDefault(); setOpen(v=>!v);
      }
    };
    window.addEventListener("keydown", onKey);
    return ()=> window.removeEventListener("keydown", onKey);
  },[]);

  const suggestions = getSuggestions();

  return (
    <>
      <button
        className="btn fixed right-4 bottom-4 z-[1000] bg-[color:var(--mut)]"
        onClick={()=>setOpen(true)}
        title="Voice panel (Ctrl+Shift+V)"
        aria-label="Open voice panel"
      >
        🎤 Voice
      </button>

      {open && (
        <div role="dialog" aria-modal className="fixed inset-0 z-[1200] bg-black/40 backdrop-blur-sm">
          <div className="absolute right-6 top-16 w-[520px] max-w-[92vw] bg-[color:var(--panel)] border border-slate-700/60 rounded-2xl shadow-2xl">
            <header className="flex items-center justify-between p-3 border-b border-slate-800/60">
              <div className="flex items-center gap-2">
                <VUMeter active={listening}/>
                <span className="glow text-sm">Voice Center</span>
              </div>
              <div className="flex items-center gap-2">
                <button className="btn" onClick={()=>setListening(!listening)} aria-pressed={listening}>
                  {listening ? "Stop" : "Listen"}
                </button>
                <button className="btn" onClick={()=>setOpen(false)} aria-label="Close">✕</button>
              </div>
            </header>

            <div className="p-3 space-y-3">
              {/* Live transcript */}
              <div className="rounded-xl border border-slate-800/60 p-3 bg-[color:var(--mut)] min-h-12">
                <div className="text-xs opacity-70 mb-1">Live transcript</div>
                <div className="text-sm">{interim || <span className="opacity-50">…</span>}</div>
              </div>

              {/* Quick text command */}
              <div className="flex gap-2">
                <input
                  placeholder="Napiš příkaz (Enter odešle)…"
                  className="flex-1 px-3 py-2 rounded-xl bg-[color:var(--mut)] border border-slate-800/60"
                  onKeyDown={(e)=>{
                    if (e.key==="Enter") {
                      const val = (e.currentTarget as HTMLInputElement).value.trim();
                      if (val) { (e.currentTarget as HTMLInputElement).value = ""; handle(val); }
                    }
                  }}
                />
                <button className="btn" onClick={()=>{
                  const el = (document.activeElement as HTMLInputElement);
                  if (el && el.tagName==="INPUT") { const v = el.value.trim(); if (v) { el.value=""; handle(v); } }
                }}>Run</button>
              </div>

              {/* Suggestions */}
              <div>
                <div className="text-xs opacity-70 mb-1">Suggestions</div>
                <div className="flex flex-wrap gap-2">
                  {suggestions.map(s=>(
                    <button key={s.id} className="btn" title={s.hint||s.utterance}
                      onClick={()=>handle(s.utterance)}>
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* History */}
              <div>
                <div className="flex items-center justify-between">
                  <div className="text-xs opacity-70 mb-1">History</div>
                  <button className="btn px-2 py-1 text-xs" onClick={clearLogs}>Clear</button>
                </div>
                <ul className="max-h-[40vh] overflow-auto space-y-2 text-sm">
                  {logs.map(l=>(
                    <li key={l.id} className="rounded-xl border border-slate-800/60 p-2 bg-[color:var(--mut)]/70">
                      <div className="text-[11px] opacity-60">{new Date(l.when).toLocaleTimeString()}</div>
                      <div><b>{l.kind.toUpperCase()}</b> — {l.text}</div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
