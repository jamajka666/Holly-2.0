import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': '/apps/web/src'
    }
  },
  server: {
    port: 5173,
    strictPort: true
  }
  base: './' // PWA compatibility
});
