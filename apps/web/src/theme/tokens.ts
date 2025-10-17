export type ThemeProfile = "holly" | "shadowguard";

const THEMES: Record<ThemeProfile, Record<string,string>> = {
  holly: {
    "--bg": "#0b0f12",
    "--panel": "#12171c",
    "--mut": "#1a2128",
    "--neon-1": "#00e5ff",
    "--neon-2": "#39ff14",
    "--alert": "#ff2e2e",
    "--accent": "#ff8a00",
  },
  shadowguard: {
    "--bg": "#0a0a0a",
    "--panel": "#111216",
    "--mut": "#181a20",
    "--neon-1": "#00b3ff",
    "--neon-2": "#ff1a1a",
    "--alert": "#ff4545",
    "--accent": "#ff5500",
  }
};
const LS_KEY = "holly.theme.profile";

export function applyProfile(p: ThemeProfile){
  const root = document.documentElement;
  const vars = THEMES[p];
  Object.entries(vars).forEach(([k,v])=> root.style.setProperty(k, v));
  try{ localStorage.setItem(LS_KEY, p); }catch{}
}

export function bootTheme(){
  const saved = (localStorage.getItem(LS_KEY) as ThemeProfile) || "holly";
  applyProfile(saved);
  return saved;
}

export function getProfiles(): Array<{id:ThemeProfile; label:string}>{
  return [
    { id:"holly", label:"Holly (cyan+green)" },
    { id:"shadowguard", label:"ShadowGuard (cyan+red)" },
  ];
}
