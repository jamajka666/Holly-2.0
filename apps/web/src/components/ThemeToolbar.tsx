import React from "react";
import { useTheme } from "../theme/ThemeProvider";

export default function ThemeToolbar() {
  const { accent, setAccent, mode, setMode } = useTheme();
  return (
    <div className="fixed top-3 right-3 z-50 flex items-center gap-2 bg-black/60 backdrop-blur px-3 py-2 rounded-xl border border-white/10">
      <select
        className="bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-xs"
        value={accent}
        onChange={e => setAccent(e.target.value as any)}
      >
        <option value="emerald">Emerald (zelená)</option>
        <option value="red">Červená</option>
        <option value="amber">Oranžová</option>
        <option value="azure">Azuro</option>
      </select>

      <button
        onClick={() => setMode(mode === "stealth" ? "alert" : "stealth")}
        className="text-xs px-2 py-1 rounded-lg border border-white/10 hover:border-white/20"
        title="Stealth/Alert mód"
      >
        {mode === "stealth" ? "Stealth" : "Alert"}
      </button>
    </div>
  );
}
