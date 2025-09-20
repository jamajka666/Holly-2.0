import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
type Accent = "emerald" | "red" | "amber" | "azure"; type Mode = "stealth" | "alert";
type ThemeCtx = { accent: Accent; setAccent: (a: Accent)=>void; mode: Mode; setMode: (m: Mode)=>void; };
const ThemeContext = createContext<ThemeCtx>(null as any);
const ACCENTS: Record<Accent, string> = { emerald:"#00ffb4", red:"#ff2b2b", amber:"#ffb000", azure:"#00E5FF" };
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [accent, setAccent] = useState<Accent>(() => (localStorage.getItem("accent") as Accent) || "emerald");
  const [mode, setMode]     = useState<Mode>(() => (localStorage.getItem("mode") as Mode) || "stealth");
  useEffect(()=>{ localStorage.setItem("accent", accent); }, [accent]);
  useEffect(()=>{ localStorage.setItem("mode", mode); }, [mode]);
  useEffect(()=>{ const r=document.documentElement;
    r.style.setProperty("--accent", ACCENTS[accent]);
    r.style.setProperty("--accent-weak", ACCENTS[accent]+"80");
    r.style.setProperty("--hud-opacity", mode==="stealth"?"0.22":"0.42");
    r.style.setProperty("--rain-alpha", mode==="stealth"?"0.08":"0.16");
  }, [accent, mode]);
  const value = useMemo(()=>({accent,setAccent,mode,setMode}),[accent,mode]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
export const useTheme = () => useContext(ThemeContext);
