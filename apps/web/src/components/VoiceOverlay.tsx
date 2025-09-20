import React from "react";

export default function VoiceOverlay({ transcript, error }: { transcript: string; error: string }) {
  if (!transcript && !error) return null;
  return (
    <div style={{ position: "fixed", bottom: 100, right: 32, zIndex: 1001 }}>
      {transcript && (
        <div style={{ background: "#181a20", color: "#39ff14", padding: 8, borderRadius: 8, marginBottom: 8, boxShadow: "0 1px 4px #23272e" }}>
          {transcript}
        </div>
      )}
      {error && (
        <div style={{ background: "#ff1744", color: "#fff", padding: 8, borderRadius: 8, boxShadow: "0 1px 4px #23272e" }}>
          <strong>Chyba:</strong> {error}
        </div>
      )}
    </div>
  );
}
