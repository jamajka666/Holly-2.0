
import React from "react";
import { createRoot } from "react-dom/client";
import "./styles/tailwind.css";

const App = () => (
  <div className="min-h-screen bg-zinc-50 text-zinc-900 p-6">
    <div className="max-w-xl mx-auto p-6 rounded-2xl shadow border bg-white">
      <h1 className="text-2xl font-bold">Holly 2.0 – web bootstrap OK</h1>
      <p className="mt-2 opacity-70 text-sm">Tailwind v4 aktivní.</p>
    </div>
  </div>
);

createRoot(document.getElementById("root")!).render(<App />);

// Service worker registrace (PWA/offline)
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/' })
      .then(reg => console.log('SW registered:', reg.scope))
      .catch(err => console.warn('SW registration failed:', err));
  });
}
