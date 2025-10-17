import { Outlet, NavLink } from "react-router-dom";
import { Menu, Mic, Settings as Cog, Cpu, Bell } from "lucide-react";
import { useState } from "react";
import ThemeToggle from "./ThemeToggle";
import VoiceButton from "./VoiceButton";
import CommandPalette from "./CommandPalette";
import VoicePanel from "../voice/VoicePanel";
import { useAlerts } from "../state/alerts";
import useAlertsStream from "../hooks/useAlertsStream";

export default function AppShell() {
  const [open, setOpen] = useState(true);
  const { unread, markAllRead } = useAlerts();
  useAlertsStream();
  return (
    <div className="h-full grid" style={{ gridTemplateColumns: open ? "260px 1fr" : "72px 1fr" }}>
      <aside className="h-full bg-holly-panel border-r border-slate-800/60">
        <div className="p-4 flex items-center gap-3">
          <button className="btn" onClick={() => setOpen(v=>!v)} aria-label="Toggle sidebar"><Menu size={18}/></button>
          {open && <div className="text-lg glow tracking-widest">HOLLY<span className="text-holly-neon-green"> 2.0</span></div>}
        </div>
        <nav className="px-2 space-y-2">
          <NavItem to="/" icon={<Cpu size={16}/>} label="Dashboard" open={open}/>
          <NavItem to="/devices" icon={<Mic size={16}/>} label="Devices" open={open}/>
          <NavItem to="/notifications" icon={<Bell size={16}/>} label="Notifications" open={open}/>
          <NavItem to="/settings" icon={<Cog size={16}/>} label="Settings" open={open}/>
        </nav>
      </aside>
      <main className="h-full flex flex-col">
        <header className="flex items-center justify-between border-b border-slate-800/60 px-4 py-3 bg-holly-panel/60 backdrop-blur">
          <div className="flex items-center gap-2">
            <CommandPalette />
          </div>
          <div className="flex items-center gap-3">
            <button className="btn relative" onClick={markAllRead} title="Notifications">
              <Bell size={16}/>
              {unread > 0 && (
                <span className="absolute -top-2 -right-2 text-xs px-1.5 py-0.5 rounded-full bg-holly-neon-green/20 border border-holly-neon-green/40">
                  {unread}
                </span>
              )}
            </button>
            <ThemeToggle/>
            <VoiceButton/>
          </div>
        </header>
  <a href="#content" className="sr-only focus:not-sr-only absolute left-2 top-2 bg-holly-panel px-3 py-1 rounded-lg border border-slate-700/60">Skip to content</a>
  <div id="content" className="flex-1 overflow-auto p-4 bg-[image:var(--bg-carbon)]"><Outlet/></div>
  <VoicePanel />
      </main>
    </div>
  );
}

function NavItem({ to, icon, label, open }: { to:string; icon:React.ReactNode; label:string; open:boolean }) {
  return (
    <NavLink
      to={to}
      end
      className={({isActive}) =>
        "flex items-center gap-3 px-3 py-2 rounded-xl border border-transparent hover:border-slate-700/60 " +
        (isActive ? "bg-holly-mut shadow-neon-cyan" : "")
      }
    >
      {icon}
      {open && <span>{label}</span>}
    </NavLink>
  );
}
