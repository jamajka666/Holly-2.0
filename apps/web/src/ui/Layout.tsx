import React from "react";
import { theme } from "./Theme";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className={theme.page}>
      <header className={theme.header}>
        <h1 className={theme.title}>
          <span className="text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,.8)]">Holly 2.0</span>{" "}
          <span className="text-neutral-500">M3.8</span>
        </h1>
      </header>
      <main className={theme.container}>{children}</main>
    </div>
  );
}

