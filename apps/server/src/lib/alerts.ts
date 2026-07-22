export type AlertType = "INFO" | "WARN" | "ERROR";

export type Alert = {
  id: string;
  type: AlertType;
  message: string;
  ts: number;
};

const alerts: Alert[] = [];
const MAX = 200;

function push(a: Alert) {
  alerts.push(a);
  if (alerts.length > MAX) alerts.splice(0, alerts.length - MAX);
}

export function listAlerts(limit = 100): Alert[] {
  return alerts.slice(-limit).reverse();
}

export function generateAlert(): Alert {
  const types: AlertType[] = ["INFO", "WARN", "ERROR"];
  const pick = types[Math.floor(Math.random() * types.length)]!;
  const a: Alert = {
    id: Math.random().toString(36).slice(2),
    type: pick,
    message:
      pick === "ERROR"
        ? "Unexpected error occurred"
        : pick === "WARN"
          ? "Disk space getting low"
          : "Background job finished",
    ts: Date.now(),
  };
  push(a);
  return a;
}

export function asClientItems(limit = 100) {
  return {
    items: listAlerts(limit).map((a) => ({
      id: a.id,
      type: a.type,
      message: a.message,
      ts: a.ts,
    })),
    total: alerts.length,
  };
}
