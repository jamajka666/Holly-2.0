import { Router } from "express";
import { addAudit, recentAudit, subscribeAudit } from "../lib/audit.js";

export const auditRouter = Router();

auditRouter.get("/audit/recent", (req, res) => {
  const limit = Math.min(Number(req.query.limit || 100), 1000);
  res.json({ items: recentAudit(limit) });
});

auditRouter.get("/audit/stream", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const send = (e: { id: number; event: string }) => {
    res.write(`id: ${e.id}\n`);
    res.write(`event: ${e.event}\n`);
    res.write(`data: ${JSON.stringify(e)}\n\n`);
  };

  const hb = setInterval(() => res.write(`: ping ${Date.now()}\n\n`), 15000);
  const unsub = subscribeAudit(send);

  req.on("close", () => {
    clearInterval(hb);
    unsub();
  });
});

auditRouter.get("/audit/test", (req, res) => {
  const ev = addAudit("AUTH_TEST", String(req.query.userId || "owner"), {
    via: "/audit/test",
  });
  res.json({ ok: true, ev });
});
