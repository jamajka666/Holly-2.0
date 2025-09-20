import cron from "node-cron";

/** Povolené presety → klasický 5-položkový cron */
export const CRON_PRESETS: Record<string, string> = {
  "@minutely": "* * * * *",
  "@every5m": "*/5 * * * *",
  "@every15m": "*/15 * * * *",
  "@hourly": "0 * * * *",
  "@daily": "0 0 * * *",
  "@weekly": "0 0 * * 1",
  "@monthly": "0 0 1 * *",
  "@yearly": "0 0 1 1 *",
};

/** Vezme vstup, případně preset přemapuje, a ověří `node-cron.validate` */
export function normalizeCronOrThrow(input: unknown): string {
  if (typeof input !== "string") throw new Error("cron musí být string");
  const raw = input.trim();
  if (!raw) throw new Error("cron je prázdný");

  // preset?
  if (raw.startsWith("@")) {
    const mapped = CRON_PRESETS[raw as keyof typeof CRON_PRESETS];
    if (!mapped) throw new Error(`Neznámý preset: ${raw}`);
    return mapped;
  }

  // klasický výraz
  if (!cron.validate(raw)) {
    throw new Error(`Neplatný cron výraz: "${raw}" (očekávám 5 polí, např. "*/5 * * * *")`);
  }
  return raw;
}
