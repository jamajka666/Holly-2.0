import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import "./index.css";
import { bootTheme } from "./theme/tokens";
import { router } from "./router";
import { ToastProvider } from "./lib/toast";
import { AlertsProvider } from "./state/alerts";
import { VoiceProvider } from "./voice/state";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ToastProvider>
      <AlertsProvider>
        <VoiceProvider>
          <RouterProvider router={router} />
        </VoiceProvider>
      </AlertsProvider>
    </ToastProvider>
  </React.StrictMode>
);

// boot theme profile from localStorage
bootTheme();

// Service worker registrace (PWA/offline)
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/' })
      .then(reg => console.log('SW registered:', reg.scope))
      .catch(err => console.warn('SW registration failed:', err));
  });
}

if (import.meta.env.DEV) {
  import("./mocks/sseDev").then(m => m.bootDevSSEPolyfill());
  import("./mocks/devApi").then(m => m.bootDevApiMocks());
}
