import React, { useState } from "react";

type BtnProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "danger" | "warning" | "ghost";
};

const NeonButton: React.FC<BtnProps> = ({ variant = "primary", children, ...rest }) => {
  return (
    <button className={`neon-btn ${variant}`} {...rest}>
      <span className="btn-edge" />
      <span className="btn-content">{children}</span>
    </button>
  );
};

function NeonCard({
  title,
  children,
}: {
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="neon-card">
      <div className="card-header">
        <span className="dot red" />
        <span className="dot yellow" />
        <span className="dot green" />
        <span className="title">{title}</span>
      </div>
      <div className="card-body">{children}</div>
      <div className="scanline" />
    </div>
  );
}

export default function App() {
  const [armed, setArmed] = useState(false);

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="badge">Holly 2.0</span>
          <span className="subtitle">Dark Neon Carbon UI</span>
        </div>
        <div className="toolbar">
          <NeonButton>Primary</NeonButton>
          <NeonButton variant="warning">Warn</NeonButton>
          <NeonButton variant="danger">Danger</NeonButton>
          <NeonButton variant="ghost">Ghost</NeonButton>
        </div>
      </header>

      <main className="container">
        <NeonCard title="Control Panel">
          <div className="row">
            <NeonButton onClick={() => setArmed((v) => !v)}>
              {armed ? "🟢 Armed" : "⚪ Disarmed"}
            </NeonButton>
            <NeonButton variant="warning">⚠ Audit</NeonButton>
            <NeonButton variant="danger">⛔ Lockdown</NeonButton>
            <NeonButton variant="ghost">🛈 Status</NeonButton>
          </div>
          <div className="hint">Tip: tlačítka mají glow + focus ring pro klávesnici.</div>
        </NeonCard>

        <NeonCard title="Modules">
          <div className="grid">
            <div className="tile">
              <div className="tile-title">Vault</div>
              <div className="tile-desc">Encrypted store, PIN/Voice 2FA</div>
              <NeonButton className="w-full">Open</NeonButton>
            </div>
            <div className="tile">
              <div className="tile-title">Devices</div>
              <div className="tile-desc">Manage paired hardware</div>
              <NeonButton variant="warning" className="w-full">Scan</NeonButton>
            </div>
            <div className="tile">
              <div className="tile-title">Alerts</div>
              <div className="tile-desc">Rules & realtime events</div>
              <NeonButton variant="danger" className="w-full">Clear</NeonButton>
            </div>
            <div className="tile">
              <div className="tile-title">Assistant</div>
              <div className="tile-desc">Voice control & intents</div>
              <NeonButton variant="ghost" className="w-full">Configure</NeonButton>
            </div>
          </div>
        </NeonCard>
      </main>

      <footer className="statusbar">
        <span className="pill ok">ONLINE</span>
        <span className="pill warn">SYNC LAG</span>
        <span className="pill danger">FIREWALL TEST</span>
      </footer>
    </div>
  );
}

