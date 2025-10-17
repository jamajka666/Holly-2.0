import { PropsWithChildren } from "react";

export default function Drawer({ open, onClose, title, children }: PropsWithChildren<{open:boolean; onClose:()=>void; title?:string;}>) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[1400]">
      <div className="absolute inset-0 bg-black/50" onClick={onClose}/>
      <aside className="absolute right-0 top-0 h-full w-[520px] max-w-[92vw] bg-[color:var(--panel)] border-l border-slate-800/60 shadow-2xl">
        <header className="flex items-center justify-between p-3 border-b border-slate-800/60">
          <div className="glow">{title}</div>
          <button className="btn" onClick={onClose} aria-label="Close">✕</button>
        </header>
        <div className="p-4 space-y-4 overflow-auto h-[calc(100%-56px)]">
          {children}
        </div>
      </aside>
    </div>
  );
}
