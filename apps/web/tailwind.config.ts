import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: ["./index.html","./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
    extend: {
      colors: {
        holly: {
          bg: "#0b0f12",
          panel: "#12171c",
          mut: "#1a2128",
          neon: {
            green: "#39ff14",
            red: "#ff2e2e",
            orange: "#ff8a00",
            cyan: "#00e5ff",
          },
        },
      },
      boxShadow: {
        "neon-green": "0 0 12px #39ff1477, inset 0 0 8px #39ff1433",
        "neon-red": "0 0 12px #ff2e2e77, inset 0 0 8px #ff2e2e33",
        "neon-cyan": "0 0 12px #00e5ff77, inset 0 0 8px #00e5ff33",
      },
      fontFamily: {
        mono: ["ui-monospace","SFMono-Regular","Menlo","Monaco","Consolas","monospace"],
      },
      backgroundImage: {
        "carbon": "radial-gradient(circle at 25% 25%, #0e1419 0 20%, #0b0f12 20% 40%, #0e1419 40% 60%, #0b0f12 60% 80%, #0e1419 80%)",
        "grid": "linear-gradient(#12171c 1px, transparent 1px), linear-gradient(90deg, #12171c 1px, transparent 1px)",
      },
      backgroundSize: {
        grid: "40px 40px",
      },
    },
  },
  plugins: [],
} satisfies Config;
