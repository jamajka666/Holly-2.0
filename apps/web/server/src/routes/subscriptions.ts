import { Router } from "express";
import { addSubscription, removeSubscription } from "../lib/push";

export const subscriptions = Router();

subscriptions.post("/", async (req, res) => {
  const sub = req.body;
  if (!sub?.endpoint || !sub?.keys?.p256dh || !sub?.keys?.auth) return res.status(400).json({ error: "Neplatný subscription" });
  await addSubscription(sub);
  res.status(201).json({ ok: true });
});

subscriptions.delete("/", async (req, res) => {
  const { endpoint } = req.body || {};
  if (!endpoint) return res.status(400).json({ error: "Chybí endpoint" });
  await removeSubscription(endpoint);
  res.status(204).send();
});

// debug count (ponecháváme)
subscriptions.get("/count", (_req, res) => {
  const count = (global as any).SUBS_COUNT ?? 0;
  res.json({ count });
});

export default subscriptions;
