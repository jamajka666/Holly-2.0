import React from "react";
import { tokens } from "../styles/tokens";

export default function ThemePreview() {
  return (
    <div className="theme-holly" style={{ background: tokens.colors.black, color: tokens.colors.neonGreen, minHeight: '100vh', padding: tokens.spacing.lg }}>
      <h1 style={{ color: tokens.colors.neonGreen }}>Holly 2.0 Theme Preview</h1>
      <div style={{ margin: tokens.spacing.md }}>
        <div style={{ background: tokens.colors.surface, borderRadius: tokens.radius.md, boxShadow: tokens.shadow.neon, padding: tokens.spacing.lg }}>
          <h2 style={{ color: tokens.colors.neonOrange }}>Primary</h2>
          <button style={{ background: tokens.colors.active, color: tokens.colors.black, borderRadius: tokens.radius.sm, boxShadow: tokens.shadow.neon, padding: tokens.spacing.sm, marginRight: tokens.spacing.sm }}>Active</button>
          <button style={{ background: tokens.colors.inactive, color: tokens.colors.white, borderRadius: tokens.radius.sm, boxShadow: tokens.shadow.sm, padding: tokens.spacing.sm }}>Inactive</button>
        </div>
        <div style={{ marginTop: tokens.spacing.lg }}>
          <span style={{ background: tokens.colors.online, color: tokens.colors.black, borderRadius: tokens.radius.full, padding: tokens.spacing.sm, marginRight: tokens.spacing.sm }}>Online</span>
          <span style={{ background: tokens.colors.offline, color: tokens.colors.white, borderRadius: tokens.radius.full, padding: tokens.spacing.sm }}>Offline</span>
          <span style={{ background: tokens.colors.warning, color: tokens.colors.black, borderRadius: tokens.radius.full, padding: tokens.spacing.sm, marginLeft: tokens.spacing.sm }}>Warning</span>
        </div>
      </div>
    </div>
  );
}
