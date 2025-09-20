// Jednoduché mapování Tailwind tříd pro přehlednost
export const theme = {
  page: "min-h-screen bg-black text-neutral-100",
  header: "px-4 py-3 border-b border-neutral-800",
  title: "text-xl tracking-wide",
  container: "p-4 max-w-5xl mx-auto",

  card: "card",
  cardTitle: "card-title",

  // neon rámečky (Tailwind 3 + custom shadows)
  neonCyan:   "border-2 border-cyan-400 ring-4 ring-cyan-400/30 shadow-neon-cyan",
  neonGreen:  "border-2 border-green-500 ring-4 ring-green-500/30 shadow-neon-green",
  neonOrange: "border-2 border-orange-500 ring-4 ring-orange-500/30 shadow-neon-orange",

  // tlačítka
  btn: "btn",
  btnGhost: "bg-transparent border-neutral-700 hover:border-neutral-500",
  btnCyan: "border-cyan-400 text-cyan-200 hover:bg-cyan-400/10",
  btnGreen: "border-green-500 text-green-300 hover:bg-green-500/10",
  btnOrange: "border-orange-500 text-orange-300 hover:bg-orange-500/10",
};

