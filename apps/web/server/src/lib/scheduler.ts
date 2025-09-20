import cron, { ScheduledTask } from "node-cron";
import { notifyAll } from "./push";
import { normalizeCronOrThrow } from "./cron";
import * as Models from "../models";

type AlertLike = {
  id: number;
  title: string;
  message: string;
  cron: string | null;
  at: string | null;
  active: boolean;
};

type Task = ScheduledTask | { stop: () => void };
const tasks = new Map<number, Task>();

function toPojo(row: any): AlertLike {
  return typeof row?.toJSON === "function" ? row.toJSON() : row;
}

async function fire(a: AlertLike) {
  await notifyAll({ type: "alert", title: a.title, message: a.message });
}

export function unschedule(id: number) {
  const t = tasks.get(id);
  if (!t) return;
  try { t.stop(); } catch {/* ignore */}
  tasks.delete(id);
}

export function scheduleOne(alertRow: any) {
  const a = toPojo(alertRow) as AlertLike;
  unschedule(a.id);

  if (!a.active) return;

  // 1) CRON
  if (a.cron) {
    let expr: string;
    try {
      expr = normalizeCronOrThrow(a.cron);
    } catch (e: any) {
      console.warn(`[scheduler] invalid cron for id=${a.id} (${a.cron}): ${e?.message || e}`);
      return;
    }
    // v aktuálním node-cron nepředáváme { scheduled: ... } – defaultně se spustí
    const task = cron.schedule(expr, () => { void fire(a); });
    tasks.set(a.id, task);
    return;
  }

  // 2) Jednorázové "at"
  if (a.at) {
    const when = new Date(a.at);
    if (isNaN(when.getTime())) {
      console.warn(`[scheduler] invalid at for id=${a.id}: ${a.at}`);
      return;
    }
    const delay = when.getTime() - Date.now();
    if (delay <= 0) {
      console.warn(`[scheduler] at is in the past for id=${a.id}: ${a.at}`);
      return;
    }
    const h = setTimeout(async () => {
      try { await fire(a); }
      finally { clearTimeout(h); tasks.delete(a.id); }
    }, delay);
    tasks.set(a.id, { stop: () => clearTimeout(h) });
    return;
  }

  console.warn(`[scheduler] alert id=${a.id} has neither cron nor at – skipping`);
}

export async function rescheduleAll() {
  const AlertModel: any = (Models as any).Alert ?? (Models as any).default?.Alert;
  if (!AlertModel?.findAll) {
    console.error("[scheduler] Unable to load Alert model; skipping rescheduleAll()");
    return;
  }
  const rows = await AlertModel.findAll();
  for (const row of rows) {
    try { scheduleOne(row); }
    catch (e: any) { console.error("[scheduler] failed to schedule id=", row?.id, e?.message || e); }
  }
}
