import React from "react";

export default function CronHelp() {
  return (
    <details className="rounded-xl border border-zinc-700/40 bg-slate-900/60 p-3">
      <summary className="cursor-pointer select-none list-none font-medium">
        🕒 Nápověda CRON (rozklikni)
      </summary>
      <div className="mt-3 text-sm text-zinc-300 space-y-3">
        <div>
          <div className="text-zinc-400">Formát (5 polí):</div>
          <table className="w-full text-left mt-1 border-separate border-spacing-y-1">
            <thead className="text-xs text-zinc-400">
              <tr>
                <th>Min</th><th>Hod</th><th>Den v měsíci</th><th>Měsíc</th><th>Den v týdnu</th>
              </tr>
            </thead>
            <tbody className="text-zinc-200">
              <tr><td>0–59</td><td>0–23</td><td>1–31</td><td>1–12</td><td>0–7 (0/7 = neděle)</td></tr>
            </tbody>
          </table>
        </div>

        <div>
          <div className="text-zinc-400">Zástupné znaky:</div>
          <ul className="list-disc pl-5">
            <li><code>*</code> libovolná hodnota</li>
            <li><code>A-B</code> rozsah (např. <code>8-18</code>)</li>
            <li><code>A,B</code> seznam (např. <code>1,15</code>)</li>
            <li><code>*/n</code> krok (např. <code>*/5</code> každých 5)</li>
          </ul>
        </div>

        <div>
          <div className="text-zinc-400">Příklady:</div>
          <ul className="list-disc pl-5">
            <li><code>*/5 * * * *</code> – každých 5 minut</li>
            <li><code>0 9 * * *</code> – denně v 09:00</li>
            <li><code>0 8-18 * * 1-5</code> – po–pá každou hodinu 08–18</li>
            <li><code>0 0 1 * *</code> – každý 1. den v měsíci v 00:00</li>
          </ul>
        </div>

        <div>
          <div className="text-zinc-400">Presety (zkratky):</div>
          <ul className="list-disc pl-5">
            <li><code>@minutely</code> → <code>* * * * *</code></li>
            <li><code>@every5m</code> → <code>*/5 * * * *</code></li>
            <li><code>@every15m</code> → <code>*/15 * * * *</code></li>
            <li><code>@hourly</code> → <code>0 * * * *</code></li>
            <li><code>@daily</code> → <code>0 0 * * *</code></li>
            <li><code>@weekly</code> → <code>0 0 * * 1</code></li>
            <li><code>@monthly</code> → <code>0 0 1 * *</code></li>
            <li><code>@yearly</code> → <code>0 0 1 1 *</code></li>
          </ul>
          <div className="text-xs text-zinc-500 mt-1">Server výraz ověřuje a presety převádí automaticky.</div>
        </div>
      </div>
    </details>
  );
}
