
import React, { useState } from "react";
import { tokens } from "./styles/tokens";


import ThemePreview from "./pages/ThemePreview";
import VoiceButton from "./components/VoiceButton";
import KnowledgePanel from "./components/KnowledgePanel";

type BtnProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "danger" | "warning" | "ghost";
};

const NeonButton: React.FC<BtnProps> = ({ variant = "primary", children, ...rest }) => {
  const styles: React.CSSProperties = {
    background:
      variant === "primary"
        ? tokens.colors.active
        : variant === "danger"
        ? tokens.colors.neonRed
        : variant === "warning"
        ? tokens.colors.neonOrange
        : "transparent",
    color:
      variant === "ghost"
        ? tokens.colors.neonGreen
        : variant === "danger"
        ? tokens.colors.white
        : tokens.colors.black,
    borderRadius: tokens.radius.sm,
    boxShadow:
      variant === "primary"
        ? tokens.shadow.neon
        : variant === "danger"
        ? tokens.shadow.md
        : variant === "warning"
        ? tokens.shadow.neon
        : "none",
    padding: tokens.spacing.sm,
    marginRight: tokens.spacing.sm,
    border: variant === "ghost" ? `1px solid ${tokens.colors.neonGreen}` : "none",
    outline: "none",
    cursor: "pointer",
    minWidth: 80,
  };
  return (
    <button style={styles} {...rest}>
      {children}
    </button>
  );
};

function NeonCard({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div
      style={{
        background: tokens.colors.surface,
        borderRadius: tokens.radius.md,
        boxShadow: tokens.shadow.md,
        padding: tokens.spacing.lg,
        marginBottom: tokens.spacing.lg,
        color: tokens.colors.white,
      }}
    >
      <div style={{ marginBottom: tokens.spacing.sm, fontWeight: 700, color: tokens.colors.neonGreen }}>{title}</div>
      <div>{children}</div>
    </div>
  );
}


import { BrowserRouter, Routes, Route, Link } from "react-router-dom";

export default function App() {
  const [armed, setArmed] = useState(false);
  return (
    <BrowserRouter>
      <div style={{ background: tokens.colors.black, minHeight: "100vh", color: tokens.colors.white }}>
        <header style={{ padding: tokens.spacing.md, borderBottom: `1px solid ${tokens.colors.border}` }}>
          <div style={{ fontWeight: 700, color: tokens.colors.neonGreen, fontSize: 24 }}>Holly 2.0</div>
          <div style={{ color: tokens.colors.neonOrange, fontSize: 14 }}>Dark Neon Carbon UI</div>
          <nav style={{ marginTop: tokens.spacing.sm }}>
            <Link to="/" style={{ color: tokens.colors.neonGreen, marginRight: tokens.spacing.md }}>Home</Link>
            <Link to="/theme" style={{ color: tokens.colors.neonOrange }}>ThemePreview</Link>
          </nav>
        </header>
        <main style={{ padding: tokens.spacing.lg }}>
          <KnowledgePanel />
          <Routes>
            <Route
              path="/"
              element={
                <>
                  <NeonCard title="Control Panel">
                    <div>
                      <NeonButton onClick={() => setArmed((v) => !v)}>
                        {armed ? "🟢 Armed" : "⚪ Disarmed"}
                      </NeonButton>
                      <NeonButton variant="warning">⚠ Audit</NeonButton>
                      <NeonButton variant="danger">⛔ Lockdown</NeonButton>
                      <NeonButton variant="ghost">🛈 Status</NeonButton>
                    </div>
                    <div style={{ marginTop: tokens.spacing.sm, color: tokens.colors.neonGreen }}>
                      Tip: tlačítka mají glow + focus ring pro klávesnici.
                    </div>
                  </NeonCard>
                  <NeonCard title="Modules">
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: tokens.spacing.md }}>
                      <div>
                        <div style={{ fontWeight: 600, color: tokens.colors.neonGreen }}>Vault</div>
                        <div style={{ color: tokens.colors.gray }}>Encrypted store, PIN/Voice 2FA</div>
                        <NeonButton style={{ width: "100%" }}>Open</NeonButton>
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: tokens.colors.neonGreen }}>Devices</div>
                        <div style={{ color: tokens.colors.gray }}>Manage paired hardware</div>
                        <NeonButton variant="warning" style={{ width: "100%" }}>Scan</NeonButton>
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: tokens.colors.neonGreen }}>Alerts</div>
                        <div style={{ color: tokens.colors.gray }}>Rules & realtime events</div>
                        <NeonButton variant="danger" style={{ width: "100%" }}>Clear</NeonButton>
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: tokens.colors.neonGreen }}>Assistant</div>
                        <div style={{ color: tokens.colors.gray }}>Voice control & intents</div>
                        <NeonButton variant="ghost" style={{ width: "100%" }}>Configure</NeonButton>
                      </div>
                    </div>
                  </NeonCard>
                  <VoiceButton />
                </>
              }
            />
            <Route path="/theme" element={<ThemePreview />} />
          </Routes>
        </main>
        <footer style={{ padding: tokens.spacing.md, borderTop: `1px solid ${tokens.colors.border}` }}>
          <span style={{ background: tokens.colors.online, color: tokens.colors.black, borderRadius: tokens.radius.full, padding: tokens.spacing.sm, marginRight: tokens.spacing.sm }}>ONLINE</span>
          <span style={{ background: tokens.colors.warning, color: tokens.colors.black, borderRadius: tokens.radius.full, padding: tokens.spacing.sm, marginRight: tokens.spacing.sm }}>SYNC LAG</span>
          <span style={{ background: tokens.colors.offline, color: tokens.colors.white, borderRadius: tokens.radius.full, padding: tokens.spacing.sm }}>FIREWALL TEST</span>
        </footer>
      </div>
    </BrowserRouter>
  );
}

