import { Router } from "express";
import { asClientItems, generateAlert } from "../lib/alerts.js";

export const alertsRouter = Router();

alertsRouter.get("/alerts", (_req, res) => {
  res.json(asClientItems(100));
});

// Alias used by older clients / feature branch
alertsRouter.get("/api/alerts", (_req, res) => {
  res.json(asClientItems(100).items);
});

alertsRouter.get("/api/alerts/stream", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  res.write(`event: hello\ndata: ${JSON.stringify({ ts: Date.now() })}\n\n`);

  const timer = setInterval(() => {
    const a = generateAlert();
    res.write(`event: alert\ndata: ${JSON.stringify(a)}\n\n`);
    res.write(`event: ping\ndata: ${Date.now()}\n\n`);
  }, 5000);

  req.on("close", () => clearInterval(timer));
});
