
import React from "react";
import { createRoot } from "react-dom/client";
function App() {
  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ color: "#00ff88" }}>Holly 2.0</h1>
      <p>Frontend ready 🎉</p>
    </div>
  );
}
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
